/// <reference types="@types/node" />

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/**
 * @typedef {Object} PackageJson
 * @property {string} name
 * @property {string} version
 * @property {string} [description]
 * @property {string} [type]
 * @property {string} [license]
 * @property {Record<string, string>} [scripts]
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [devDependencies]
 * @property {Record<string, string>} [peerDependencies]
 * @property {Record<string, string>} [engines]
 * @property {string | Record<string, string>} [bin]
 * @property {string[]} [files]
 * @property {Record<string, string | Record<string, string>>} [exports]
 */

/**
 * Reads the `package.json` file and return it's contents.
 *
 * @param {string} [packagePath] - The absolute or relative path to the package.json file.
 */
export async function readPackageJson(packagePath = 'package.json') {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.read', packagePath);

		if (!packagePath || !existsSync(packagePath)) {
			return /** @type {Partial<PackageJson>} */ ({});
		}

		/** @type {PackageJson} */
		const packageJson = JSON.parse(await readFile(packagePath, 'utf-8'));

		return packageJson;
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read package.json file is required.');
			return /** @type {Partial<PackageJson>} */ ({});
		}

		throw err;
	}
}

/**
 * Merges the content from the existing `package.json` with the new content provided.
 *
 * @param {Partial<PackageJson>} newContent
 * @param {string} [packagePath] - The absolute or relative path to the package.json file.
 */
export async function updatePackageJson(newContent, packagePath = 'package.json') {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.read', packagePath);

		if (!packagePath || !existsSync(packagePath)) {
			throw new Error('Unable to read package.json file.');
		}

		/** @type {PackageJson} */
		const packageJson = JSON.parse(await readFile(packagePath, 'utf-8'));

		/** @type {PackageJson} */
		const updatedContent = {
			...packageJson,
			...newContent
		};

		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', packagePath);

		await writeFile(packagePath, `${JSON.stringify(updatedContent, null, '\t')}\n`, 'utf-8');
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read package.json file is required.');
		}

		throw err;
	}
}

/**
 * Reads the "version" field from a package.json file and returns it prefixed with 'v'.
 *
 * @param {string} [packagePath] - The absolute or relative path to the package.json file.
 */
export async function getPackageVersion(packagePath = 'package.json') {
	const packageJson = await readPackageJson(packagePath);

	if (!packageJson.version) {
		return 'v0.0.0';
	}

	const version = `v${packageJson.version}`;

	return version;
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

/**
 * Reads a template file from the templates directory.
 *
 * @param {string} fileName
 */
export async function readTemplateFile(fileName) {
	try {
		const templatesDir = resolve(import.meta.dirname, '../templates/');
		const sourcePath = join(templatesDir, fileName);

		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.read', sourcePath);

		const contents = await readFile(sourcePath, { encoding: 'utf-8' });

		return contents;
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read and write to output directory is required.');
		}

		throw err;
	}
}

/**
 * Copies a template file to a destination path, optionally replacing placeholders with data.
 *
 * @param {string} fileName
 * @param {string} destPath
 * @param {Record<string, string>} [data]
 */
export async function copyTemplateFile(fileName, destPath, data = {}) {
	try {
		let contents = await readTemplateFile(fileName);

		Object.entries(data).forEach(([key, value]) => {
			contents = contents.replaceAll(`{{${key}}}`, value);
		});

		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', destPath);

		const dir = dirname(destPath);
		await mkdir(dir, { recursive: true });

		await writeFile(destPath, contents, { encoding: 'utf-8' });
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read and write to output directory is required.');
			return;
		}

		throw err;
	}
}

/**
 * Writes text content to a file, creating the directory if it doesn't exist.
 *
 * @param {string} destPath
 * @param {string} contents
 */
export async function writeTextFile(destPath, contents) {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', destPath);

		const dir = dirname(destPath);
		await mkdir(dir, { recursive: true });

		await writeFile(destPath, contents, { encoding: 'utf-8' });
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read and write to output directory is required.');
			return;
		}

		throw err;
	}
}

/**
 * Creates a directory recursively.
 *
 * @param {string} destPath
 */
export async function createDir(destPath) {
	try {
		// oxlint-disable-next-line typescript/no-unnecessary-condition
		process.permission?.has('fs.write', destPath);

		await mkdir(destPath, { recursive: true });
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to read and write to output directory is required.');
			return;
		}

		throw err;
	}
}
