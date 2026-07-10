# `changelog`

Generates a Markdown changelog from Git history.

## Usage

```bash
changelog [options]
```

## Options

| Option Name           | Flag | Type      | Default                   | Description                                    |
| :-------------------- | :--- | :-------- | :------------------------ | :--------------------------------------------- |
| `--output`            | `-o` | `string`  |                           | **Required.** Directory to save the changelog. |
| `--from`              | `-f` | `string`  | `latest git tag`          | Starting git tag/commit.                       |
| `--to`                | `-t` | `string`  | `HEAD`                    | Ending git tag/commit.                         |
| `--package-json-path` | `-p` | `string`  | `package.json`            | Path to `package.json`.                        |
| `--commit`            | `-c` | `boolean` | `false`                   | Commit the generated changelog.                |
| `--message`           | `-m` | `string`  | `chore: update changelog` | Commit message to use.                         |
| `--tag`               | `-g` | `boolean` | `false`                   | Create a git tag for the `to` version.         |
| `--push`              | `-s` | `boolean` | `false`                   | Commit and push changes to remote.             |
| `--create-release`    | `-r` | `boolean` | `false`                   | Create a GitHub release using the `gh` CLI.    |
| `--help`              | `-h` | `boolean` | `false`                   | Display this help message.                     |
