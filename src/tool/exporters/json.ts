import type { Exporter } from '@itsjust/core';
import { sanitizeFilename } from '@itsjust/core';
import { formatExportError, throwIfAborted } from './utils';

/** Plain-text exporter: downloads the current output as a .txt file. */
const txtExporter: Exporter = {
  format: 'json', // closest supported core format slot; treated as text download
  export: async (element, options): Promise<import('@itsjust/core').ExportResult> => {
    void element;
    try {
      throwIfAborted(options.signal);
      const text =
        typeof (options as unknown as { text?: unknown }).text === 'string'
          ? (options as unknown as { text: string }).text
          : '';
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      return {
        success: true,
        data: blob,
        filename: sanitizeFilename(options.filename ?? 'banner.txt'),
        format: 'json',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        filename: sanitizeFilename(options.filename ?? 'banner.txt'),
        format: 'json',
        error: formatExportError(error, 'TXT'),
      };
    }
  },
};

export default txtExporter;
