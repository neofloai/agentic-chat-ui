#!/usr/bin/env node
// Publishes the current package.json version as a git tag that carries a prebuilt dist/.
//
// Consumers install with `npm i github:neofloai/agentic-chat-ui#semver:^X.Y.Z`. npm resolves the
// range against tags. The `prepare` build also lets a branch or commit install from git, but the
// tag still carries dist/ so a release never depends on building on the consumer's machine.
// main never contains dist/: the release commit is created detached from it.
//
// Run by hand with `npm run release`, on an up-to-date main, after the version PR (from
// `npm run version-packages`) has merged. It refuses anything else. Safe to re-run: an existing
// tag is left alone.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const fail = (message) => {
  console.error(`Not releasing: ${message}`);
  process.exit(1);
};

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;

const remoteTags = sh('git ls-remote --tags origin');
if (remoteTags.includes(`refs/tags/${tag}`)) {
  console.log(`${tag} already exists; nothing to release.`);
  process.exit(0);
}

// Release exactly what is on main, versioned and with its changelog.
const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') fail(`on ${branch}. Check out main.`);
if (sh('git status --porcelain')) fail('the working tree has changes. Commit or stash them.');
sh('git fetch origin main');
if (sh('git rev-parse HEAD') !== sh('git rev-parse origin/main')) fail('main differs from origin/main. Pull or push first.');
const pending = readdirSync('.changeset').filter((f) => f.endsWith('.md') && f !== 'README.md');
if (pending.length)
  fail(`${pending.length} changeset(s) not versioned yet. Run \`npm run version-packages\` and merge that first.`);

// Notes for the GitHub Release: this version's section of the changelog.
let changelog = '';
try {
  changelog = readFileSync('CHANGELOG.md', 'utf8');
} catch {
  // checked below
}
const start = changelog.indexOf(`## ${version}`);
if (start === -1) fail(`CHANGELOG.md has no "## ${version}" section.`);
const rest = changelog.slice(start + 1);
const end = rest.search(/\n## \d/);
const notes = changelog.slice(start, end === -1 ? undefined : start + 1 + end).trim();

try {
  sh('gh auth status');
} catch {
  fail('the GitHub CLI is not signed in. Run `gh auth login`.');
}

console.log(`Releasing ${tag} from main (${sh('git rev-parse --short HEAD')})`);

// Typecheck, lint, tests, build and package validation; dist/ is what the tag carries.
run('npm run check');

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
