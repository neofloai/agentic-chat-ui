#!/usr/bin/env node
// Publishes the current package.json version as a git tag that carries a prebuilt dist/.
//
// Consumers install with `npm i github:neofloai/agentic-chat-ui#semver:^X.Y.Z`. npm resolves the
// range against tags and installs that commit as-is (there is no `prepare` build), so the tag
// commit must contain dist/. main never does: the release commit is created detached from it.
//
// Run by .github/workflows/release.yml after a Changesets version PR merges. Safe to re-run:
// an existing tag is left alone.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;

const remoteTags = sh('git ls-remote --tags origin');
if (remoteTags.includes(`refs/tags/${tag}`)) {
  console.log(`${tag} already exists; nothing to release.`);
  process.exit(0);
}

const branch = sh('git rev-parse --abbrev-ref HEAD');
console.log(`Releasing ${tag} from ${branch} (${sh('git rev-parse --short HEAD')})`);

run('npm run build');

// Notes for the GitHub Release: this version's section of the changelog.
let notes = `Release ${tag}`;
try {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');
  const start = changelog.indexOf(`## ${version}`);
  if (start !== -1) {
    const rest = changelog.slice(start + 1);
    const end = rest.search(/\n## \d/);
    notes = changelog.slice(start, end === -1 ? undefined : start + 1 + end).trim();
  }
} catch {
  // no changelog yet
}
const notesFile = join(mkdtempSync(join(tmpdir(), 'release-')), 'notes.md');
writeFileSync(
  notesFile,
  `${notes}\n\nInstall:\n\n\`\`\`bash\nnpm install github:neofloai/agentic-chat-ui#semver:^${version}\n\`\`\`\n`,
);

try {
  run('git checkout --detach');
  run('git add -f dist');
  run(`git commit -m "release: ${tag}" --no-verify`);
  run(`git tag -a ${tag} -m "${tag}"`);
  run(`git push origin ${tag}`);
  run(`gh release create ${tag} --title ${tag} --notes-file "${notesFile}"`);
} finally {
  run(`git checkout ${branch}`);
}
console.log(`Released ${tag}.`);
