# bolt.diy (Previously oTToDev)

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
