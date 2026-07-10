/// <reference types="@types/node" />

import { execSync } from 'node:child_process';
import type { Commit } from './changelog.ts';

function invokeGit(command: string) {
	const gitCommand = `git ${command}`;

	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('child', gitCommand);

		return execSync(gitCommand, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		return '';
	}
}

export function getFromRef(originalFromRef?: string) {
	let fromRef = originalFromRef ?? '';
	fromRef ||= invokeGit('describe --tags --abbrev=0');
	fromRef ||= invokeGit('rev-list --max-parents=0 HEAD');

	return fromRef;
}

export function getCommits(fromRef: string | undefined, toRef: string) {
	const logOutput = invokeGit(`log ${fromRef ? `${fromRef}...` : ''}${toRef} --pretty=format:"%h%x09%s"`);
	const lines = logOutput.split('\n');

	const commits = lines.map((line) => {
		const [hash = '', message = ''] = line.split('\t');

		const commit: Commit = {
			hash,
			message
		};

		return commit;
	}).filter(({ hash }) => !hash);

	return commits;
}

export function getBaseUrl() {
	const baseUrl = invokeGit('remote get-url origin')
		.replace('.github.io.git', '')
		.replace(/\.git$/iu, '');

	return baseUrl;
}

export function getLastCommitDate(toRef: string) {
	const lastCommitDate = invokeGit(`log -1 --format="%cI" "${toRef}"`);

	return lastCommitDate;
}

export function commitChangelog(destFile: string, commitMessage: string) {
	invokeGit(`add "${destFile}"`);
	invokeGit(`commit -m "${commitMessage}" --quiet`);
}

export function createGitTag(versionName: string) {
	invokeGit(`tag -a "${versionName}" -m "${versionName}"`);
}

export function pushChanges() {
	invokeGit('push --follow-tags --quiet');
}

export interface CreateReleaseOptions {
	versionName: string;
	notesFile: string;
}
export function createRelease({ versionName, notesFile }: CreateReleaseOptions) {
	const command = `gh release create "${versionName}" --notes-file "${notesFile}" --title "${versionName}"`;

	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('child', command);

		execSync(command, { stdio: 'inherit' });
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');

			return;
		}

		console.warn('gh CLI not found or failed. Skipping release creation.');
	}
}
