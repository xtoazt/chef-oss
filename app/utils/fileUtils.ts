import type { DirEnt } from '@webcontainer/api';
import ignore from 'ignore';
import { WORK_DIR } from './constants';
import type { WebContainer } from '@webcontainer/api';

// Common patterns to ignore, similar to .gitignore
export const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
];

export const MAX_FILES = 1000;
export const ig = ignore().add(IGNORE_PATTERNS);

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const isBinaryFile = async (file: File): Promise<boolean> => {
  const chunkSize = 1024;
  const buffer = new Uint8Array(await file.slice(0, chunkSize).arrayBuffer());

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];

    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      return true;
    }
  }

  return false;
};

export const shouldIncludeFile = (path: string): boolean => {
  return !ig.ignores(path);
};

const readPackageJson = async (files: File[]): Promise<{ scripts?: Record<string, string> } | null> => {
  const packageJsonFile = files.find((f) => f.webkitRelativePath.endsWith('package.json'));

  if (!packageJsonFile) {
    return null;
  }

  try {
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(packageJsonFile);
    });

    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error);
    return null;
  }
};

export const detectProjectType = async (
  files: File[],
): Promise<{ type: string; setupCommand: string; followupMessage: string }> => {
  const hasFile = (name: string) => files.some((f) => f.webkitRelativePath.endsWith(name));

  if (hasFile('package.json')) {
    const packageJson = await readPackageJson(files);
    const scripts = packageJson?.scripts || {};

    // Check for preferred commands in priority order
    const preferredCommands = ['dev', 'start', 'preview'];
    const availableCommand = preferredCommands.find((cmd) => scripts[cmd]);

    if (availableCommand) {
      return {
        type: 'Node.js',
        setupCommand: `npm install && npm run ${availableCommand}`,
        followupMessage: `Found "${availableCommand}" script in package.json. Running "npm run ${availableCommand}" after installation.`,
      };
    }

    return {
      type: 'Node.js',
      setupCommand: 'npm install',
      followupMessage:
        'Would you like me to inspect package.json to determine the available scripts for running this project?',
    };
  }

  if (hasFile('index.html')) {
    return {
      type: 'Static',
      setupCommand: 'npx --yes serve',
      followupMessage: '',
    };
  }

  return { type: '', setupCommand: '', followupMessage: '' };
};

export const filesToArtifacts = (files: { [path: string]: { content: string } }, id: string): string => {
  return `
<boltArtifact id="${id}" title="User Updated Files">
${Object.keys(files)
  .map(
    (filePath) => `
<boltAction type="file" filePath="${filePath}">
${files[filePath].content}
</boltAction>
`,
  )
  .join('\n')}
</boltArtifact>
  `;
};

export function workDirRelative(absPath: string) {
  if (absPath === WORK_DIR) {
    return "";
  }
  const withSlash = `${WORK_DIR}/`;
  if (!absPath.startsWith(withSlash)) {
    throw new Error(`Path is not relative to the work directory: ${absPath}`);
  }
  return absPath.slice(withSlash.length);
}

export async function readDir(
  container: WebContainer,
  relPath: string
): Promise<DirEnt<string>[]> {
  const children = await container.fs.readdir(relPath, {
    withFileTypes: true,
  });
  children.sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  return children;
}

export async function readPath(
  container: WebContainer,
  relPath: string
): Promise<
  | { type: "directory"; children: DirEnt<string>[] }
  | { type: "file"; content: string; isBinary: boolean }
> {
  // There isn't a way to stat a path in the container, so try reading
  // it as a directory first.
  try {
    const children = await readDir(container, relPath);
    return { type: "directory", children };
  } catch (e: any) {
    if (typeof e.message !== "string") {
      throw e;
    }
    if (!e.message.startsWith("ENOTDIR")) {
      throw e;
    }
    // If we made it here, the path isn't a directory, so let's
    // try it as a file below.
  }
  const content = await container.fs.readFile(relPath, "utf-8");
  return { type: "file", content, isBinary: false };
}

export function dirname(relPath: string) {
  const lastSlash = relPath.lastIndexOf("/");
  if (lastSlash === -1) {
    return "";
  }
  return relPath.slice(0, lastSlash);
}

export function renderDirectory(children: DirEnt<string>[]) {
  return `Directory:\n${children.map((child) => `- ${child.name} (${child.isDirectory() ? "dir" : "file"})`).join("\n")}`;
}

export function renderFile(content: string, viewRange?: [number, number]) {
  let lines = content.split("\n").map((line, index) => `${index + 1}: ${line}`);
  if (viewRange) {
    // An array of two integers specifying the start and end line numbers
    // to view. Line numbers are 1-indexed, and -1 for the end line means
    // read to the end of the file. This parameter only applies when
    // viewing files, not directories.
    const [start, end] = viewRange;
    if (start < 1 || end < 1) {
      throw new Error("Invalid range: start and end must be greater than 0");
    }
    if (end === -1) {
      lines = lines.slice(start - 1);
    } else {
      lines = lines.slice(start - 1, end);
    }
  }
  //  The view tool result includes file contents with line numbers prepended to each line
  // (e.g., “1: def is_prime(n):”). Line numbers are not required, but they are essential
  // for successfully using the view_range parameter to examine specific sections of files
  // and the insert_line parameter to add content at precise locations.
  return lines.join("\n");
}
