# flex-diy

This is fork of the `stable` branch of [bolt.diy](https://github.com/stackblitz-labs/bolt.diy).

### One-time setup

- clone the repo, e.g. git clone git@github.com:get-convex/flex-diy.git
- use node 18 or 20, e.g. `nvm use 18`
- install pnpm somehow, e.g. `npm install -g pnpm
- run `pnpm i`
- run `pnpx convex dev --configure existing --team convex --project bolt-diy-f612e`

Create a .env.local file, include at least

```
# makes it so you won't have to paste one in
ANTHROPIC_API_KEY=sk-ant-api03-...
# Optional, less important now that we download less from GitHub.
# Prevents being rate-limited by GitHub (which causes "Failed to download template")
VITE_GITHUB_ACCESS_TOKEN=ghp_...
# maybe useful
VITE_LOG_LEVEL=debug
```

# each time

```
pnpm i
pnpm run dev
# and in another terminal,
pnpx convex dev
```

# Working on the template

There are a few steps to iterating on the template.

1. Work on `template/`, `bun install` and `bun dev` there, etc.
2. Run `bun snapshotTemplate` to pack all of the Git unignored files in `template` to
   `templates/flex-template.bin` as a bootstrap template. This will not include
   NPM dependencies since we can't cache NPM dependencies installed on the development
   machine, which is a "different" OS than the WebContainer.
3. Load `localhost:3000/?regenerateSnapshot=1` to load the bootstrap snapshot and install
   NPM dependencies within the WebContainer.
4. After installation completes, open the "Snapshot Admin" UI in the top right and
   download the snapshot to `templates/flex-template.bin'.
