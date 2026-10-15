# Changesets

Every PR that changes the published library adds a changeset:

```bash
npm run changeset
```

Pick the bump (`patch` for fixes, `minor` for new blocks or props, `major` for anything that breaks
an existing integration, including a change to the backend contract) and describe the change for
the people upgrading.

Releases are manual. Nothing is versioned or tagged when a PR merges; the changesets wait on `main`
until someone cuts a release:

1. From an up-to-date `main`, on a new branch: `npm run version-packages`. It turns the pending
   changesets into the version bump in `package.json` and a new section in `CHANGELOG.md`, and
   deletes them. Read the changelog section and edit it if it needs it, then open a PR
   ("chore: release vX.Y.Z") and merge it.
2. On `main`, pulled, with a clean working tree: `npm run release`. It checks that there are no
   pending changesets and that `CHANGELOG.md` has the version's section, runs `npm run check`, then
   tags `vX.Y.Z` on a commit that carries the built `dist/`, pushes the tag, and creates the GitHub
   Release with that changelog section as its notes. Needs the GitHub CLI signed in (`gh auth login`).

Running `npm run release` again for a version that's already tagged does nothing.
