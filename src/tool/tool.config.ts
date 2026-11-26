import type { ToolConfig } from '@itsjust/core';

const toolConfig: ToolConfig = {
  id: 'ascii-art-banner-generator',
  name: 'ASCII Art Banner Generator',
  version: '1.0.0',
  description:
    'Convert text into big ASCII art banners using multiple FIGlet-style fonts with copy and download export.',
  exportFormats: ['json'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: { brand: 'ASCII Art Banner Generator', icon: '🅰' },
};

export default toolConfig;
