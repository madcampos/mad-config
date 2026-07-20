# `init`

Initializes a new project with standard configurations and dependencies.

This script sets up:

- Git repository
- `package.json` with standard scripts for linting, formatting, and typechecking
- `pnpm-workspace.yaml`
- Configuration files for TypeScript, dprint, and oxlint
- A basic project structure (`src/index.ts`, `.gitignore`, `README.md`)
- Interactive prompts for:
  - License selection (MIT or LGPL)
  - Local certificates (via `mkcert`)
  - Environment variable management (via `varlock`)
  - Cloudflare Workers (via `wrangler`)
  - Frontend development (via `vite` and `vitest`)

## Usage

```bash
init [options]
```

## Options

| Option Name | Flag | Type      | Default | Description                                |
| :---------- | :--- | :-------- | :------ | :----------------------------------------- |
| `--yes`     | `-y` | `boolean` | `false` | Skip interactive prompts and use defaults. |
