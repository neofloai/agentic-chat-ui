// Puts "use client" exactly where React Server Components need it.
//
// tsup adds the directive to every output file as a banner. That's wrong in two ways:
//  - in CJS output tsup puts helper code first, which takes the directive out of the prologue;
//  - /core and /mock contain no React. Marking them client-only would stop server code (a route
//    handler, a server action) from calling createRestAdapter or the mock backend.
// So: files that import React keep the directive, moved to the very top; the rest lose it.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../dist/', import.meta.url).pathname;
const REACT_ENTRY = /^(index|headless|charts)\.(c?js)$/;
const IMPORTS_REACT =
  /(?:from|require\()\s*["'](?:react|react\/jsx-runtime|react-dom|@neofloai\/atoms[^"']*|recharts|react-markdown|@radix-ui\/react-slot)["']/;

let kept = 0;
let stripped = 0;
for (const name of readdirSync(dir)) {
  if (!/\.c?js$/.test(name)) continue;
  const file = join(dir, name);
  const src = readFileSync(file, 'utf8');
  const body = src.replace(/"use client";\n?/g, '');
  if (REACT_ENTRY.test(name) || IMPORTS_REACT.test(body)) {
    writeFileSync(file, `"use client";\n${body}`);
    kept++;
  } else {
    writeFileSync(file, body);
    stripped++;
  }
}
console.log(`fix-directives: "use client" on ${kept} React file(s), removed from ${stripped} framework-free file(s)`);
