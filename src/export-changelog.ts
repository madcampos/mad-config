#!/usr/bin/env node
/// <reference types="@types/node" />

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type ParseArgsOptionsConfig, parseArgs, stripVTControlCharacters, styleText } from 'node:util';

interface ConfigHelp {
	message: string;
	default?: string;
	value?: string;
}

const config = {
	outputDir: {
		type: 'string',
		short: 'o',
		help: {
			message: 'Directory to save the changelog.',
			value: 'dir'
		},
		required: true
	},
	from: {
		type: 'string',
		short: 'f',
		help: {
			message: 'Starting git tag/commit.',
			default: 'latest git tag',
			value: 'ref'
		}
	},
	to: {
		type: 'string',
		short: 't',
		default: 'HEAD',
		help: {
			message: 'Ending git tag/commit.',
			value: 'ref'
		}
	},
	packageJsonPath: {
		type: 'string',
		short: 'p',
		default: 'package.json',
		help: {
			message: 'Path to "package.json".',
			value: 'path'
		}
	},
	commit: {
		type: 'boolean',
		short: 'c',
		default: false,
		help: {
			message: 'Commit the generated changelog.'
		}
	},
	commitMessage: {
		type: 'string',
		short: 'm',
		default: 'chore: update changelog',
		help: {
			message: 'Commit message to use.'
		}
	},
	tag: {
		type: 'boolean',
		short: 'g',
		default: false,
		help: {
			message: 'Create a git tag for the "to" version.'
		}
	},
	push: {
		type: 'boolean',
		short: 's',
		default: false,
		help: {
			message: 'Commit, tag, and push changes to remote.'
		}
	},
	createRelease: {
		type: 'boolean',
		short: 'r',
		default: false,
		help: {
			message: 'Create a GitHub release using the gh CLI.'
		}
	},
	help: {
		type: 'boolean',
		short: 'h',
		default: false,
		help: {
			message: 'Display this help message.'
		}
	}
} as const;

const { values: options } = parseArgs({ options: config });

if (options.help) {
	// oxlint-disable no-console
	console.log('Generates a Markdown changelog from Git history.\n');

	console.log(styleText('bold', 'Usage:'));
	console.log('  $ export-changelog [options]\n');

	console.log(styleText('bold', 'Options:'));

	// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unsafe-type-assertion
	const optionsHelp = Object.entries(config as unknown as Record<string, ParseArgsOptionsConfig & { help: ConfigHelp }>).map(([arg, argOptions]) => {
		// oxlint-disable typescript/no-base-to-string
		const shortString = argOptions['short'] ? `-${argOptions['short']}, ` : '';
		const argString = `--${arg}`;
		const argValue = argOptions.help.value ? ` ${styleText('cyanBright', `<${argOptions.help.value}>`)}` : '';
		const argLine = `  ${shortString}${argString}${argValue} `;

		const requiredHelp = argOptions['required'] ? ` ${styleText('redBright', '(required)')}` : '';
		const defaultHelp = argOptions.help.default ?? argOptions['default']
			? ` ${styleText('blueBright', `(default: ${argOptions.help.default ?? `"${argOptions['default']}"`})`)}`
			: '';
		const argHelp = `${styleText('gray', argOptions.help.message)}${requiredHelp}${defaultHelp}`;

		return {
			arg: argLine,
			argLength: stripVTControlCharacters(argLine).length,
			help: argHelp
		};
		// oxlint-enable typescript/no-base-to-string
	});

	const longestArg = Math.max(...optionsHelp.map(({ argLength }) => argLength));
	optionsHelp.forEach(({ arg, argLength, help }) => {
		console.log(`${arg}${''.padEnd(longestArg - argLength, ' ')} ${help}`);
	});

	process.exit(0);
	// oxlint-disable no-console
}

if (!options.outputDir) {
	console.error('Missing required argument: --outputDir');
	process.exit(1);
}

