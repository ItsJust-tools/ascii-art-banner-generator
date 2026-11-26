# ASCII Art Banner Generator

Convert text into big ASCII art banners using multiple FIGlet-style fonts. A 100% client-side texting utility for READMEs, chat messages, code comments and terminals.

**Live:** [ascii-art-banner-generator.itsjust.tools](https://ascii-art-banner-generator.itsjust.tools)

## Features

- 7 built-in FIGlet-style fonts: Standard, Slant, Block, Shadow, Small, Big, Doom
- Live preview rendered in monospace as you type, with a font switcher
- Multi-line input: each line becomes its own banner block
- Adjustable max width with word-wrap vs overflow-warning options (single words are hard-broken by character when nothing else fits)
- Output styles: strip trailing whitespace, center-align lines, comment prefixes for code (`//`, `#`, …)
- Copy to clipboard and download as `.txt`
- Character stats showing banner dimensions (columns × lines) and overflow warnings
- Shareable state via URL — banner text and font are preserved
- 100% client-side — powered by the pure-JS [figlet](https://www.npmjs.com/package/figlet) engine, no server round-trips

## Keyboard shortcuts

- `Ctrl+C` — copy banner (via the toolbar button)
- `Ctrl+S` — save banner to history

## Development

```bash
npm ci --ignore-scripts
npm run dev
npm test          # unit tests
npm run build
```
