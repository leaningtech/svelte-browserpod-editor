/**
 * ManifestLoader - Parse manifest.txt and build file tree
 */
import type { TreeNode, FolderNode, FileNode } from '../types.ts';

/**
 * Load and parse a manifest.txt file
 * @param manifestPath Path to the manifest file
 * @returns Array of file paths
 */
export async function loadManifest(manifestPath: string): Promise<string[]> {
  const response = await fetch(manifestPath);
  if (!response.ok) {
    throw new Error(`Failed to load manifest from ${manifestPath}: ${response.statusText}`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

interface BuildNode {
  type: 'folder' | 'file';
  name: string;
  children?: Map<string, BuildNode>;
}

/**
 * Build a file tree structure from a list of file paths
 * @param files Array of file paths
 * @returns Tree structure for sidebar display
 */
export function buildFileTree(files: string[]): TreeNode[] {
  const root: Map<string, BuildNode> = new Map();

  for (const filePath of files) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        // Add file node
        if (!currentLevel.has(part)) {
          currentLevel.set(part, { type: 'file', name: part });
        }
      } else {
        // Add or get folder node
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

  // Convert maps to arrays recursively
  return convertMapToArray(root);
}

function convertMapToArray(map: Map<string, BuildNode>): TreeNode[] {
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

  // Sort folders and files alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...folders, ...files];
}
