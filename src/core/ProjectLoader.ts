/**
 * ProjectLoader - Load projects from various sources (local, zip, GitHub)
 */
import type { ProjectSource, ProjectFile, TreeNode, FolderNode, FileNode } from '../types.ts';
import { loadManifest } from './ManifestLoader.ts';

export interface LoadedProject {
  files: ProjectFile[];
  fileTree: TreeNode[];
}

/**
 * Check if a project source requires VM-based loading (to bypass CORS)
 */
export function requiresVmLoading(source: ProjectSource): boolean {
  return source.type === 'github' || (source.type === 'zip' && !!source.useVm);
}

/**
 * Get the zip URL for VM-based loading
 */
export function getVmLoadConfig(source: ProjectSource): { url: string; stripPrefix: boolean; subPath?: string } | null {
  if (source.type === 'github') {
    const ref = source.ref || 'main';
    return {
      url: `https://api.github.com/repos/${source.owner}/${source.repo}/zipball/${ref}`,
      stripPrefix: true,
      subPath: source.path
    };
  }
  if (source.type === 'zip' && source.useVm) {
    return {
      url: source.url,
      stripPrefix: source.stripPrefix ?? true,
      subPath: undefined
    };
  }
  return null;
}

/**
 * Load a project from the specified source (browser-based loading)
 * For GitHub sources, use loadProjectViaVm instead
 */
export async function loadProject(source: ProjectSource): Promise<LoadedProject> {
  switch (source.type) {
    case 'local':
      return loadLocalProject(source.path, source.manifestPath);
    case 'zip':
      if (source.useVm) {
        throw new Error('Zip source with useVm=true must be loaded via loadProjectViaVm');
      }
      return loadZipProject(source.url, source.stripPrefix);
    case 'github':
      throw new Error('GitHub source must be loaded via VM to bypass CORS. Use loadProjectViaVm instead.');
    default:
      throw new Error(`Unknown project source type: ${(source as any).type}`);
  }
}


/**
 * Load project from local static directory using manifest
 */
async function loadLocalProject(path: string, manifestPath?: string): Promise<LoadedProject> {
  const manifest = manifestPath || `${path}/manifest.txt`;
  const filePaths = await loadManifest(manifest);

  const files: ProjectFile[] = await Promise.all(
    filePaths.map(async (filePath) => {
      const response = await fetch(`${path}/${filePath}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return {
        path: filePath,
        content: new Uint8Array(buffer)
      };
    })
  );

  return {
    files,
    fileTree: buildFileTreeFromPaths(filePaths)
  };
}

/**
 * Load project from a zip URL
 * @param url URL to zip file
 * @param stripPrefix Whether to strip the leading directory (common in GitHub archives)
 * @param subPath Optional subdirectory to extract (only files under this path)
 */
async function loadZipProject(url: string, stripPrefix = true, subPath?: string): Promise<LoadedProject> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch zip from ${url}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return extractZipBuffer(arrayBuffer, stripPrefix, subPath);
}

/**
 * Extract a zip from an ArrayBuffer
 * @param arrayBuffer The zip file contents
 * @param stripPrefix Whether to strip the leading directory
 * @param subPath Optional subdirectory to extract
 */
export async function extractZipBuffer(arrayBuffer: ArrayBuffer, stripPrefix = true, subPath?: string): Promise<LoadedProject> {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(arrayBuffer);

  const files: ProjectFile[] = [];
  const filePaths: string[] = [];

  // Find common prefix to strip (e.g., "repo-main/")
  let prefix = '';
  if (stripPrefix) {
    const allPaths = Object.keys(zip.files);
    if (allPaths.length > 0) {
      const firstPath = allPaths[0];
      const slashIndex = firstPath.indexOf('/');
      if (slashIndex > 0) {
        const potentialPrefix = firstPath.substring(0, slashIndex + 1);
        // Check if all paths start with this prefix
        if (allPaths.every(p => p.startsWith(potentialPrefix))) {
          prefix = potentialPrefix;
        }
      }
    }
  }

  // If subPath is specified, add it to the prefix for filtering
  const fullPrefix = subPath ? `${prefix}${subPath}/`.replace(/\/+/g, '/') : prefix;

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    // Skip directories
    if (zipEntry.dir) continue;

    // If subPath specified, only include files under that path
    if (subPath && !path.startsWith(fullPrefix)) continue;

    // Strip prefix
    let filePath = path;
    if (fullPrefix && path.startsWith(fullPrefix)) {
      filePath = path.substring(fullPrefix.length);
    } else if (prefix && path.startsWith(prefix)) {
      filePath = path.substring(prefix.length);
    }

    // Skip empty paths
    if (!filePath) continue;

    const content = await zipEntry.async('uint8array');
    files.push({ path: filePath, content });
    filePaths.push(filePath);
  }

  return {
    files,
    fileTree: buildFileTreeFromPaths(filePaths)
  };
}

/**
 * Build file tree from a list of file paths
 */
function buildFileTreeFromPaths(filePaths: string[]): TreeNode[] {
  interface BuildNode {
    type: 'folder' | 'file';
    name: string;
    children?: Map<string, BuildNode>;
  }

  const root: Map<string, BuildNode> = new Map();

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        if (!currentLevel.has(part)) {
          currentLevel.set(part, { type: 'file', name: part });
        }
      } else {
        if (!currentLevel.has(part)) {
          currentLevel.set(part, {
            type: 'folder',
            name: part,
            children: new Map()
          });
        }
        const folderNode = currentLevel.get(part)!;
        if (!folderNode.children) {
          folderNode.children = new Map();
        }
        currentLevel = folderNode.children;
      }
    }
  }

  return convertMapToArray(root);
}

function convertMapToArray(map: Map<string, any>): TreeNode[] {
  const folders: TreeNode[] = [];
  const files: TreeNode[] = [];

  for (const [, node] of map) {
    if (node.type === 'folder') {
      const folderNode: FolderNode = {
        type: 'folder',
        name: node.name,
        files: node.children ? convertMapToArray(node.children) : []
      };
      folders.push(folderNode);
    } else {
      const fileNode: FileNode = { type: 'file', name: node.name };
      files.push(fileNode);
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...folders, ...files];
}
