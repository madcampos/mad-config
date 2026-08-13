/**
 * Represents a simplified Git commit.
 *
 * @typedef {object} Commit
 * @property {string} hash - The short or long commit hash.
 * @property {string} message - The full commit message.
 */

const MAX_MESSAGE_LENGTH = 1024;

const defaultSectionHeaders = {
	breaking: 'Breaking Changes',
	revert: 'Changes Rollback',
	feat: 'Enhancements',
	fix: 'Fixes',
	perf: 'Performance Improvements',
	refactor: 'Refactors',
	test: 'Tests',
	docs: 'Documentation Updates',
	examples: 'Examples',
	build: 'Builds',
	chore: 'Chores & Tasks',
	ci: 'CI',
	misc: 'Miscellaneous',
	style: 'Stylistic Changes',
	types: 'Type Changes'
};

/**
 * @param {string} text
 */
function normalizeHtml(text) {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

/**
 * @param {object} options
 * @param {Commit[]} options.commits - The list of commits to include in the changelog.
 * @param {Record<string, string>} options.sectionHeaders - Custom headers for commit types.
 * @param {string} options.miscSectionHeader - The group name for miscellaneous commits.
 * @param {string} options.breakingSectionHeader - The group name for breaking changes.
 */
function parseCommitMessages({ commits, sectionHeaders, miscSectionHeader, breakingSectionHeader }) {
	const sectionHeadersKeys = Object.keys(sectionHeaders);
	const commitMessages = commits
		.filter(({ hash }) => hash)
		.map(({ hash, message }) => {
			const messageFirstLine = (message.split('\n')[0] ?? '').substring(0, MAX_MESSAGE_LENGTH);

			const commitRegex = /^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breaking>!)?: (?<desc>.*)$/iu;
			const match = commitRegex.exec(messageFirstLine);

			let group = miscSectionHeader;
			let logMessage = messageFirstLine;

			if (match?.groups) {
				const { type = miscSectionHeader, scope = '', breaking = '', desc = '' } = match.groups ?? {};

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

	return sortedGroups;
}

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
	const parsedCommits = parseCommitMessages({
		commits,
		sectionHeaders,
		miscSectionHeader,
		breakingSectionHeader
	});

	let changelog = `---
date: ${date}
versionName: ${versionName}
---

[compare changes](${baseUrl}/compare/${fromRef}...${toRef})\n`;

	for (const [group, items = []] of parsedCommits) {
		changelog += `\n### ${sectionHeaders[group] ?? ''}\n\n`;

		for (const item of items) {
			changelog += `- ${item.message} ([${item.hash}](${baseUrl}/commit/${item.hash}))\n`;
		}
	}

	return changelog;
}

/**
 * Generates an RSS `<item>` containing the changelog string from a list of commits.
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
export function rssChangelogFromCommits({
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
	const parsedCommits = parseCommitMessages({
		commits,
		sectionHeaders,
		miscSectionHeader,
		breakingSectionHeader
	});

	let sections = '';

	for (const [group, items = []] of parsedCommits) {
		sections += `\n\t\t<h2>${normalizeHtml(sectionHeaders[group] ?? '')}</h2>\n\n\t\t<ul>\n`;

		for (const item of items) {
			sections += `\t\t\t<li>${normalizeHtml(item.message)} (<a href="${baseUrl}/commit/${item.hash}">${item.hash}</a>)</li>\n`;
		}

		sections += '\t\t</ul>\n';
	}

	const changelog = /* xml */ `<item>
	<title>${normalizeHtml(versionName)}</title>
	<pubDate>${date}</pubDate>
	<description><![CDATA[
		<a href="${baseUrl}/compare/${fromRef}...${toRef}">compare changes</a>

		${sections}
	]]></description>
</item>
`;

	return changelog;
}
