/**
 * Shared utilities for generating and managing changelogs based on Git history.
 *
 * @module changelog
 */

export {
	changelogFromCommits
} from './util/changelog.mjs';

export {
	getPackageVersion,
	writeChangelogFile
} from './util/files.mjs';

export {
	commitChangelog,
	createGitTag,
	createRelease,
	getBaseUrl,
	getCommits,
	getFromRef,
	getLastCommitDate,
	pushChanges
} from './util/git.mjs';
