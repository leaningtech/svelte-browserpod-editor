# svelte-browserpod-editor

A reusable Svelte component library for building in-browser code editors powered by BrowserPod. BrowserPod runs a full Linux environment in the browser via WebAssembly, enabling features like npm install, running dev servers, and live previews.

## Project Structure

```
svelte-browserpod-editor/
├── src/
│   ├── index.ts            # Public exports
│   ├── BrowserPodEditorProvider.svelte  # Main provider (context + orchestration)
│   ├── context.ts          # Svelte context for state management
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Utilities (debounce, analytics abstraction)
│   ├── components/
│   │   ├── EditorPanel.svelte      # CodeMirror editor
│   │   ├── PreviewPanel.svelte     # Portal iframe + QR overlay
│   │   ├── TerminalPanel.svelte      # Terminal (single or tabbed)
│   │   ├── FileTree.svelte         # File browser (handles loading state)
│   │   ├── FileTree/Folder.svelte  # Internal: folder node
│   │   ├── FileTree/File.svelte    # Internal: file node
│   │   ├── CurrentFile.svelte      # Displays selected filename
│   │   ├── Container.svelte        # Panel wrapper with header
│   │   └── Spinner.svelte          # Loading spinner
│   └── core/
│       ├── BrowserPodService.ts    # BrowserPod API wrapper
│       ├── ProjectLoader.ts        # Load from local/zip/GitHub
│       └── ManifestLoader.ts       # Parse manifest.txt files
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## Key Concepts

### Provider Pattern
`BrowserPodEditorProvider` creates a Svelte context that child components consume. This allows flexible composition - you can use the pre-built layout or create custom layouts using individual panels.

```svelte
<BrowserPodEditorProvider {projectSource} {apiKey}>
  <EditorPanel />
  <PreviewPanel />
  <TerminalPanel tabs={...} />
</BrowserPodEditorProvider>
```

### Project Sources
Projects can be loaded from three sources:
- **local**: Files in the static directory with a `manifest.txt`
- **zip**: Direct URL to a zip file
- **github**: GitHub repo (fetched via VM to bypass CORS)

### Terminal System
Terminals register themselves with the provider on mount. Features:
- Multiple terminals with unique IDs
- Sequential command execution (`commands: string[][]`)
- `autoRun`: Run commands when BrowserPod is ready
- `runOnActivate`: Run commands when tab is first clicked (lazy)
- `stopOnError`: Stop sequence if a command fails

### Editor System
Editors register themselves with the provider on mount, enabling multi-editor layouts:
- Sequential IDs assigned automatically (0, 1, 2...)
- Each editor manages its own file content locally
- Clicking/focusing an editor makes it "active"
- FileTree clicks open files in the active editor
- Active border only shows when multiple editors exist (single editor looks normal)

```svelte
<!-- Single editor (works as before) -->
<EditorPanel />

<!-- Multiple editors -->
<div class="left-editor">
  <EditorPanel />
</div>
<div class="right-editor">
  <EditorPanel />
</div>
```

Context functions for editor management:
- `registerEditor()`: Called on mount, returns assigned ID
- `unregisterEditor(id)`: Called on destroy
- `setActiveEditor(id)`: Set which editor receives file selections
- `openFileInActiveEditor(path)`: Open a file in the active editor
- `openFileInEditor(editorId, path)`: Open a file in a specific editor

### Analytics Abstraction
The package uses `trackEvent()` internally. Apps wire it up via:
```typescript
import { setAnalyticsCallback } from '@leaningtech/svelte-browserpod-editor';
setAnalyticsCallback(tryPlausible);
```

## Build

```bash
npm run build  # Runs svelte-package -i src -o dist
```

## CSS Architecture

### Philosophy

The package uses a three-tier CSS architecture to maintain clean separation between the component library and consuming applications:

#### 1. Layout via Wrapper Elements (Recommended)
Panel components accept a `class` prop but don't provide default layout. The idiomatic Svelte pattern is to use **wrapper elements** for layout concerns:

```svelte
<div class="editor-slot">
  <EditorPanel />
</div>
<div class="terminal-slot">
  <TerminalPanel tabs={...} />
</div>
<div class="preview-slot">
  <PreviewPanel />
</div>

<style>
  .editor-slot { flex: 2 1 0; min-height: 0; display: flex; }
  .terminal-slot { flex: 1 1 0; min-height: 0; display: flex; }
  .preview-slot { width: 320px; display: flex; }
