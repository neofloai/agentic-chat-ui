import { NeofloThemeProvider } from '@neofloai/atoms';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgenticChat } from '../../src/index';
import { createMockAdapter, type MockAdapterOptions } from '../../src/mock';

function renderChat(props: Partial<React.ComponentProps<typeof AgenticChat>> = {}) {
  const adapter = props.adapter ?? createMockAdapter({ latency: 0, speed: 0 });
  return render(
    <NeofloThemeProvider defaultMode="light">
      <div style={{ height: 800 }}>
        <AgenticChat adapter={adapter} persistence={false} refreshOnFocus={false} {...props} />
      </div>
    </NeofloThemeProvider>,
  );
}

async function ask(text: string) {
  const input = await screen.findByRole('textbox', { name: 'Message' });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

const mock = (options: MockAdapterOptions = {}) => createMockAdapter({ latency: 0, speed: 0, ...options });

describe('<AgenticChat> on the v1.2 standard', () => {
  it('shows a tool_use and its tool_result as one card with the results', async () => {
    renderChat();
    await ask('Which invoices are still waiting on me?');
    expect(await screen.findByText('4 results', undefined, { timeout: 4000 })).toBeTruthy();
    // The result block isn't rendered a second time on its own.
    expect(screen.getAllByText('search_invoices')).toHaveLength(1);
  });

  it('marks a tool interrupted when the reply ended without its result', async () => {
    renderChat();
    await ask('interrupt the ERP lookup');
    expect(await screen.findByText('Interrupted', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('erp_lookup')).toBeTruthy();
  });

  it('reconnects through onConnectionRequired from the Reconnect button and answers', async () => {
    const adapter = mock();
    const onConnectionRequired = vi.fn(async ({ sourceId }: { sourceId: string | null }) => {
      // The first call (automatic) is declined; the button click succeeds.
      if (onConnectionRequired.mock.calls.length === 1) return false;
      adapter.connect(sourceId!);
      return true;
    });
    renderChat({ adapter, onConnectionRequired });
    await ask('search invoice processing');
    expect(await screen.findByText('Reconnect invoice processing to continue.', undefined, { timeout: 4000 })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Reconnect Invoice processing' }));
    expect(await screen.findByText(/connected again/, undefined, { timeout: 4000 })).toBeTruthy();
    expect(onConnectionRequired).toHaveBeenCalledTimes(2);
  });

  it('shows the connection error without a Reconnect button when the host has no hook', async () => {
    renderChat();
    await ask('search invoice processing');
    expect(await screen.findByText('Reconnect invoice processing to continue.', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Reconnect/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('hides Archive when the backend has no archive capability', async () => {
    const now = new Date().toISOString();
    const adapter = mock({
      config: {
        capabilities: { hitl: true, attachments: false, workflow_context: false, archive: false, cancel: 'disconnect' },
      },
      seed: [
        {
          conversation_id: 'c1',
          title: 'Acme Q3 invoice review',
          created_at: now,
          updated_at: now,
          archived: false,
          messages: [{ message_id: 'm', conversation_id: 'c1', role: 'user', content: 'hi', created_at: now }],
        },
      ],
    });
    renderChat({ adapter });
    fireEvent.click(await screen.findByRole('button', { name: 'Show chat history' }));
    const nav = await screen.findByRole('navigation', { name: 'History' });
    fireEvent.click(await within(nav).findByRole('button', { name: 'More actions for Acme Q3 invoice review' }));
    expect(await screen.findByRole('menuitem', { name: /Rename/ })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: /Archive/ })).toBeNull();
    expect(within(nav).queryByText('Show archived')).toBeNull();
    // Attachments are off too: no paperclip.
    expect(screen.queryByRole('button', { name: 'Attach files' })).toBeNull();
  });

  it("renders another product's block through its fallback_text", async () => {
    const adapter = mock({
      includeDefaultScenarios: false,
      scenarios: [
        {
          name: 'product card',
          match: () => true,
          run: async (w) => {
            await w.block({
              type: 'askneo.invoice_card',
              category: 'content',
              fallback_text: 'Invoice **INV-1042** is held.',
              data: { number: 'INV-1042' },
            });
          },
        },
      ],
    });
    renderChat({ adapter });
    await ask('show the card');
    expect(await screen.findByText('INV-1042', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText(/is held/)).toBeTruthy();
  });

  it("blocks a message longer than the backend's limit", async () => {
    renderChat({ adapter: mock({ config: { limits: { max_message_chars: 10 } } }) });
    const input = await screen.findByRole('textbox', { name: 'Message' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy());
    fireEvent.change(input, { target: { value: 'this is far too long' } });
    expect(await screen.findByText('Messages can be up to 10 characters.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
