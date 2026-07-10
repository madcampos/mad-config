#!/usr/bin/env node
/// <reference types="@types/node" />

import { type ParseArgsOptionsConfig, parseArgs, stripVTControlCharacters, styleText } from 'node:util';
import { changelogFromCommits } from '../src/changelog/changelog.ts';
import { getPackageVersion, writeChangelogFile } from '../src/changelog/files.ts';
import {
	commitChangelog,
	createGitTag,
	createRelease,
	getBaseUrl,
	getCommits,
	getFromRef,
	getLastCommitDate,
	pushChanges
} from '../src/changelog/git.ts';

// #region Config
interface ConfigHelp {
	message: string;
	default?: string;
	value?: string;
}

const config = {
	'output': {
		type: 'string',
		short: 'o',
		help: {
			message: 'Directory to save the changelog.',
			value: 'dir'
		},
		required: true
	},
	'from': {
		type: 'string',
		short: 'f',
		help: {
			message: 'Starting git tag/commit.',
			default: 'latest git tag',
			value: 'ref'
		}
	},
	'to': {
		type: 'string',
		short: 't',
		default: 'HEAD',
		help: {
			message: 'Ending git tag/commit.',
			value: 'ref'
		}
	},
	'package-json-path': {
		type: 'string',
		short: 'p',
		default: 'package.json',
		help: {
			message: 'Path to "package.json".',
			value: 'path'
		}
	},
	'commit': {
		type: 'boolean',
		short: 'c',
		default: false,
		help: {
			message: 'Commit the generated changelog.'
		}
	},
	'message': {
		type: 'string',
		short: 'm',
		default: 'chore: update changelog',
		help: {
			message: 'Commit message to use.'
		}
	},
	'tag': {
		type: 'boolean',
		short: 'g',
		default: false,
		help: {
			message: 'Create a git tag for the "to" version.'
		}
	},
	'push': {
		type: 'boolean',
		short: 's',
		default: false,
		help: {
			message: 'Commit, tag, and push changes to remote.'
		}
	},
	'create-release': {
		type: 'boolean',
		short: 'r',
		default: false,
		help: {
			message: 'Create a GitHub release using the gh CLI.'
		}
	},
	'help': {
		type: 'boolean',
		short: 'h',
		default: false,
		help: {
			message: 'Display this help message.'
		}
	}
} as const;
// #endregion

// #region Arg validation
const { values: options } = parseArgs({ options: config });

if (options.help) {
	// oxlint-disable no-console
	console.log('Generates a Markdown changelog from Git history.\n');

	console.log(styleText('bold', 'Usage:'));
	console.log('  $ changelog [options]\n');

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

if (!options.output) {
	console.error('Missing required argument: --outputDir');
	process.exit(1);
}

if ((options.commit && options.push)) {
	console.error('Arguments --commit and --push aremutually exclusive');
	process.exit(1);
}
// #endregion

// #region Program logic
let versionName = options.to;
if (options.tag || options.push) {
	const packageVersion = await getPackageVersion(options['package-json-path']);

	if (packageVersion) {
		versionName = packageVersion;
	}
}

const fromRef = getFromRef(options.from);
const commits = getCommits(fromRef, options.to);
const baseUrl = getBaseUrl();
const changelogDate = getLastCommitDate(options.to);

const changelog = changelogFromCommits({
	commits,
	baseUrl,
	date: changelogDate,
	fromRef,
	toRef: versionName,
	versionName
});

const changelogFile = await writeChangelogFile(options.output, versionName, changelog);

if (!changelogFile) {
	console.error('Failed to write changelog file.');
	process.exit(1);
}

if (options.commit || options.push) {
	commitChangelog(changelogFile, options.message);

	if (options.tag || options.push) {
		createGitTag(versionName);
	}
}

if (options.push) {
	pushChanges();
}

if (options['create-release']) {
	createRelease({
		versionName,
		notesFile: changelogFile
	});
}
