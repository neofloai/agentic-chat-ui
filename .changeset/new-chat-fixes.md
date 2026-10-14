---
'@neofloai/agentic-chat': patch
---

New chat fixes:

- Clicking New chat while a new chat is still being created now opens that chat. Before, if you had moved to another conversation in the meantime, the click did nothing. Deleting the open conversation during a create had the same problem and left you on the deleted conversation.
- After a reload, an empty conversation is no longer reopened without its greeting and suggested prompts. The conversation endpoint doesn't return them, so the chat now opens a new conversation that has them. An empty conversation with a half-typed message is still restored as before.
