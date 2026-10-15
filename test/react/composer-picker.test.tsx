import { NeofloThemeProvider } from '@neofloai/atoms';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AgenticChat, ChatComposer, ChatProvider, ComposerPicker, type ComposerPickerProps } from '../../src/index';
import { createMockAdapter } from '../../src/mock';

function inTheme(node: ReactNode) {
  return render(<NeofloThemeProvider defaultMode="light">{node}</NeofloThemeProvider>);
}

/** A controlled picker, as an app would hold it. */
function Picker({
  initial,
  onChange,
  ...props
}: Omit<ComposerPickerProps, 'value' | 'onChange'> & { initial: string[]; onChange?: (v: string[]) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <ComposerPicker
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

const TOOLS = [
  {
    id: 'home',
    label: 'Home',
    selectAll: true,
    items: [
      { id: 'web', label: 'Web search' },
      { id: 'docs', label: 'Documents', description: 'Your uploaded files' },
      { id: 'erp', label: 'ERP', disabled: true },
    ],
  },
];

describe('<ComposerPicker>', () => {
  it('summarizes the selection and toggles items, keeping the menu open', () => {
    const onChange = vi.fn();
    inTheme(<Picker name="Tools" groups={TOOLS} initial={['web', 'docs', 'erp']} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Tools: All tools' });
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Home')).toBeTruthy();
    expect(within(menu).getByText('Your uploaded files')).toBeTruthy();

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /Web search/ }));
    expect(onChange).toHaveBeenLastCalledWith(['docs', 'erp']);
    // Still open, and the heading now offers to select the rest.
    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Home: Select all' })).toBeTruthy();
    // The open menu hides the page from the accessibility tree, the trigger included.
    expect(screen.getByRole('button', { name: 'Tools: Tools (2)', hidden: true })).toBeTruthy();
  });

  it("selects or clears a group's enabled items from its heading", () => {
    const onChange = vi.fn();
    inTheme(<Picker name="Tools" groups={TOOLS} initial={['erp']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /^Tools:/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Home: Select all' }));
    // The disabled ERP row keeps its state; the enabled ones are added.
    expect(onChange).toHaveBeenLastCalledWith(['erp', 'web', 'docs']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Home: Deselect all' }));
    expect(onChange).toHaveBeenLastCalledWith(['erp']);
  });

  it('picks one item in single mode, shows it on the trigger and closes', () => {
    const onChange = vi.fn();
    inTheme(
      <Picker
        name="Model"
        multiple={false}
        items={[
          { id: 'fast', label: 'Fast' },
          { id: 'deep', label: 'Deep' },
        ]}
        initial={['fast']}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Model: Fast' }));
    expect(screen.getByRole('menuitemradio', { name: 'Fast' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Deep' }));
    expect(onChange).toHaveBeenCalledWith(['deep']);
    expect(screen.getByRole('button', { name: 'Model: Deep' })).toBeTruthy();
  });

  it('renders a footer that can close the menu', () => {
    const manage = vi.fn();
    inTheme(
      <Picker
        name="Tools"
        groups={TOOLS}
        initial={[]}
        footer={(close) => (
          <button
            type="button"
            onClick={() => {
              close();
              manage();
            }}
          >
            Manage tools
          </button>
        )}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tools: No tools' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage tools' }));
    expect(manage).toHaveBeenCalled();
  });
});

describe('<ChatComposer> slots', () => {
  const adapter = () => createMockAdapter({ latency: 0, speed: 0 });
  const scope = {
    groups: [
      {
        id: 'ws',
        label: 'Home',
        items: [
          { id: 'ip', label: 'Invoice Processing' },
          { id: 'col', label: 'Collections' },
        ],
      },
    ],
  };

  it('puts leading controls on the left and can leave the workflow picker out', async () => {
    inTheme(
      <ChatProvider adapter={adapter()} persistence={false} refreshOnFocus={false} scope={scope}>
        <ChatComposer
          scopePicker={false}
          leadingActions={<button type="button">Lead</button>}
          extraActions={<button type="button">Trail</button>}
        />
      </ChatProvider>,
    );
    await screen.findByRole('textbox', { name: 'Message' });
    const lead = screen.getByRole('button', { name: 'Lead' });
    const trail = screen.getByRole('button', { name: 'Trail' });
    expect(lead.compareDocumentPosition(trail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Choose which workflows/ })).toBeNull();
  });

  it('replaces the workflow picker with your own', async () => {
    inTheme(
      <ChatProvider adapter={adapter()} persistence={false} refreshOnFocus={false} scope={scope}>
        <ChatComposer scopePicker={<button type="button">My scope</button>} />
      </ChatProvider>,
    );
    await screen.findByRole('textbox', { name: 'Message' });
    expect(screen.getByRole('button', { name: 'My scope' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Choose which workflows/ })).toBeNull();
  });

  it('keeps the built-in workflow picker, with Select all / Deselect all per workspace', async () => {
    inTheme(
      <div style={{ height: 800 }}>
        <AgenticChat adapter={adapter()} persistence={false} refreshOnFocus={false} scope={scope} />
      </div>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Choose which workflows to ask about: All workflows' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Home')).toBeTruthy();
    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: 'Collections' }));
    expect(screen.getByRole('button', { name: 'Choose which workflows to ask about: 1 workflow', hidden: true })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Home: Select all' }));
    expect(screen.getByRole('button', { name: 'Choose which workflows to ask about: All workflows', hidden: true })).toBeTruthy();
  });
});
