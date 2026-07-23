#!/usr/bin/env node

/// <reference types="@types/node" />

import { parseArgs } from 'node:util';
import { changelogFromCommits } from '../src/util/changelog.mjs';
import { showHelp } from '../src/util/cli.mjs';
import { getPackageVersion, writeChangelogFile } from '../src/util/files.mjs';
import {
	commitChangelog,
	createGitTag,
	createRelease,
	getBaseUrl,
	getCommits,
	getFromRef,
	getLastCommitDate,
	pushChanges
} from '../src/util/git.mjs';

// #region Config
const config = /** @type {const} */ ({
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
			message: 'Commit and push changes to remote.'
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
});
// #endregion

// #region Arg validation
const { values: options } = parseArgs({ options: config });

if (options.help) {
	showHelp('changelog', 'Generates a Markdown changelog from Git history.', config);
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
const packageVersion = await getPackageVersion(options['package-json-path']);

if (packageVersion) {
	versionName = packageVersion;
}

const fromRef = getFromRef(versionName, options.from);
const commits = getCommits(fromRef, versionName);
const baseUrl = getBaseUrl();
const changelogDate = getLastCommitDate(versionName);

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
}

if (options.tag) {
	createGitTag(versionName);
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
