import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Canvas } from '@/tool/components/Canvas';
import { Toolbar } from '@/tool/components/Toolbar';
import { Sidebar } from '@/tool/components/Sidebar';
import { DEFAULT_STATE, type ToolState } from '@/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('Canvas', () => {
  it('prompts for input when text is empty', () => {
    render(<Canvas state={state({ text: '' })} />);
    expect(screen.getByTestId('banner-empty')).toBeInTheDocument();
  });

  it('renders a live banner with stats for non-empty text', () => {
    const onChange = vi.fn();
    render(<Canvas state={state({ text: 'Hi' })} onChange={onChange} />);
    const output = screen.getByTestId('banner-output');
    expect(output.textContent!.length).toBeGreaterThan(0);
    expect(screen.getByTestId('banner-stats').textContent).toMatch(/\d+ × \d+/);
    expect(screen.queryByTestId('banner-overflow-warning')).toBeNull();
  });

  it('updates text via the textarea', () => {
    const onChange = vi.fn();
    render(<Canvas state={state()} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('banner-input'), { target: { value: 'Yo' } });
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0]![0] as ToolState;
    expect(next.text).toBe('Yo');
  });

  it('shows a warning when the banner overflows max width', () => {
    render(<Canvas state={state({ text: 'AAAAA AAAA', maxWidth: 20, wordWrap: false })} />);
    expect(screen.getByTestId('banner-overflow-warning')).toBeInTheDocument();
  });

  it('applies comment prefixes to non-empty output lines', () => {
    render(<Canvas state={state({ text: 'Hi', commentPrefix: '//' })} />);
    const lines = screen.getByTestId('banner-output').textContent!.split('\n');
    const nonEmpty = lines.filter((l) => l.trim() !== '');
    expect(nonEmpty.length).toBeGreaterThan(0);
    expect(nonEmpty.every((l) => l.startsWith('// '))).toBe(true);
  });

  it('provides copy and download buttons', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Canvas state={state({ text: 'Hi' })} />);
    fireEvent.click(screen.getByTestId('btn-copy-banner'));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByTestId('btn-download-banner')).toBeInTheDocument();
  });

  it('flips copy label to Copied! after clicking', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<Canvas state={state({ text: 'Hi' })} />);
    fireEvent.click(screen.getByTestId('btn-copy-banner'));
    await vi.waitFor(() =>
      expect(screen.getByTestId('btn-copy-banner').textContent).toBe('Copied!')
    );
  });

  it('save button records history via callback', () => {
    const onSaveHistory = vi.fn();
    render(<Canvas state={state({ text: 'Hi' })} onSaveHistory={onSaveHistory} />);
    fireEvent.click(screen.getByTestId('btn-save-history'));
    expect(onSaveHistory).toHaveBeenCalledTimes(1);
  });
});

describe('Toolbar', () => {
  it('switches fonts via the select', () => {
    const onChange = vi.fn();
    render(<Toolbar state={state()} onChange={onChange} onClear={() => {}} />);
    fireEvent.change(screen.getByTestId('font-select'), { target: { value: 'doom' } });
    expect((onChange.mock.calls[0]![0] as ToolState).font).toBe('doom');
  });

  it('clears text and shows copy button when passed', () => {
    const onClear = vi.fn();
    const onCopy = vi.fn();
    render(<Toolbar state={state()} onChange={() => {}} onClear={onClear} onCopy={onCopy} />);
    fireEvent.click(screen.getByTestId('btn-clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('btn-copy-result'));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('offers clear-history only when history exists', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Toolbar state={state({ history: [] })} onChange={onChange} onClear={() => {}} />
    );
    expect(screen.queryByTestId('btn-clear-history')).toBeNull();
    rerender(
      <Toolbar
        state={state({ history: [{ text: 'Hi', font: 'small', createdAt: 'now' }] })}
        onChange={onChange}
        onClear={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId('btn-clear-history'));
    expect((onChange.mock.calls[0]![0] as ToolState).history).toEqual([]);
  });
});

describe('Sidebar', () => {
  it('lists all fonts and marks the active one', () => {
    render(<Sidebar state={state({ font: 'slant' })} onChange={() => {}} />);
    expect(screen.getByTestId('font-active-slant')).toBeInTheDocument();
    expect(screen.queryByTestId('font-active-standard')).toBeNull();
  });

  it('toggles output options', () => {
    const onChange = vi.fn();
    render(<Sidebar state={state()} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('opt-center'));
    expect((onChange.mock.calls[0]![0] as ToolState).center).toBe(true);
    fireEvent.click(screen.getByTestId('opt-word-wrap'));
    expect((onChange.mock.calls[1]![0] as ToolState).wordWrap).toBe(false);
  });

  it('updates max width and comment prefix', () => {
    const onChange = vi.fn();
    render(<Sidebar state={state()} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('opt-max-width'), { target: { value: '80' } });
    expect((onChange.mock.calls[0]![0] as ToolState).maxWidth).toBe(80);
    fireEvent.change(screen.getByTestId('opt-comment-prefix'), { target: { value: '#' } });
    expect((onChange.mock.calls[1]![0] as ToolState).commentPrefix).toBe('#');
  });

  it('rejects non-finite max width entries defensively', () => {
    const onChange = vi.fn();
    render(<Sidebar state={state()} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('opt-max-width'), { target: { value: 'abc' } });
    expect((onChange.mock.calls[0]![0] as ToolState).maxWidth).toBe(0);
  });

  it('shows history count with correct singular/plural', () => {
    const { rerender } = render(<Sidebar state={state()} onChange={() => {}} />);
    expect(screen.getByTestId('sidebar-history-count').textContent).toContain('0 entries');
    rerender(
      <Sidebar
        state={state({ history: [{ text: 'x', font: 'small', createdAt: 'n' }] })}
        onChange={() => {}}
      />
    );
    expect(screen.getByTestId('sidebar-history-count').textContent).toContain('1 entry in');
  });
});
