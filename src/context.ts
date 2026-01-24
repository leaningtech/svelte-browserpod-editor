/**
 * BrowserPodEditor Svelte context for child state management
 */
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { TreeNode, TerminalConfig } from './types';

const CONTEXT_KEY = Symbol('BrowserPodEditor');

export interface BrowserPodEditorContext {
  /** Whether BrowserPod is running and ready */
  browserPodRunning: Writable<boolean>;
  /** Whether the file system is ready */
  fileSysReady: Writable<boolean>;
  /** Currently selected file path */
  selectedFile: Writable<string>;
  /** Content of the currently selected file */
  fileContent: Writable<string>;
  /** Portal URL for the preview */
  portalUrl: Writable<string>;
  /** Whether the sidebar is open */
  isSidebarOpen: Writable<boolean>;
  /** File tree structure */
  fileTree: Writable<TreeNode[]>;
  /** Registered terminals */
  terminals: Writable<Map<string, TerminalConfig>>;
  /** Load file content */
  loadFile: (filename: string) => Promise<string>;
  /** Save file content */
  saveFile: (filename: string, content: string) => Promise<boolean>;
  /** Register a terminal panel */
  registerTerminal: (config: TerminalConfig) => void;
  /** Unregister a terminal panel */
  unregisterTerminal: (id: string) => void;
  /** Run a single command in a specific terminal */
  runCommand: (terminalId: string, command: string[]) => Promise<void>;
  /** Run multiple commands sequentially in a specific terminal */
  runCommands: (terminalId: string, commands: string[][], stopOnError?: boolean) => Promise<void>;
}

export function createBrowserPodEditorContext(): BrowserPodEditorContext {
  const terminalsMap = new Map<string, TerminalConfig>();
  const terminals = writable(terminalsMap);

  const context: BrowserPodEditorContext = {
    browserPodRunning: writable(false),
    fileSysReady: writable(false),
    selectedFile: writable(''),
    fileContent: writable(''),
    portalUrl: writable(''),
    isSidebarOpen: writable(true),
    fileTree: writable([]),
    terminals,
    loadFile: async () => '',
    saveFile: async () => false,
    registerTerminal: (config: TerminalConfig) => {
      terminals.update(map => {
        map.set(config.id, config);
        return map;
      });
    },
    unregisterTerminal: (id: string) => {
      terminals.update(map => {
        map.delete(id);
        return map;
      });
    },
    runCommand: async () => {},
    runCommands: async () => {},
  };

  setContext(CONTEXT_KEY, context);
  return context;
}

export function getBrowserPodEditorContext(): BrowserPodEditorContext {
  const context = getContext<BrowserPodEditorContext>(CONTEXT_KEY);
  if (!context) {
    throw new Error('BrowserPodEditorContext not found. Make sure this component is used within BrowserPodEditor.');
  }
  return context;
}
