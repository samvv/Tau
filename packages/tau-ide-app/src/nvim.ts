
import cp from "child_process"
import { attach as attachToNvimProc, NeovimClient } from "neovim"
import { assert, Vec2 } from "./util";

export async function spawnNeovim(): Promise<NeovimClient> {

  const proc = cp.spawn('nvim', ['-u', 'init.vim', '--noplugin', '--embed' ], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const client = attachToNvimProc({ proc });

  await client.setVar('tau_rpc_channel', await client.channelId);

  return client;
}

type CursorShape = 'block' | 'horizontal' | 'vertical';

interface ModeInfo {
  cursor_shape?: CursorShape;
  cell_percentage?: number;
  blinkwait?: number;
  blinkon?: number;
  blinkoff?: number;
  attr_id?: number;
  attr_id_lm?: number;
  short_name?: string;
  name?: string;
}

interface Highlight {
  foreground?: number;
  background?: number;
  special?: number;
  reverse?: boolean;
  italic?: boolean;
  bold?: boolean;
  strikethough?: boolean;
  underline?: boolean;
  underlineline?: boolean;
  undercurl?: boolean;
  underdot?: boolean;
  underdash?: boolean;
  blend?: number; 
}

function makeRGB(color: number) {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;   
  return `rgb(${r}, ${g}, ${b})`;
}

const SPECIAL_KEYS: Record<string, string> = {
  ' ': 'Space',
  '<': 'lt',
  '\\': 'Bslash',
  '|': 'Bar',
  'Backspace': 'BS',
  'Enter': 'Enter',
  'Escape': 'Esc',
  'Delete': 'Del',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
  'Tab': 'Tab',
}

export class NeovimController {


  private backCtx: CanvasRenderingContext2D;
  private frontCtx: CanvasRenderingContext2D;

  private cursor: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private buffer: any;

  private cellWidth = 9;
  private cellHeight = 18;
  private cellBaseline = 5;
  private dpr = window.devicePixelRatio || 1.0;
  private font = '12px Hack';
  private cursorOpacity = 0.6;

  private cursorStyleEnabled?: boolean;
  private modes?: ModeInfo[];
  private activeMode?: ModeInfo;
  private highlights = new Map<number, Highlight>();

  public constructor(
    private element: HTMLDivElement,
    private client: NeovimClient,
  ) {

    this.highlights.set(0, {
      foreground: 0xFFFFFF,
      background: 0x000000,
      special: 0xFFFFFF,
    });

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onWindowKeyDown);

    element.style.position = 'relative';

    this.cursor = document.createElement('div');
    this.cursor.style.display = 'inline-block';
    this.cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    this.cursor.style.position = 'absolute';
    this.cursor.style.height = `${this.cellHeight}px`;
    this.cursor.style.width = `${this.cellWidth}px`;
    this.cursor.style.transformOrigin = '0 0';
    this.cursor.style.transform = `translate(0, ${this.cellHeight}px) scale(1, -2)`;

    element.appendChild(this.cursor);

    this.canvas = document.createElement('canvas');
    element.appendChild(this.canvas);
    this.buffer = new OffscreenCanvas(800, 600);

    client.on('notification', this.onClientNotification);

    this.backCtx = this.buffer.getContext('2d')!;
    this.frontCtx = this.canvas.getContext('2d')!;

    this.init();

  }

  private async init(): Promise<void> {

    this.adjustCanvasSize();

    await document.fonts.load(this.font);

    const [cols, rows] = this.calcGridDimensions();
    this.client.uiAttach(
       cols,
       rows,
      { rgb: true, ext_linegrid: true }
    );
  }


  private calcGridDimensions(): Vec2 {
    const canvasRect = this.canvas.getBoundingClientRect();
    const cols = Math.floor(canvasRect.width / this.cellWidth);
    const rows = Math.floor(canvasRect.height / this.cellHeight);
    return [cols, rows];
  }


  private onWindowKeyDown = (e: KeyboardEvent) => {
    let vimKey: string = SPECIAL_KEYS[e.key];
    let vimModifiers = '';
    if (e.altKey) {
      vimModifiers += 'M-';
    }
    if (e.shiftKey) {
      vimModifiers += 'S-';
    }
    if (e.ctrlKey) {
      vimModifiers += 'C-';
    }
    if (vimKey === undefined) {
      if (e.key.length === 1) {
        vimKey = e.key;
      } else {
        console.warn(`Key ${e.key} was not recognised.`);
        return;
      }
    }
    let out: string;
    if (vimKey.length > 1 || vimModifiers) {
      out = `<${vimModifiers}-${vimKey}>`;
    } else {
      out = vimKey;
    }
    this.client.input(out);
  }

  public async setFont(name: string): Promise<void> {
    await document.fonts.load(name);
    this.font = name;
    await this.client.command('redraw');
  }

  public setMode(mode: ModeInfo): void {
    switch (mode.cursor_shape) {
      case 'block':
        this.cursor.style.width = `${this.cellWidth}px`;
        this.cursor.style.height = `${this.cellHeight}px`;
        break;
      case 'horizontal': {
        const size = (mode.cell_percentage ?? 100) / 100;
        this.cursor.style.width = `${size * this.cellWidth}px`;
        this.cursor.style.height = `1px`;
        break;
      }
      case 'vertical':
      {
        const size = (mode.cell_percentage ?? 100) / 100;
        this.cursor.style.width = `1px`;
        this.cursor.style.height = `${size * this.cellHeight}px`;
        break;
      }
    }
  }

  private adjustCanvasSize(): void {
    const rect = this.element.getBoundingClientRect();
    const width = rect.width * this.dpr;
    const height = rect.height * this.dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.canvas.width = width;
    this.canvas.height = height;
    this.buffer.width = width;
    this.buffer.height = height;
    this.backCtx.scale(this.dpr, this.dpr);
  }

  private onWindowResize = (_: UIEvent) => {
    this.adjustCanvasSize();
    const [cols, rows] = this.calcGridDimensions();
    this.client.uiTryResize(cols, rows);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
  }

  public measureCell(): DOMRect {
    return new DOMRect(0, 0, this.cellWidth, this.cellHeight);
  }

  private onClientNotification = (name: string, ops: any[][]) => {

    switch (name) {

      case 'redraw':

        for (const [name, ...argsList] of ops) {

          for (const args of argsList) {

            switch (name) {

              case 'set_title':
              {
                const [title] = args;
                // TODO figure out what to do with the window
                document.title = title;
                break;
              }

              case 'set_icon':
                // TODO figure out what to do with the window
                break;

              case 'mode_info_set':
              {
                const [cursor_style_enabled, modes] = args;
                this.cursorStyleEnabled = cursor_style_enabled;
                this.modes = modes;
                break;
              }

              case 'option_set': {
                const [name, value] = args;
                // TODO process these options according to the spec
                break;
              }

              case 'mode_change':
              {
                const [mode_name, mode_idx] = args;
                this.setMode(this.modes![mode_idx]);
                break;
              }

              case 'mouse_on':
              case 'mouse_off':
                // Mouse is always on in this editor
                break;

              case 'suspend':
                // TODO minimise app to system tray
                break;

              case 'update_menu':
                // TODO
                break;

              case 'visual_bell':
                // TODO
                break;

              case 'flush':
              {
                const data = this.backCtx.getImageData(0, 0, this.buffer.width, this.buffer.height);
                this.frontCtx.putImageData(data, 0, 0);
                break;
              }

              case 'grid_resize':
              {
                const [id, width, height] = args;
                assert(id === 1);
                // We don't perform the following resize here because it is Neovim
                // that should resize according to the dimensions of the Electron
                // window.
                //window.resizeTo(width * this.cellWidth, height * this.cellHeight);    
                break;
              }

              case 'default_colors_set':
              {
                const [fg, bg, sp, cterm_fg, cterm_bg] = args;
                const highlight = this.highlights.get(0)!;
                highlight.foreground = fg;
                highlight.background = bg;
                highlight.special = sp;
                this.canvas.style.backgroundColor = makeRGB(bg);
                break;
              }

              case 'hl_attr_define':
              {
                const [id, rgb_attr, cterm_attr, info] = args; 
                this.highlights.set(id, rgb_attr);
                break;
              }

              case 'hl_group_set':
                // This event does not need to be processed since we are using the
                // default colors of Neovim.
                break;

              case 'grid_line':
              {
                const [id, row, col_start,  cells] = args;

                const defaultHl = this.highlights.get(0)!;
                const defaultBg = defaultHl.reverse ? defaultHl.foreground! : defaultHl.background!;
                const defaultFg = defaultHl.reverse ? defaultHl.background! : defaultHl.foreground!;

                let col = col_start;
                let lastHighlight: Highlight;

                const renderCell = (text: string, hl: Highlight) => {
                  let fg = hl.reverse ? (hl.background ?? defaultBg) : (hl.foreground ?? defaultFg);
                  const bg = hl.reverse ? (hl.foreground ?? defaultFg) : (hl.background ?? defaultBg);
                  const x = col * this.cellWidth;
                  const y = row * this.cellHeight;
                  this.backCtx.fillStyle = makeRGB(bg);
                  this.backCtx.fillRect(x, y, this.cellWidth, this.cellHeight);
                  this.backCtx.fillStyle = makeRGB(fg);
                  this.backCtx.fillText(text, x, y + this.cellHeight - this.cellBaseline);
                  col++;
                }

                this.backCtx.font = this.font;

                for (const cell of cells) {
                  if (cell.length === 1) {
                    renderCell(cell[0], lastHighlight!);
                  } else {
                    const [text, hl_id, repeat] = cell;
                    const highlight = this.highlights.get(hl_id)!;
                    for (let i = 0; i < (repeat ?? 1); i++) {
                      renderCell(text, highlight);
                    }
                    lastHighlight = highlight;
                  }
                }

                break;
              }

              case 'grid_clear':
              {
                this.backCtx.fillStyle = makeRGB(this.highlights.get(0)!.background!);
                this.backCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                break;
              }

              case 'grid_destroy':
                // TODO
                break;

              case 'grid_cursor_goto':
              {
                const [grid_id, row, column] = args;
                const x = this.cellWidth * column;
                const y = this.cellHeight * row;
                this.cursor.style.left = `${x}px`;
                this.cursor.style.top = `${y}px`;
                break;
              }

              case 'grid_scroll':
              {
                // TODO
                break;
              }

              default:
                console.warn(`Neovim redraw event '${name}' went by unhandled.`);
                break;

            }

          }

        }

        break;

      case 'quit':
        // FIXME This doesn't quit the app completely on Apple
        window.close();
        break;

      default:
        console.warn(`Neovim notification ${name} went by unhandled.`);
        break;

    }

  }

}

