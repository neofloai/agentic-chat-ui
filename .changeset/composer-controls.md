---
'@neofloai/agentic-chat': minor
---

Composer controls you can add yourself, and a generic picker for them.

- `ChatComposer` takes `leadingActions` (left, after the attach button and the workflow picker) and `scopePicker` (your own node in the workflow picker's place, or `false` to hide it). `extraActions` still goes on the right, before Send.
- New `ComposerPicker`: the Figma Composer-scope pill and SourcePicker menu, for any choices (tools, models, data sources…). Multiple or single selection, groups with headings and an optional Select all / Deselect all, descriptions, icons, disabled items and a footer. Controlled, and usable outside a `ChatProvider`.
- The built-in workflow picker (`ScopePicker`) is now a `ComposerPicker`, so it matches the Figma pill and menu.
- New labels: `pickerSummary`, `pickerSelectAll`, `pickerDeselectAll`.
