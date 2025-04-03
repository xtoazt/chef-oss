import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';
import { loadSnapshot } from '~/lib/snapshot';
import { waitForConvexProjectConnection, type ConvexProject } from '~/lib/stores/convex';
import { createScopedLogger } from '~/utils/logger';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

const logger = createScopedLogger('webcontainer');

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        const { workbenchStore } = await import('~/lib/stores/workbench');
        console.log('Rebooting webcontainer');
        await loadSnapshot(webcontainer, workbenchStore);
        webcontainerContext.loaded = true;

        if(window.location.pathname !== '/admin/build-snapshot') {

          logger.info('Waiting for Convex project connection...');
          const convexProject = await waitForConvexProjectConnection();

          logger.info('Setting up Convex env vars...');
          await setupConvexEnvVars(webcontainer, convexProject);
          logger.info('Initializing Convex Auth...');
          const { initializeConvexAuth } = await import('../convexAuth');
          await initializeConvexAuth(convexProject);

          // Listen for preview errors
          webcontainer.on('preview-message', (message) => {
            logger.info('WebContainer preview message:', message);

            // Handle both uncaught exceptions and unhandled promise rejections
            if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
              const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
              workbenchStore.actionAlert.set({
                type: 'preview',
                title: isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception',
                description: message.message,
                content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
                source: 'preview',
              });
            }
          });
        }

        logger.info('Done booting WebContainer!');
        (globalThis as any).webcontainer = webcontainer;
        return webcontainer;
      })
      .catch((error) => {
        logger.error('Error booting WebContainer:', error);
        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}

async function setupConvexEnvVars(webcontainer: WebContainer, convexProject: ConvexProject) {
  const { token } = convexProject;

  const envFilePath = '.env.local';
  const envVarName = 'CONVEX_DEPLOY_KEY';
  const envVarLine = `${envVarName}=${token}\n`;

  let content: string | null = null;
  try {
    content = await webcontainer.fs.readFile(envFilePath, 'utf-8');
  } catch (err: any) {
    if (!err.toString().includes('ENOENT')) {
      throw err;
    }
  }

  if (content === null) {
    // Create the file if it doesn't exist
    await webcontainer.fs.writeFile(envFilePath, envVarLine);
    logger.debug('Created .env.local with Convex token');
  } else {
    const lines = content.split('\n');

    // Check if the env var already exists
    const envVarExists = lines.some((line) => line.startsWith(`${envVarName}=`));

    if (!envVarExists) {
      // Add the env var to the end of the file
      const newContent = content.endsWith('\n') ? `${content}${envVarLine}` : `${content}\n${envVarLine}`;
      await webcontainer.fs.writeFile(envFilePath, newContent);
      logger.debug('Added Convex token to .env.local');
    } else {
      logger.debug('Convex token already exists in .env.local');
    }
  }
}
