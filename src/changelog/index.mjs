/**
 * Shared utilities for generating and managing changelogs based on Git history.
 *
 * @module changelog
 */

export {
	changelogFromCommits
} from './changelog.mjs';

export {
	getPackageVersion,
	writeChangelogFile
} from './files.mjs';

export {
	commitChangelog,
	createGitTag,
	createRelease,
	getBaseUrl,
	getCommits,
	getFromRef,
	getLastCommitDate,
	pushChanges
} from './git.mjs';
