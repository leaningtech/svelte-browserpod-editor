/**
 * BrowserPodEditor - A Svelte component library for in-browser code editors
 *
 * CSS Theme:
 *   Import the default theme to get sensible CSS variable defaults:
 *   import '@leaningtech/browserpod-editor/theme.css';
 *
 *   Or define your own CSS variables (see theme.css for the full list).
 */

// Main provider component
export { default as BrowserPodEditorProvider } from './BrowserPodEditorProvider.svelte';

// UI Components
export { default as EditorPanel } from './components/EditorPanel.svelte';
export { default as PreviewPanel } from './components/PreviewPanel.svelte';
export { default as TerminalPanel } from './components/TerminalPanel.svelte';
export { default as TabbedTerminalPanel } from './components/TabbedTerminalPanel.svelte';
export { default as FileTree } from './components/FileTree.svelte';
export { default as CurrentFile } from './components/CurrentFile.svelte';
export { default as Container } from './components/Container.svelte';
export { default as Spinner } from './components/Spinner.svelte';

// Context
export { getBrowserPodEditorContext, createBrowserPodEditorContext } from './context';
export type { BrowserPodEditorContext } from './context';

// Core services
export { BrowserPodService } from './core/BrowserPodService';
export { loadManifest, buildFileTree } from './core/ManifestLoader';
export { loadProject, requiresVmLoading, getVmLoadConfig, extractZipBuffer } from './core/ProjectLoader';
export type { LoadedProject } from './core/ProjectLoader';

// Types
export type {
  TreeNode,
  FolderNode,
  FileNode,
  ProjectSource,
  LocalProjectSource,
  ZipProjectSource,
  GithubProjectSource,
  ProjectFile,
  BrowserPodEditorProps,
  BrowserPodServiceOptions,
  ReadyEventDetail,
  PortalReadyEventDetail,
  ErrorEventDetail,
  TerminalConfig,
  TerminalTab,
} from './types';

// Utilities
export { debounce, trackEvent, setAnalyticsCallback } from './utils';
export type { AnalyticsCallback } from './utils';
