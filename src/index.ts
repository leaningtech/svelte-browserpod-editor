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
export { default as FileTree } from './components/FileTree.svelte';
export { default as CurrentFile } from './components/CurrentFile.svelte';
export { default as Container } from './components/Container.svelte';
export { default as Spinner } from './components/Spinner.svelte';

// Context
export { getBrowserPodEditorContext, createBrowserPodEditorContext } from './context.ts';
export type { BrowserPodEditorContext } from './context.ts';

// Core services
export { BrowserPodService } from './core/BrowserPodService.ts';
export { loadManifest, buildFileTree } from './core/ManifestLoader.ts';
export { loadProject, requiresVmLoading, getVmLoadConfig, extractZipBuffer } from './core/ProjectLoader.ts';
export type { LoadedProject } from './core/ProjectLoader.ts';

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
  EditorConfig,
} from './types.ts';

// Utilities
export { debounce, trackEvent, setAnalyticsCallback } from './utils.ts';
export type { AnalyticsCallback } from './utils.ts';
