# svelte-browserpod-editor

A Svelte component library for building in-browser code editors powered by [BrowserPod](https://browserpod.com). Run a full development environment in the browser via WebAssembly—npm install, dev servers, live previews, and more.

## Installation

```bash
npm install @leaningtech/svelte-browserpod-editor
```

## Quick Start

```svelte
<script>
  import {
    BrowserPodEditorProvider,
    EditorPanel,
    PreviewPanel,
    TerminalPanel,
    FileTree
  } from '@leaningtech/svelte-browserpod-editor';
  import '@leaningtech/svelte-browserpod-editor/theme.css';
</script>

<BrowserPodEditorProvider
  projectSource={{ type: 'local', path: '/project/' }}
  apiKey="your-api-key"
>
  <FileTree />
  <EditorPanel />
  <PreviewPanel />
  <TerminalPanel tabs={[
    { id: 'dev', label: 'Dev', commands: [['npm', 'run', 'dev']], autoRun: true }
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

Load projects from three sources (currently only local and zip work. Zip requires
appropriate CORS headers if used cross-origin):

```typescript
// Local files (requires manifest.txt in static directory)
{ type: 'local', path: '/projects/my-app' }

// Direct zip URL
{ type: 'zip', url: 'https://example.com/project.zip' }

// GitHub repository
{ type: 'github', repo: 'username/repo', branch: 'main' }
```

## Terminal Configuration

```svelte
<TerminalPanel tabs={[
  {
    id: 'install',
    label: 'Install',
    commands: [['npm', 'install']],
    autoRun: true,        // Run when BrowserPod is ready
    stopOnError: true     // Stop sequence if command fails
  },
  {
    id: 'dev',
    label: 'Dev Server',
    commands: [['npm', 'run', 'dev']],
    runOnActivate: true   // Run when tab is first clicked
  }
]} />
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
