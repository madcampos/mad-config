/// <reference types="@types/node" />

import { execSync } from 'node:child_process';

/**
 * Executes a Git command and returns the trimmed output.
 *
 * @param {string} command - The Git subcommand and arguments to run.
 */
function invokeGit(command) {
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

/**
 * Resolves the starting Git reference for the changelog.
 * Defaults to the latest tag, or the first commit if no tags exist.
 *
 * @param {string} [originalFromRef] - An optional explicit reference to start from.
 */
export function getFromRef(originalFromRef) {
	let fromRef = originalFromRef ?? '';
	fromRef ||= invokeGit('describe --tags --abbrev=0');
	fromRef ||= invokeGit('rev-list --max-parents=0 HEAD');

	return fromRef;
}

/**
 * Retrieves a list of commits between two Git references.
 *
 * @param {string | undefined} fromRef - The starting reference (exclusive).
 * @param {string} toRef - The ending reference (inclusive).
 *
 * @returns {import('./changelog.mjs').Commit[]} An array of commit objects.
 */
export function getCommits(fromRef, toRef) {
	const logOutput = invokeGit(`log ${fromRef ? `${fromRef}...` : ''}${toRef} --pretty=format:"%h%x09%s"`);
	const lines = logOutput.split('\n');

	const commits = lines.map((line) => {
		const [hash = '', message = ''] = line.split('\t');

		const commit = {
			hash,
			message
		};

		return commit;
	}).filter(({ hash }) => hash);

	return commits;
}

/**
 * Retrieves the base URL of the `origin` remote, removing `.git` suffixes.
 */
export function getBaseUrl() {
	const baseUrl = invokeGit('remote get-url origin')
		.replace('.github.io.git', '')
		.replace(/\.git$/iu, '');

	return baseUrl;
}

/**
 * Retrieves the most recent commit date. As an ISO timestamp.
 *
 * @param {string} toRef - The git ref to use.
 */
export function getLastCommitDate(toRef) {
	const lastCommitDate = invokeGit(`log -1 --format="%cI" "${toRef}"`);

	return lastCommitDate;
}
/**
 * Commit the changelog file.
 *
 * @param {string} destFile - The path to the changelog file.
 * @param {string} commitMessage - The commit message to use.
 */
export function commitChangelog(destFile, commitMessage) {
	invokeGit(`add "${destFile}"`);
	invokeGit(`commit -m "${commitMessage}" --quiet`);
}

/**
 * Creates a new annotated git tag.
 *
 * @param {string} versionName - The version for the new tag.
 */
export function createGitTag(versionName) {
	invokeGit(`tag -a "${versionName}" -m "${versionName}"`);
}

/**
 * Push the most recent git changes, including tags.
 */
export function pushChanges() {
	invokeGit('push --follow-tags --quiet');
}

/**
 * Create a new GitHub release using the `gh` command line tool.
 *
 * @param {object} options
 * @param {string} options.versionName - The version name to use for the release.
 * @param {string} options.notesFile - The file path to a markdown file containing the release notes.
 */
export function createRelease({ versionName, notesFile }) {
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

/**
 * Init a git repository.
 */
export function initGit() {
	invokeGit('init');
}
