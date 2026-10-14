import { NeofloThemeProvider } from '@neofloai/atoms';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgenticChat, defineBlock, useHitl, type ChatAction } from '../../src/index';
import { createMockAdapter } from '../../src/mock';

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

describe('<AgenticChat>', () => {
  it('shows the server greeting and suggested prompts, then answers a suggestion', async () => {
    renderChat();
    expect(await screen.findByText('Hey! What can I help you dig into today?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'What is waiting on me?' }));
    // The user's turn shows the prompt text, not the chip label.
    expect(await screen.findByText('Which invoices are still waiting on me?')).toBeTruthy();
    expect(await screen.findByText(/Four are waiting on you/, undefined, { timeout: 4000 })).toBeTruthy();
    // The text streams in first; the table and sources blocks come after it.
    expect(await screen.findByText('Held invoices', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('search_invoices')).toBeTruthy();
    expect(await screen.findByText('3 sources', undefined, { timeout: 4000 })).toBeTruthy();
  });

  it('sends on Enter but not on Shift+Enter, and clears the composer', async () => {
    renderChat();
    const input = (await screen.findByRole('textbox', { name: 'Message' })) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'first line' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(input.value).toBe('first line');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(input.value).toBe(''));
    expect(await screen.findByText('first line')).toBeTruthy();
  });

  it('does not send while an IME composition is in progress', async () => {
    renderChat();
    const input = (await screen.findByRole('textbox', { name: 'Message' })) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'にほん' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(input.value).toBe('にほん');
  });

  it('runs the approval HITL flow: pause, block the composer, approve, continue', async () => {
    renderChat();
    const input = (await screen.findByRole('textbox', { name: 'Message' })) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Post the held invoices to NetSuite' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const approve = await screen.findByRole('button', { name: 'Post all four' }, { timeout: 4000 });
    await waitFor(() => expect(input.disabled).toBe(true));
    expect(input.placeholder).toBe('Respond to the card above to continue');
    await waitFor(() => expect((approve as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(approve);
    expect(await screen.findByText('Approved', undefined, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText(/VB-2231/, undefined, { timeout: 4000 })).toBeTruthy();
    await waitFor(() => expect(input.disabled).toBe(false));
  });

  it('renders custom blocks and routes emit() to onAction', async () => {
    const onAction = vi.fn<(a: ChatAction) => void>();
    const invoiceCard = defineBlock<{ number: string }>({
      type: 'invoice_card',
      parse: (b) => ({ number: String(b.number) }),
      render: ({ data, actions }) => (
        <button type="button" onClick={() => actions.emit('open_invoice', data)}>
          Open {data.number}
        </button>
      ),
    });
    const adapter = createMockAdapter({
      latency: 0,
      speed: 0,
      includeDefaultScenarios: false,
      scenarios: [
        {
          name: 'card',
          match: () => true,
          run: async (w) => {
            await w.block({ type: 'invoice_card', category: 'ui', number: 'INV-1042' });
          },
        },
      ],
    });
    renderChat({ adapter, blocks: [invoiceCard], onAction });
    const input = await screen.findByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'show me the invoice' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('button', { name: 'Open INV-1042' }, { timeout: 4000 }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ name: 'open_invoice', payload: { number: 'INV-1042' } }));
  });

  it('isolates a crashing block behind an error boundary', async () => {
    const boom = defineBlock({
      type: 'boom',
      render: () => {
        throw new Error('kaboom');
      },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const adapter = createMockAdapter({
      latency: 0,
      speed: 0,
      includeDefaultScenarios: false,
      scenarios: [
        {
          name: 'boom',
          match: () => true,
          run: async (w) => {
            await w.block({ type: 'boom', category: 'ui' });
            await w.text('Still here.');
          },
        },
      ],
    });
    renderChat({ adapter, blocks: [boom] });
    const input = await screen.findByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'go' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('This part of the answer couldn’t be displayed.', undefined, { timeout: 4000 })).toBeTruthy();
    expect(await screen.findByText('Still here.')).toBeTruthy();
    spy.mockRestore();
  });

  it('lets a custom card answer a checkpoint through useHitl', async () => {
    function Consent() {
      const hitl = useHitl();
      return (
        <button type="button" disabled={!hitl.canSubmit} onClick={() => void hitl.submit({ agreed: true })}>
          {hitl.isResolved ? 'Thanks' : 'I agree'}
        </button>
      );
    }
    const consent = defineBlock({ type: 'consent', render: Consent });
    let seen: unknown;
    const adapter = createMockAdapter({
      latency: 0,
      speed: 0,
      includeDefaultScenarios: false,
      scenarios: [
        {
          name: 'consent',
          match: () => true,
          run: async (w) => {
            await w.pause({
              block: { type: 'consent', category: 'hitl' },
              onResume: async (next, decision) => {
                seen = decision;
                await next.text('Recorded.');
              },
            });
          },
        },
      ],
    });
    renderChat({ adapter, blocks: [consent] });
    const input = await screen.findByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'start' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const btn = (await screen.findByRole('button', { name: 'I agree' }, { timeout: 4000 })) as HTMLButtonElement;
    await waitFor(() => expect(btn.disabled).toBe(false));
    fireEvent.click(btn);
    expect(await screen.findByText('Recorded.', undefined, { timeout: 4000 })).toBeTruthy();
    expect(seen).toEqual({ agreed: true });
    expect(screen.getByRole('button', { name: 'Thanks' })).toBeTruthy();
  });

  it('lists history, and renames a chat through the menu and dialog', async () => {
    const adapter = createMockAdapter({
      latency: 0,
      speed: 0,
      seed: [
        {
          conversation_id: 'c1',
          title: 'Acme Q3 invoice review',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived: false,
          messages: [
            {
              message_id: 'm',
              conversation_id: 'c1',
              role: 'user',
              content: [{ id: 'b', type: 'text', category: 'content', text: 'hi' }],
              created_at: new Date().toISOString(),
            },
          ],
        },
      ],
    });
    renderChat({ adapter });
    // jsdom has no layout, so the chat is in its compact mode: open the history overlay.
    fireEvent.click(await screen.findByRole('button', { name: 'Show chat history' }));
    const nav = await screen.findByRole('navigation', { name: 'History' });
    expect(await within(nav).findByText('Acme Q3 invoice review')).toBeTruthy();
    fireEvent.click(within(nav).getByRole('button', { name: 'More actions for Acme Q3 invoice review' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog');
    const field = within(dialog).getByRole('textbox');
    fireEvent.change(field, { target: { value: 'Acme review (done)' } });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    });
    expect(await within(nav).findByText('Acme review (done)')).toBeTruthy();
  });
});
