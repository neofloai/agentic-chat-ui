# Changesets

Every PR that changes the published library adds a changeset:

```bash
npm run changeset
```

Pick the bump (`patch` for fixes, `minor` for new blocks or props, `major` for anything that breaks
an existing integration, including a change to the backend contract) and describe the change for
the people upgrading.

When the PR merges, the release workflow opens a "Version packages" PR that bumps `package.json`
and writes `CHANGELOG.md`. Merging that PR tags the release (with a prebuilt `dist/`) and creates the
GitHub Release.
