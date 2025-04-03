import { useState } from 'react';
import JSZip from 'jszip';
import { webcontainer } from '~/lib/webcontainer';
import type { WebContainer } from '@webcontainer/api';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { convexStore } from '~/lib/stores/convex';

interface ErrorResponse {
  error: string;
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  className?: string;
  title?: string;
}

function Button({ active = false, disabled = false, children, onClick, className, title }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center gap-2 px-3 py-1.5 border border-bolt-elements-borderColor rounded-md',
        {
          'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
            !active,
          'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': active && !disabled,
          'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
            disabled,
        },
        className,
      )}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function DeployButton() {
  const [status, setStatus] = useState<'idle' | 'building' | 'zipping' | 'deploying' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const convex = useStore(convexStore);

  const addFilesToZip = async (container: WebContainer, zip: JSZip, basePath: string, currentPath: string = '') => {
    const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
    const entries = await container.fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await addFilesToZip(container, zip, basePath, entryPath);
      } else if (entry.isFile()) {
        const content = await container.fs.readFile(`${basePath}/${entryPath}`);
        zip.file(entryPath, content);
      }
    }
  };

  const handleDeploy = async () => {
    try {
      setStatus('building');
      setErrorMessage('');
      const container = await webcontainer;

      // Run the build command
      const buildProcess = await container.spawn('npx', ['vite', 'build', '--mode', 'development']);
      let buildOutput = '';
      buildProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            buildOutput += data;
          },
        }),
      );
      const exitCode = await buildProcess.exit;
      if (exitCode !== 0) {
        throw new Error(`Build failed: ${buildOutput}`);
      }

      setStatus('zipping');
      const zip = new JSZip();
      await addFilesToZip(container, zip, 'dist');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      setStatus('deploying');
      const formData = new FormData();
      formData.append('file', zipBlob, 'dist.zip');
      formData.append('deploymentName', convex!.deploymentName);
      formData.append('token', convex!.token);

      const response = await fetch('/api/deploy-simple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse | null;
        throw new Error(errorData?.error ?? 'Deployment failed');
      }

      setStatus('idle');
    } catch (error) {
      console.error('Deployment error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Deployment failed');
    }
  };

  const isLoading = status === 'building' || status === 'zipping' || status === 'deploying';
  const isDisabled = isLoading || !convex;

  const getButtonText = () => {
    switch (status) {
      case 'building':
        return 'Building...';
      case 'zipping':
        return 'Creating package...';
      case 'deploying':
        return 'Deploying...';
      case 'error':
        return 'Deploy';
      default:
        return 'Deploy';
    }
  };

  return (
    <Button
      disabled={isDisabled}
      onClick={handleDeploy}
      title={status === 'error' ? errorMessage : undefined}
      className="mr-4"
    >
      <div className={classNames('w-4 h-4', isLoading ? 'i-ph:spinner-gap animate-spin' : 'i-ph:rocket-launch')} />
      <span>{getButtonText()}</span>
    </Button>
  );
}