</style>
```

**Why wrappers?**
- Separation of concerns: layout is the parent's job, not the child's
- Pure scoped CSS without `:global()` escape hatches
- Works naturally with CSS Grid/Flexbox (you style the cell, not the component)

The `class` prop is still available for other uses (utility classes, JS targeting, etc.).

#### 2. Internal Classes (Private)
Classes used inside components (`.panel-content`, `.panel-header`, `.portal-wrapper`, etc.) are **private implementation details**. Consumers should **never reference these** in their CSS - they may change without notice.

```css
/* BAD - don't target internal classes */
:global(.panel-content) { height: 100%; }
```

#### 3. CSS Variables (Customization API)
CSS variables defined in `theme.css` are the **public customization API**. All variables use the `--bpe-` prefix to avoid collisions. Consumers can override these to customize appearance without touching internal classes.

```css
:root {
  --bpe-color-primary: #your-brand-color;
  --bpe-color-border: rgba(255, 255, 255, 0.2);
  --bpe-container-border-radius: 8px;
}
```

### Theme File

The package exports `theme.css` with all default values:
```js
import '@leaningtech/svelte-browserpod-editor/theme.css';
```

Consumers import this first, then override variables in their own CSS.

### CSS Variables (theme.css)

All variables use the `--bpe-` prefix (BrowserPod Editor) to avoid naming collisions.

#### Core Colors

| Variable | Purpose | Default |
|----------|---------|---------|
| `--bpe-color-primary` | Accent color | `#00b3a0` |
| `--bpe-color-primary-hover` | Accent hover | `#00a090` |
| `--bpe-color-text` | Main text | `#e5e7eb` |
| `--bpe-color-text-muted` | Secondary text | `rgb(113, 113, 122)` |
| `--bpe-color-text-secondary` | Tertiary text | `#9ca3af` |
| `--bpe-color-text-active` | Active state text | `white` |
| `--bpe-color-text-on-primary` | Text on primary bg | `white` |
| `--bpe-color-border` | Borders | `rgba(255, 255, 255, 0.15)` |
| `--bpe-color-bg-hover` | Hover backgrounds | `rgba(255, 255, 255, 0.05)` |
| `--bpe-color-button-secondary` | Secondary button | `#64748b` |
| `--bpe-color-spinner` | Spinner color | `var(--bpe-color-primary)` |

#### Container

| Variable | Purpose | Default |
|----------|---------|---------|
| `--bpe-container-header-background` | Header background | `rgba(24, 24, 27, 0.8)` |
| `--bpe-container-header-padding` | Header padding | `0.5rem` |
| `--bpe-container-header-title-color` | Header title color | `var(--bpe-color-text-muted)` |
| `--bpe-container-border-radius` | Container border radius | `0.5rem` |
| `--bpe-container-content-min-height` | Content minimum height | `0` |

#### Terminal

| Variable | Purpose | Default |
|----------|---------|---------|
| `--bpe-color-terminal-bg` | Terminal background | `rgb(9, 9, 11)` |
| `--bpe-color-tab-active` | Active tab background | `rgba(255, 255, 255, 0.08)` |

#### CodeMirror Editor

| Variable | Purpose | Default |
|----------|---------|---------|
| `--bpe-editor-font-family` | Editor font stack | `"Fira Code", "JetBrains Mono", monospace` |
| `--bpe-editor-font-size` | Editor font size | `0.85rem` |
| `--bpe-editor-text-color` | Editor text color | `rgba(255, 255, 255, 0.9)` |
| `--bpe-editor-cursor-color` | Editor cursor color | `white` |
| `--bpe-editor-gutter-bg` | Line numbers background | `rgba(0, 0, 0, 0.2)` |
| `--bpe-editor-gutter-border` | Gutter border color | `rgba(255, 255, 255, 0.15)` |
| `--bpe-editor-gutter-text` | Line numbers text color | `rgba(255, 255, 255, 0.5)` |
| `--bpe-editor-active-line-bg` | Active line highlight | `rgba(255, 255, 255, 0.05)` |
| `--bpe-editor-active-border` | Active editor border (multi-editor) | `2px solid var(--bpe-color-primary)` |

## Upcoming Work

### CSS Architecture Improvements

1. **Audit CSS variable coverage**
   - Some components may still have hardcoded values that should be variables

2. **Document the public API clearly**
   - Add JSDoc comments to components explaining which props affect styling
   - Consider a `STYLING.md` in the package with examples

3. **Consider additional CSS variables for edge cases**
   - If consumers legitimately need to tweak internal behavior, expose it via variables

### Replace browserpod-console Copy
There's a copy of similar components at `/home/yuri/work/browserpod-console/frontend/` that should be replaced with this package. Need to:
1. Compare features between the two implementations
2. Identify any missing functionality in the package
3. Add missing features if needed
4. Replace the copy with package imports

### Other Considerations
- The `Container.svelte` and `Spinner.svelte` are exported but might be considered internal
- TypeScript types could be more strict in some places
