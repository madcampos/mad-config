/// <reference types="@types/node" />

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Reads the "version" field from a package.json file and returns it prefixed with 'v'.
 *
 * @param {string} packagePath - The absolute or relative path to the package.json file.
 */
export async function getPackageVersion(packagePath) {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.read', packagePath);

		if (!packagePath || !existsSync(packagePath)) {
			return undefined;
		}

		const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));
		return `v${pkg.version}`;
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read package.json file is required.');
			return undefined;
		}

		throw err;
	}
}

/**
 * Writes the generated changelog content to a Markdown file in the specified directory.
 *
 * @param {string} outputDir - The directory where the changelog file should be saved.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} changelog - The Markdown content of the changelog.
 */
export async function writeChangelogFile(outputDir, fileName, changelog) {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.read', outputDir);
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', outputDir);

		if (!existsSync(outputDir)) {
			await mkdir(outputDir, { recursive: true });
		}
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read and write to output directory is required.');
			return;
		}

		throw err;
	}

	try {
		const destFile = join(outputDir, `${fileName}.md`);

		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', destFile);

		await writeFile(destFile, changelog, 'utf-8');

		return destFile;
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read changelog file is required.');
			return;
		}

		throw err;
	}
}
