# svelte-browserpod-editor

A Svelte component library for building in-browser code editors powered by [BrowserPod](https://browserpod.io). Run a full development environment in the browser via WebAssembly—npm install, dev servers, live previews, and more.

## Installation

```bash
npm install @leaningtech/svelte-browserpod-editor
```

## Quick Start

```svelte
<script>
  import BrowserPod from '@leaningtech/browserpod';
  import {
    BrowserPodEditorProvider,
    EditorPanel,
    PreviewPanel,
    TerminalPanel,
    FileTree
  } from '@leaningtech/svelte-browserpod-editor';
  import '@leaningtech/svelte-browserpod-editor/theme.css';

  const pod = BrowserPod.boot({ apiKey: 'your-api-key' });
</script>

<BrowserPodEditorProvider
  projectSource={{ type: 'local', path: '/project/' }}
  {pod}
>
  <FileTree />
  <EditorPanel />
  <PreviewPanel />
  <TerminalPanel tabs={[
    { id: 'dev', label: 'Dev Server', onReady: (run) => run('npm', ['run', 'dev']) }
  ]} />
</BrowserPodEditorProvider>
```

## Components

| Component | Description |
|-----------|-------------|
| `BrowserPodEditorProvider` | Required wrapper that provides context to all child components |
| `EditorPanel` | CodeMirror-based code editor |
| `PreviewPanel` | Live preview iframe with optional QR code overlay |
| `TerminalPanel` | Terminal with optional tabs (tab bar hidden for single terminal) |
| `FileTree` | File browser with folder navigation |
| `CurrentFile` | Displays the currently selected filename |

## Project Sources

Load projects from three sources:

```typescript
// Local files (requires manifest.txt in static directory)
{ type: 'local', path: '/projects/my-app' }

// Direct zip URL (requires appropriate CORS headers if cross-origin)
{ type: 'zip', url: 'https://example.com/project.zip' }

// GitHub repository (fetched via VM to bypass CORS)
{ type: 'github', owner: 'username', repo: 'my-repo', ref: 'main', path: 'subdir' }
```

## Terminal Configuration

Tabs accept `onReady` and `onActivate` callbacks, each receiving a pre-bound `run(command, args?, options?)` function.

```svelte
<script>
  let terminal;

  function once(fn) {
    let done = false;
    return (run) => { if (!done) { done = true; fn(run); } };
  }
</script>

<TerminalPanel bind:this={terminal} tabs={[
  {
    id: 'install',
    label: 'Install',
    // onReady: runs when BrowserPod is ready
    onReady: async (run) => {
      await run('npm', ['install']);
      await run('npm', ['run', 'dev']);
    }
  },
  {
    id: 'repl',
    label: 'REPL',
    // onActivate: runs when the tab is clicked (wrap in once() to run only on first click)
    onActivate: once((run) => run('node'))
  }
]} />

<!-- Imperative control via bind:this -->
<button onclick={() => terminal.run('npm', ['test'])}>Run tests</button>
```

The `run` method on `TerminalPanel` also accepts an optional `tabId` to target a specific tab:

```typescript
terminal.run('npm', ['test'], { tabId: 'install', cwd: '/home/user' });
```

## Multi-Editor Layout

Multiple editors are supported automatically:

```svelte
<div class="editors">
  <EditorPanel />  <!-- Editor 0 -->
  <EditorPanel />  <!-- Editor 1 -->
</div>
```

Clicking/focusing an editor makes it active. FileTree clicks open files in the active editor.

## Layout

Use wrapper elements for layout—components don't include default positioning:

```svelte
<div class="editor-slot">
  <EditorPanel />
</div>
<div class="preview-slot">
  <PreviewPanel />
</div>

<style>
  .editor-slot { flex: 2 1 0; min-height: 0; display: flex; }
  .preview-slot { width: 320px; display: flex; }
</style>
```

## Theming

Import the default theme and override CSS variables:

```css
@import '@leaningtech/svelte-browserpod-editor/theme.css';

:root {
  --bpe-color-primary: #your-brand-color;
  --bpe-color-border: rgba(255, 255, 255, 0.2);
}
```

See `theme.css` for the complete list of customizable variables.

## Analytics

Wire up analytics tracking:

```typescript
import { setAnalyticsCallback } from '@leaningtech/svelte-browserpod-editor';

setAnalyticsCallback((event, props) => {
  // Your analytics implementation
});
```

## License

MIT
