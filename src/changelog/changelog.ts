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

export interface Commit {
	hash: string;
	message: string;
}

export interface ChangelogFromCommitsOptions {
	commits: Commit[];
	date: string;
	versionName: string;
	baseUrl: string;
	fromRef: string;
	toRef: string;
	sectionHeaders?: Record<string, string>;
	miscSectionHeader?: string;
	breakingSectionHeader?: string;
}

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
}: ChangelogFromCommitsOptions) {
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
