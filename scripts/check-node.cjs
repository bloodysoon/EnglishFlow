// Fails early with a clear message when Node cannot run .ts files.
// Plain CommonJS on purpose: it must work on any Node version.
const [major, minor] = process.versions.node.split(".").map(Number);
const supportsTypeScript = major > 22 || (major === 22 && minor >= 18);

if (!supportsTypeScript) {
  console.error(
    `\nThis script needs Node 24 (see .nvmrc), but you are on Node ${process.versions.node}.\n` +
      "Run `nvm use` in the project folder, then try again.\n" +
      "To make it the default: `nvm alias default 24`.\n",
  );
  process.exit(1);
}
