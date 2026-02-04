/**
 * BrowserPodService - Class-based wrapper for BrowserPod
 */
import { BrowserPod } from '@leaningtech/browserpod';
import type { BrowserPodServiceOptions, ProjectFile } from '../types';
import { trackEvent } from '../utils';

export class BrowserPodService {
  private pod: any = null;
  private terminals: Map<string, any> = new Map();
  private defaultTerminalId: string | null = null;
  private apiKey: string;
  private apiDomain?: string;
  private onPortal?: ({url, port}: {url: string, port: number}) => void;
  private onError?: (error: Error) => void;

  constructor(options: BrowserPodServiceOptions) {
    this.apiKey = options.apiKey;
    this.apiDomain = options.apiDomain;
    this.onPortal = options.onPortal;
    this.onError = options.onError;
  }

  /**
   * Initialize BrowserPod (boot only, no terminal creation)
   */
  async boot(): Promise<void> {
    try {
      const bootOptions: { apiKey: string; apiDomain?: string } = {
        apiKey: this.apiKey,
      };
      if (this.apiDomain) {
        bootOptions.apiDomain = this.apiDomain;
      }

      this.pod = await BrowserPod.boot(bootOptions);

      trackEvent('BrowserPodBoot');

      this.pod.onPortal((data: {url: string, port: number}) => {
        if (data && data.url) {
          trackEvent('LoadedPortal');
          this.onPortal?.(data);
        }
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Create a terminal for a specific DOM element
   * @param id Unique identifier for the terminal
   * @param element DOM element for terminal output
   * @returns The terminal instance
   */
  async createTerminal(id: string, element: HTMLElement): Promise<any> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    const terminal = await this.pod.createDefaultTerminal(element);
    this.terminals.set(id, terminal);

    // Set as default if it's the first terminal
    if (!this.defaultTerminalId) {
      this.defaultTerminalId = id;
    }

    return terminal;
  }

  /**
   * Get the underlying BrowserPod instance for advanced operations
   */
  getPod(): any {
    return this.pod;
  }

  /**
   * Get a terminal by ID
   */
  getTerminal(id: string): any {
    return this.terminals.get(id);
  }

  /**
   * Get the default terminal (first created or 'default')
   */
  private get terminal(): any {
    if (this.defaultTerminalId) {
      return this.terminals.get(this.defaultTerminalId);
    }
    // Fallback to first terminal
    return this.terminals.values().next().value;
  }

  /**
   * Run a command in a specific terminal
   * @param command Array of command parts [executable, ...args]
   * @param terminalId Terminal to run in (uses default if not specified)
   * @param options Additional options (cwd, echo)
   */
  async runCommand(
    command: string[],
    terminalId?: string,
    options: { cwd?: string; echo?: boolean } = {}
  ): Promise<void> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    const terminal = terminalId ? this.terminals.get(terminalId) : this.terminal;
    if (!terminal) {
      throw new Error(`Terminal ${terminalId || 'default'} not found`);
    }

    const [executable, ...args] = command;
    await this.pod.run(executable, args, {
      echo: options.echo ?? true,
      terminal,
      cwd: options.cwd ?? '/files',
    });
  }

  /**
   * Upload files to BrowserPod from ProjectFile objects
   * @param files Array of ProjectFile objects with path and content
   */
  async uploadProjectFiles(files: ProjectFile[]): Promise<void> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    await this.pod.createDirectory('/files');
    for (const file of files) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        parts.pop();
        const dir = parts.join('/');
        await this.pod.createDirectory(`/files/${dir}`, { recursive: true });
      }
      const f = await this.pod.createFile(`/files/${file.path}`, 'binary');
      const copy = new Uint8Array(file.content);
      await f.write(copy.buffer);
      await f.close();
    }
  }

  /**
   * Load file content from BrowserPod
   * @param filename File path relative to /files/
   */
  async loadFile(filename: string): Promise<string> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    const fullPath = `/files/${filename}`;
    try {
      const f = await this.pod.openFile(fullPath, 'utf-8');
      const size = await f.getSize();
      const content = await f.read(size);
      await f.close();
      return content;
    } catch (e) {
      throw new Error(`Failed to read file ${fullPath}: ${e}`);
    }
  }

  /**
   * Save file content to BrowserPod
   * @param filename File path relative to /files/
   * @param content File content
   */
  async saveFile(filename: string, content: string): Promise<boolean> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    const fullPath = `/files/${filename}`;
    try {
      const parts = filename.split('/');
      parts.pop();
      const dir = parts.join('/');
      if (dir) {
        await this.pod.createDirectory(`/files/${dir}`, { recursive: true });
      }
      const f = await this.pod.createFile(fullPath, 'utf-8');
      await f.write(content);
      await f.close();
      console.log('File saved:', filename);
      trackEvent('SaveFile');
      return true;
    } catch (e) {
      console.error(`Failed to write file ${fullPath}:`, e);
      return false;
    }
  }

  /**
   * Fetch a URL from inside the VM (bypasses CORS)
   * @param url URL to fetch
   * @param terminalId Terminal to show output in (uses default if not specified)
   * @returns ArrayBuffer of the response
   */
  async fetchUrl(url: string, terminalId?: string): Promise<ArrayBuffer> {
    if (!this.pod) {
      throw new Error('BrowserPod not initialized');
    }

    const terminal = terminalId ? this.terminals.get(terminalId) : this.terminal;

    // Write a simple fetch script
    const script = `
      const fs = require('fs');
      async function main() {
        const response = await fetch(${JSON.stringify(url)});
        if (!response.ok) throw new Error('Fetch failed: ' + response.status);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync('/tmp/fetched', Buffer.from(buffer));
      }
      main().catch(e => { console.error(e); process.exit(1); });
    `;

    await this.pod.createDirectory("/tmp/");
    const scriptFile = await this.pod.createFile('/tmp/fetch.js', 'utf-8');
    await scriptFile.write(script);
    await scriptFile.close();

    await this.pod.run('node', ['/tmp/fetch.js'], {
      echo: true,
      terminal,
      cwd: '/',
    });

    // Read the fetched data
    const dataFile = await this.pod.openFile('/tmp/fetched', 'binary');
    const size = await dataFile.getSize();
    const content = await dataFile.read(size);
    await dataFile.close();

    return content;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Currently BrowserPod doesn't have an explicit destroy method
    // but we can clean up our references
    this.pod = null;
    this.terminals.clear();
    this.defaultTerminalId = null;
  }
}
