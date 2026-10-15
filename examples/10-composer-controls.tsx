// README: Composer controls
import { MenuItem } from '@neofloai/atoms';
import { AgenticChat, ComposerPicker, type ChatAdapter } from '@neofloai/agentic-chat';
import { useState } from 'react';

export function Chat({ adapter, openToolSettings }: { adapter: ChatAdapter; openToolSettings: () => void }) {
  const [tools, setTools] = useState(['web', 'docs']);
  const [model, setModel] = useState(['balanced']);
  return (
    <AgenticChat
      adapter={adapter}
      composerProps={{
        leadingActions: (
          <ComposerPicker
            name="Tools"
            groups={[
              {
                id: 'tools',
                label: 'Tools',
                selectAll: true, // the heading selects or clears the group ("Select all" / "Deselect all")
                items: [
                  { id: 'web', label: 'Web search' },
                  { id: 'docs', label: 'Documents', description: 'Files uploaded to this workspace' },
                ],
              },
            ]}
            value={tools}
            onChange={setTools}
            footer={(close) => (
              <MenuItem
                onClick={() => {
                  close();
                  openToolSettings();
                }}
              >
                Tool settings…
              </MenuItem>
            )}
          />
        ),
        extraActions: (
          <ComposerPicker
            name="Model"
            multiple={false}
            items={[
              { id: 'fast', label: 'Fast' },
              { id: 'balanced', label: 'Balanced' },
            ]}
            value={model}
            onChange={setModel}
          />
        ),
      }}
    />
  );
}
