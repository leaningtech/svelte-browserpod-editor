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

export interface BrowserPodEditorProps {
  /** Project source configuration */
  projectSource: ProjectSource;
  /** BrowserPod instance promise (from BrowserPod.boot()) */
  pod: Promise<BrowserPodInstance>;
  /** File to open initially */
  defaultFile?: string;
  /** Show/hide sidebar */
  showSidebar?: boolean;
  /** Show/hide terminal */
  showTerminal?: boolean;
  /** Show/hide preview */
  showPreview?: boolean;
  /** Terminal tabs configuration */
  terminalTabs?: TerminalTab[];
}

export interface BrowserPodFileHandle {
  getSize(): Promise<number>;
  read(size: number): Promise<any>;
  write(content: string | ArrayBuffer): Promise<void>;
  close(): Promise<void>;
}

export interface BrowserPodInstance {
  onPortal(callback: (data: { url: string; port: number }) => void): void;
  createDefaultTerminal(element: HTMLElement): Promise<any>;
  run(executable: string, args: string[], options?: { echo?: boolean; terminal?: any; cwd?: string }): Promise<void>;
  createDirectory(path: string, options?: { recursive?: boolean }): Promise<void>;
  createFile(path: string, encoding: 'utf-8' | 'binary'): Promise<BrowserPodFileHandle>;
  openFile(path: string, encoding: 'utf-8' | 'binary'): Promise<BrowserPodFileHandle>;
}

export interface BrowserPodServiceOptions {
  pod: Promise<BrowserPodInstance>;
  onPortal?: ({url, port}: {url: string, port: number}) => void;
  onError?: (error: Error) => void;
}

export interface ReadyEventDetail {
  service: unknown;
}

export interface PortalReadyEventDetail {
  url: string;
}

export interface ErrorEventDetail {
  type: string;
  message: string;
}

export interface TerminalConfig {
  /** Unique identifier for the terminal */
  id: string;
  /** Sequential commands to run: [[executable, ...args], ...] */
  commands?: string[][];
  /** Whether to auto-run the commands when ready */
  autoRun?: boolean;
  /** Stop executing if a command fails (default: true) */
  stopOnError?: boolean;
  /** Working directory for commands (defaults to BrowserPod's default) */
  cwd?: string;
  /** Internal: the terminal instance */
  terminal?: any;
}

export interface TerminalTab {
  /** Unique ID for this tab's terminal */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Sequential commands to run: [[executable, ...args], ...] */
  commands?: string[][];
  /** Run commands immediately when BrowserPod is ready */
  autoRun?: boolean;
  /** Run commands lazily when tab is first clicked */
  runOnActivate?: boolean;
  /** Stop executing if a command fails (default: true) */
  stopOnError?: boolean;
  /** Working directory for commands (defaults to BrowserPod's default) */
  cwd?: string;
}

export interface EditorConfig {
  /** Unique identifier for the editor */
  id: number;
  /** Currently open file path (empty if no file open) */
  filePath: string;
}
