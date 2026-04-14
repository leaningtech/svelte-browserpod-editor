/**
 * BrowserPodEditor TypeScript interfaces
 */

export interface FolderNode {
  type: 'folder';
  name: string;
  files: TreeNode[];
}

export interface FileNode {
  type: 'file';
  name: string;
}

export type TreeNode = FileNode | FolderNode;

// Project source types
export interface LocalProjectSource {
  type: 'local';
  /** Path to project in static directory */
  path: string;
  /** Path to manifest file (defaults to {path}/manifest.txt) */
  manifestPath?: string;
}

export interface ZipProjectSource {
  type: 'zip';
  /** URL to zip or tar.gz file */
  url: string;
  /** Optional: strip leading directory from paths (common in GitHub archives) */
  stripPrefix?: boolean;
  /** Use BrowserPod's VM to fetch (bypasses CORS) */
  useVm?: boolean;
}

export interface GithubProjectSource {
  type: 'github';
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch, tag, or commit (defaults to 'main') */
  ref?: string;
  /** Subdirectory within the repo (optional) */
  path?: string;
}

export type ProjectSource = LocalProjectSource | ZipProjectSource | GithubProjectSource;

export interface ProjectFile {
  path: string;
  content: Uint8Array;
}


export interface BrowserPodFileHandle {
  getSize(): Promise<number>;
  read(size: number): Promise<any>;
  write(content: string | ArrayBuffer): Promise<void>;
  close(): Promise<void>;
}

export interface RunCommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  echo?: boolean;
}

export interface BrowserPodInstance {
  onPortal(callback: (data: { url: string; port: number }) => void): void;
  createDefaultTerminal(element: HTMLElement): Promise<any>;
  run(executable: string, args: string[], options?: RunCommandOptions & { terminal?: any }): Promise<void>;
  createDirectory(path: string, options?: { recursive?: boolean }): Promise<void>;
  createFile(path: string, encoding: 'utf-8' | 'binary'): Promise<BrowserPodFileHandle>;
  openFile(path: string, encoding: 'utf-8' | 'binary'): Promise<BrowserPodFileHandle>;
}

export interface BrowserPodServiceOptions {
  pod: Promise<BrowserPodInstance>;
  onPortal?: ({url, port}: {url: string, port: number}) => void;
  onError?: (error: Error) => void;
}


export interface TerminalConfig {
  /** Unique identifier for the terminal */
  id: string;
  /** Internal: the terminal instance */
  terminal?: any;
}

/** Function to run a command in a specific terminal tab, pre-bound to that tab. */
export type TabRun = (command: string, args?: string[], options?: RunCommandOptions) => Promise<void>;

export interface TerminalTab {
  /** Unique ID for this tab's terminal */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Called when BrowserPod is ready and this tab's terminal is initialized */
  onReady?: (run: TabRun) => void;
  /** Called when this tab becomes active */
  onActivate?: (run: TabRun) => void;
}

export interface EditorConfig {
  /** Unique identifier for the editor */
  id: number;
  /** Currently open file path (empty if no file open) */
  filePath: string;
}
