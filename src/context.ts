/**
 * BrowserPodEditor Svelte context for child state management
 */
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { TreeNode, TerminalConfig, EditorConfig } from './types';

const CONTEXT_KEY = Symbol('BrowserPodEditor');

export interface BrowserPodEditorContext {
  /** Whether BrowserPod is running and ready */
  browserPodRunning: Writable<boolean>;
  /** Whether the file system is ready */
  fileSysReady: Writable<boolean>;
  /** Portal URL for the preview */
  portalUrl: Writable<string>;
  /** Whether the sidebar is open */
  isSidebarOpen: Writable<boolean>;
  /** File tree structure */
  fileTree: Writable<TreeNode[]>;
  /** Registered terminals */
  terminals: Writable<Map<string, TerminalConfig>>;
  /** Registered editors */
  editors: Writable<Map<number, EditorConfig>>;
  /** Currently active (focused) editor ID */
  activeEditorId: Writable<number | null>;
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
  /** Register an editor panel and return assigned ID */
  registerEditor: () => number;
  /** Unregister an editor panel */
  unregisterEditor: (id: number) => void;
  /** Set the active (focused) editor */
  setActiveEditor: (id: number) => void;
  /** Open a file in a specific editor */
  openFileInEditor: (editorId: number, path: string) => void;
  /** Open a file in the currently active editor */
  openFileInActiveEditor: (path: string) => void;
}

export function createBrowserPodEditorContext(): BrowserPodEditorContext {
  const terminalsMap = new Map<string, TerminalConfig>();
  const terminals = writable(terminalsMap);

  const editorsMap = new Map<number, EditorConfig>();
  const editors = writable(editorsMap);
  const activeEditorId = writable<number | null>(null);

  // Internal counter for sequential editor IDs
  let nextEditorId = 0;

  const context: BrowserPodEditorContext = {
    browserPodRunning: writable(false),
    fileSysReady: writable(false),
    portalUrl: writable(''),
    isSidebarOpen: writable(true),
    fileTree: writable([]),
    terminals,
    editors,
    activeEditorId,
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
    registerEditor: () => {
      const id = nextEditorId++;
      editors.update(map => {
        map.set(id, { id, filePath: '' });
        return map;
      });
      // First editor (ID 0) becomes active by default
      if (id === 0) {
        activeEditorId.set(0);
      }
      return id;
    },
    unregisterEditor: (id: number) => {
      editors.update(map => {
        map.delete(id);
        return map;
      });
      // If active editor unmounts, activate lowest remaining ID (or null)
      activeEditorId.update(currentActive => {
        if (currentActive === id) {
          let currentMap: Map<number, EditorConfig> = new Map();
          const unsubscribe = editors.subscribe(m => { currentMap = m; });
          unsubscribe();
          if (currentMap.size === 0) {
            return null;
          }
          // Find lowest ID
          const lowestId = Math.min(...currentMap.keys());
          return lowestId;
        }
        return currentActive;
      });
    },
    setActiveEditor: (id: number) => {
      activeEditorId.set(id);
    },
    openFileInEditor: (editorId: number, path: string) => {
      editors.update(map => {
        const config = map.get(editorId);
        if (config) {
          map.set(editorId, { ...config, filePath: path });
        }
        return map;
      });
    },
    openFileInActiveEditor: (path: string) => {
      let currentActiveId: number | null = null;
      const unsubscribe = activeEditorId.subscribe(id => { currentActiveId = id; });
      unsubscribe();
      if (currentActiveId !== null) {
        context.openFileInEditor(currentActiveId as number, path);
      }
    },
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
