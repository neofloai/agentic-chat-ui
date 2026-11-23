---
'@neofloai/agentic-chat': minor
---

Move to Atoms 4. The `@neofloai/atoms` peer range is now `^4.0.0`; install it with `npm install github:neofloai/atoms#semver:^4.0.0`. Atoms 4 renamed `Chip` to `Tag` and made it a label only, so the chat no longer works with Atoms 3.

What changes on screen:

- Status labels (tool failed or interrupted, approved, rejected, submitted, an artifact's format, and the run-status pill) are Atoms `Tag`s. The run-status pill is now a 20px tag where it was a 32px pill.
- The `ComposerPicker` trigger, which includes the workflow scope picker, is an outlined `Button`. It is the same height and is still fully round.
- A pending attachment in the composer is a `Tag` with the file name, followed by its own remove button, labelled with `labels.removeAttachment`. The `Delete` and `Backspace` keys no longer remove a focused attachment; use the button.
