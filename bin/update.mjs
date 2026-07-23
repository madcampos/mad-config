#!/usr/bin/env node
// oxlint-disable no-console

/// <reference types="@types/node" />

import { parseArgs, styleText } from 'node:util';
import { cleanup, prompt, showHelp } from '../src/util/cli.mjs';
import { updateDependencies } from '../src/util/dependencies.mjs';
import { copyTemplateFile, readPackageJson, updatePackageJson } from '../src/util/files.mjs';

// #region Config
/**
 * Documentation metadata for a configuration option.
 *
 * @typedef {object} ConfigHelp
 * @property {string} message - A description of what the option does.
 * @property {string} [default] - A human-readable default value description.
 * @property {string} [value] - The placeholder for the expected value type to display on help messages.
 */

/**
 * A configuration option descriptor extending the standard Node.js parseArgs options.
 *
 * @typedef {import('node:util').ParseArgsOptionDescriptor & { help: ConfigHelp, required?: boolean }} Config
 */

const config = /** @type {const} */ ({
	yes: {
		type: 'boolean',
		short: 'y',
		default: false,
		help: {
			message: 'Skip confirmation prompts.'
		}
	},
	help: {
		type: 'boolean',
		short: 'h',
		default: false,
		help: {
			message: 'Display this help message.'
		}
	}
});
// #endregion

// #region Arg validation
const { values: options } = parseArgs({ options: config });

if (options.help) {
	showHelp('update', 'Update configuration and packages for this repository.', config);
}
// #endregion

try {
	// #region Update
	console.log(styleText('cyan', 'Updating project'));

	const packageJson = await readPackageJson();

	console.log(styleText('cyan', 'Updating package.json engines'));
	await updatePackageJson({
		engines: {
			node: '>=26.4.0',
			pnpm: '>=11.11.0'
		}
	});

	if (packageJson.type !== 'module') {
		console.log(styleText('cyan', 'Adding type module to package.json'));
		await updatePackageJson({ type: 'module' });
	}

	if (!packageJson.license) {
		const license = await prompt('What license would you like to add? [mit/lgpl/other]', options.yes);
		switch (license) {
			case 'mit':
				console.log(styleText('cyan', 'Saving licence file'));
				await copyTemplateFile('licenses/mit.txt', './LICENSE.md');
				await updatePackageJson({ license: 'MIT' });
				break;
			case 'lgpl':
				console.log(styleText('cyan', 'Saving licence file'));
				await copyTemplateFile('licenses/lgpl.txt', './LICENSE.md');
				await updatePackageJson({ license: 'LGPL-3' });
				break;
			default:
		}
	}

	console.log(styleText('cyan', 'Updating dependencies'));
	updateDependencies();

	// #endregion

	console.log(styleText('green', 'Update complete!'));
} catch (error) {
	console.error(styleText('red', 'Update failed:'), error);
} finally {
	cleanup();
}