if ((options.commit && options.push)) {
	console.error('Arguments --commit and --push aremutually exclusive');
	process.exit(1);
}

function invokeGit(command: string): string {
	try {
		return execSync(`git ${command}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return '';
	}
}

let versionName = options.to;
if (options.tag || options.push) {
	if (options.packageJsonPath && existsSync(options.packageJsonPath)) {
		const pkg = JSON.parse(await readFile(options.packageJsonPath, 'utf-8'));
		versionName = `v${pkg.version}`;
	}
}

let fromRef = options.from ?? '';
fromRef ||= invokeGit('describe --tags --abbrev=0');
fromRef ||= invokeGit('rev-list --max-parents=0 HEAD');

const sectionHeaders = {
	breaking: '### Breaking Changes',
	revert: '### Changes Rollback',
	feat: '### Enhancements',
	fix: '### Fixes',
	perf: '### Performance Improvements',
	refactor: '### Refactors',
	test: '### Tests',
	docs: '### Documentation Updates',
	examples: '### Examples',
	build: '### Builds',
	chore: '### Chores & Tasks',
	ci: '### CI',
	misc: '### Miscellaneous',
	style: '### Stylistic Changes',
	types: '### Type Changes'
} as const;
type SectionHeader = keyof typeof sectionHeaders;

const logOutput = invokeGit(`log ${fromRef ? `${fromRef}...` : ''}${options.to} --pretty=format:"%h%x09%s"`);
const commits = logOutput.split('\n').filter(Boolean).map((line) => {
	const commitRegex = /^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breaking>!)?: (?<desc>.*)$/iu;
	const [hash = '', message = ''] = line.split('\t');
	const match = commitRegex.exec(message);

	let group: SectionHeader = 'misc';
	let logMessage = message;

	if (match?.groups) {
		const { type = 'misc', scope = '', breaking = '', desc = '' } = match.groups;

		logMessage = desc;
		if (scope) {
			logMessage = `**${scope}**: ${desc}`;
		}

		if (breaking) {
			group = 'breaking';
		} else if (type in sectionHeaders) {
			// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unsafe-type-assertion
			group = type as SectionHeader;
		}
	}

	return { hash, group, message: logMessage };
});

// TODO: sort groups
const groupedCommits = Object.groupBy(commits, ({ group }) => group);

const baseUrl = invokeGit('remote get-url origin')
	.replace('.github.io.git', '')
	.replace(/\.git$/iu, '');
const changelogDate = invokeGit(`log -1 --format="%cI" "${options.to}"`);

let changelog = `---
date: ${changelogDate}
versionName: ${versionName}
---

[compare changes](${baseUrl}/compare/${fromRef}...${versionName})`;

if (!existsSync(options.outputDir)) {
	await mkdir(options.outputDir, { recursive: true });
}

const destFile = join(options.outputDir, `${versionName}.md`);

for (const [group, items = []] of Object.entries(groupedCommits)) {
	// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unsafe-type-assertion
	changelog += `\n\n${sectionHeaders[group as SectionHeader]}\n\n`;

	for (const item of items) {
		changelog += `- ${item.message} ([${item.hash}](${baseUrl}/commit/${item.hash}))\n`;
	}
}

await writeFile(destFile, changelog, 'utf-8');

if (options.commit || options.push) {
	invokeGit(`add "${destFile}"`);
	// Use spawnSync for commit to handle spaces in message if needed, but execSync with quotes should work
	execSync(`git commit -m "${options.commitMessage}" --quiet`);

	if (options.tag || options.push) {
		invokeGit(`tag -a "${versionName}" -m "${versionName}"`);
	}
}

if (options.push) {
	invokeGit('push --follow-tags --quiet');
}

if (options.createRelease) {
	try {
		execSync(`gh release create "${versionName}" --notes-file "${destFile}" --title "${versionName}"`, { stdio: 'inherit' });
	} catch {
		console.warn('gh CLI not found or failed. Skipping release creation.');
	}
}
