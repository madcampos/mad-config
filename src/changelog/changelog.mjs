const defaultSectionHeaders = {
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
};

/**
 * Represents a simplified Git commit.
 *
 * @typedef {object} Commit
 * @property {string} hash - The short or long commit hash.
 * @property {string} message - The full commit message.
 */

/**
 * Generates a Markdown changelog string from a list of commits.
 *
 * @param {object} options
 * @param {Commit[]} options.commits - The list of commits to include in the changelog.
 * @param {string} options.date - The date string to display in the changelog frontmatter.
 * @param {string} options.versionName - The name of the version being released.
 * @param {string} options.baseUrl - The base repository URL for links.
 * @param {string} options.fromRef - The starting reference (tag or hash).
 * @param {string} options.toRef - The ending reference (tag or hash).
 * @param {Record<string, string>} [options.sectionHeaders] - Custom headers for commit types.
 * @param {string} [options.miscSectionHeader] - The group name for miscellaneous commits.
 * @param {string} [options.breakingSectionHeader] - The group name for breaking changes.
 */
export function changelogFromCommits({
	commits,
	date,
	versionName,
	baseUrl,
	fromRef,
	toRef,
	sectionHeaders = defaultSectionHeaders,
	miscSectionHeader = 'misc',
	breakingSectionHeader = 'breaking'
}) {
	const sectionHeadersKeys = Object.keys(sectionHeaders);

	const commitMessages = commits
		.filter(({ hash }) => hash)
		.map(({ hash, message }) => {
			const commitRegex = /^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breaking>!)?: (?<desc>.*)$/iu;
			const match = commitRegex.exec(message);

			let group = miscSectionHeader;
			let logMessage = message;

			if (match?.groups) {
				const { type = miscSectionHeader, scope = '', breaking = '', desc = '' } = match.groups;

				logMessage = desc;
				if (scope) {
					logMessage = `**${scope}**: ${desc}`;
				}

				if (breaking) {
					group = breakingSectionHeader;
				} else if (sectionHeadersKeys.includes(type)) {
					group = type;
				}
			}

			return { hash, group, message: logMessage };
		});

	const groupedCommits = Object.groupBy(commitMessages, ({ group }) => group);
	const sortedGroups = Object.entries(groupedCommits).sort(([keyA], [keyB]) => sectionHeadersKeys.indexOf(keyA) - sectionHeadersKeys.indexOf(keyB));

	let changelog = `---
date: ${date}
versionName: ${versionName}
---

[compare changes](${baseUrl}/compare/${fromRef}...${toRef})`;

	for (const [group, items = []] of sortedGroups) {
		changelog += `\n\n${sectionHeaders[group]}\n\n`;

		for (const item of items) {
			changelog += `- ${item.message} ([${item.hash}](${baseUrl}/commit/${item.hash}))\n`;
		}
	}

	return changelog;
}
