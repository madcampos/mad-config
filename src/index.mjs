/**
 * Shared utilities for managining template file, initializing a repository, and creating changelogs.
 *
 * @module main
 */

export {
	changelogFromCommits
} from './util/changelog.mjs';

export {
	copyTemplateFile,
	createDir,
	getPackageVersion,
	readPackageJson,
	readTemplateFile,
	updatePackageJson,
	writeChangelogFile,
	writeTextFile
} from './util/files.mjs';

export {
	commitChangelog,
	createGitTag,
	createRelease,
	getBaseUrl,
	getCommits,
	getFromRef,
	getLastCommitDate,
	initGit,
	pushChanges
} from './util/git.mjs';

export {
	execDependency,
	initRepo,
	installDependencies
} from './util/dependencies.mjs';
