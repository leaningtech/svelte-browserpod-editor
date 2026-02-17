/**
 * BrowserPodEditor Svelte context for child state management
 */
import { getContext, setContext } from 'svelte';
import { get, writable, type Writable } from 'svelte/store';
import { SvelteMap } from 'svelte/reactivity';
import type { TreeNode, TerminalConfig, EditorConfig } from './types.ts';

const CONTEXT_KEY = Symbol('BrowserPodEditor');

export interface BrowserPodEditorContext {
  /** Whether BrowserPod is running and ready */
  browserPodRunning: Writable<boolean>;
  /** Whether the file system is ready */
  fileSysReady: Writable<boolean>;
  /** Portal URLs for the previews */
  portalUrls: SvelteMap<number, string>;
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
  /** Get a terminal instance by ID */
  getTerminal: (id: string) => any;
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

function _createContext(): BrowserPodEditorContext {
  const portalUrls = new SvelteMap<number, string>();

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
    portalUrls,
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
    getTerminal: (id: string) => get(terminals).get(id)?.terminal,
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
          const currentMap = get(editors);
          if (currentMap.size === 0) {
            return null;
          }
          return Math.min(...currentMap.keys());
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
      const currentActiveId = get(activeEditorId);
      if (currentActiveId !== null) {
        context.openFileInEditor(currentActiveId, path);
      }
    },
  };

  return context;
}

export function createBrowserPodEditorContext(): BrowserPodEditorContext {
  const context = _createContext();
  setContext(CONTEXT_KEY, context);
  return context;
}

// Module-level registry for standalone contexts (shared across Astro islands via ctxId)
const _standaloneContexts = new Map<string, BrowserPodEditorContext>();

/** Get or create a standalone context by ID.
 *  Components sharing the same ctxId share the same context instance.
 *  If registerInSvelteTree is true, also calls setContext so that child
 *  components within this Svelte tree can find it via getContext. */
export function getOrCreateStandaloneContext(ctxId: string, registerInSvelteTree = false): BrowserPodEditorContext {
  let ctx = _standaloneContexts.get(ctxId);
  if (!ctx) {
    ctx = _createContext();
    _standaloneContexts.set(ctxId, ctx);
  }
  if (registerInSvelteTree) {
    setContext(CONTEXT_KEY, ctx);
  }
  return ctx;
}

/** Resolve context: by ctxId from the registry, or via Svelte's getContext. */
export function resolveContext(ctxId?: string): BrowserPodEditorContext {
  if (ctxId) return getOrCreateStandaloneContext(ctxId);
  return getBrowserPodEditorContext();
}

export function getBrowserPodEditorContext(): BrowserPodEditorContext {
  const context = getContext<BrowserPodEditorContext>(CONTEXT_KEY);
  if (!context) {
    throw new Error('BrowserPodEditorContext not found. Make sure this component is used within BrowserPodEditor.');
  }
  return context;
}
