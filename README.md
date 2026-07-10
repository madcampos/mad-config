# @mad-c/config

Shared configurations for the following tools:

- [TypeScript](https://www.typescriptlang.org/)
- [dprint](https://dprint.dev/)
- [oxlint](https://oxc.rs/docs/guide/usage/linter)

All configurations set all available flags.

## Installation

```bash
pnpm add -D @mad-c/config
```

## Usage

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
