# @mad-c/config

Shared configurations for the following tools:

- [TypeScript](https://www.typescriptlang.org/)
- [dprint](https://dprint.dev/)
- [oxlint](https://oxc.rs/docs/guide/usage/linter)
- Changelog CLI tool to write and update changelogs

> [!NOTE]
> All the configurations files set all available configurations for that tool.

## Installation

```bash
pnpm add -D @mad-c/config
```

## Config Usage

### TypeScript

In your `tsconfig.json`:

```json
{
	"extends": "./node_modules/@mad-c/config/tsconfig.json",
	"include": ["src/**/*", "src/**/*.json"],
	"exclude": ["node_modules/**/*", "dist/**/*"]
}
```

### dprint

In your `dprint.json`:

```json
{
	"$schema": "https://dprint.dev/schemas/v0.json",
	"extends": "./node_modules/@mad-c/config/dprint.json"
}
```

### oxlint

In your `.oxlintrc.json`:

```json
{
	"$schema": "./node_modules/oxlint/configuration_schema.json",
	"extends": ["./node_modules/@mad-c/config/oxlint.json"]
}
```

## Changelog

This is a small CLI tool to get the latest commits from the repository and output a markdown changelog file.

Full docs are available as [docs/changelog.md](./docs/changelog.md).
