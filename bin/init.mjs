#!/usr/bin/env node
// oxlint-disable no-console

/// <reference types="@types/node" />

import { dirname } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { styleText } from 'node:util';
import { execDependency, initRepo, installDependencies } from '../src/util/dependencies.mjs';
import { copyTemplateFile, createDir, readPackageJson, readTemplateFile, updatePackageJson, writeTextFile } from '../src/util/files.mjs';
import { initGit } from '../src/util/git.mjs';

const readLine = createInterface({ input: stdin, output: stdout });

/**
 * @param {string} question
 */
async function confirm(question) {
	const answer = await readLine.question(`${question} (y/N): `);

	return answer.toLowerCase() === 'y';
}

/**
 * @param {string} question
 */
async function prompt(question) {
	const answer = await readLine.question(`${question} `);

	return answer;
}

try {
	console.log(styleText('blue', 'Initializing project'));

	console.log(styleText('cyan', 'git Initializing git'));
	initGit();

	console.log(styleText('cyan', 'Running npm init'));
	initRepo();

	console.log(styleText('cyan', 'Adding pnpm-workspace.yaml'));
	await copyTemplateFile('pnpm-workspace.yaml', './pnpm-worskpace.yaml');

	const packageJson = await readPackageJson();

	console.log(styleText('cyan', 'Installing dependencies'));
	installDependencies(true, 'dprint', 'typescript', 'oxlint', '@mad-c/config');

	console.log(styleText('cyan', 'Updating package.json scripts'));
	await updatePackageJson({
		scripts: {
			'typecheck': 'tsc --noEmit',
			'lint:js': 'oxlint --fix',
			'lint': 'npm run typecheck && npm run lint:js',
			'format': 'dprint fmt',
			'version': 'npm version --sign-git-tag --message "chore: update package version"',
			'postversion': 'changelog --output "docs/changelog" --push --create-release'
		}
	});

	console.log(styleText('cyan', 'Creating src folder'));
	await createDir('./src/');

	console.log(styleText('cyan', 'Adding .gitignore'));
	await copyTemplateFile('.gitignore', './.gitignore');

	console.log(styleText('cyan', 'Adding README.md'));
	await writeTextFile('./README.md', `# ${packageJson.name ?? ''}\n`);

	console.log(styleText('cyan', 'Adding dependabot config'));
	await copyTemplateFile('dependabot.yml', './.github/dependabot.yml');

	const license = await prompt('What license would you like to add? [mit/lgpl/other]');
	switch (license) {
		case 'mit':
			console.log(styleText('green', 'Saving licence file'));
			await copyTemplateFile('licenses/mit.txt', './LICENSE.md');
			await updatePackageJson({ license: 'MIT' });
			break;
		case 'lgpl':
			console.log(styleText('green', 'Saving licence file'));
			await copyTemplateFile('licenses/lgpl.txt', './LICENSE.md');
			await updatePackageJson({ license: 'LGPL-3' });
			break;
		default:
	}

	if (await confirm('Do you want to add certificates?')) {
		console.log(styleText('green', 'Adding mkcert script'));

		console.log(styleText('green', 'Updating package.json scripts'));
		await updatePackageJson({
			scripts: {
				...packageJson.scripts,
				certs: 'mkcert -install && mkcert -key-file=certs/server.key -cert-file=certs/server.crt localhost'
			}
		});

		console.log(styleText('green', 'Adding certs folder'));
		await writeTextFile('./certs/.gikeep', '');
	}

	if (await confirm('Do you want to add env vars?')) {
		console.log(styleText('green', 'Installing varlock'));
		installDependencies(true, 'varlock');

		console.log(styleText('green', 'Initializing varlock'));
		execDependency('varlock', 'init');
	}

	if (await confirm('Do you want to add wrangler?')) {
		console.log(styleText('green', 'Installing dependencies'));
		installDependencies(true, 'wrangler');

		console.log(styleText('green', 'Initializing wrangler.json'));
		const wranglerJson = JSON.parse(await readTemplateFile('wrangler.json'));

		wranglerJson.name = packageJson.name ?? await prompt('What is the worker name?');
		wranglerJson.main = await prompt('What is the server entry point?');
		wranglerJson.route.pattern = await prompt('What is the domain name?');

		await writeTextFile('./wrangler.json', JSON.stringify(wranglerJson));

		console.log(styleText('green', 'Creating server dir'));
		const serverDir = dirname(wranglerJson.main);
		await createDir(serverDir);

		console.log(styleText('green', 'Updating package.json scripts'));
		await updatePackageJson({
			scripts: {
				...packageJson.scripts,
				types: `wrangler types ${serverDir}/env.d.ts`,
				deploy: 'wrangler deploy --minify --env=""'
			}
		});

		console.log(styleText('green', 'Create public dir'));
		await writeTextFile('./public/.gikeep', '');
	}

	if (await confirm('Do you want to add vite?')) {
		console.log(styleText('cyan', 'Installing dependencies'));
		installDependencies(true, 'vite');
		await copyTemplateFile('vite.config.template', './vite.config.ts');

		console.log(styleText('green', 'Create public dir'));
		await writeTextFile('./public/.gikeep', '');

		console.log(styleText('green', 'Updating package.json scripts'));
		await updatePackageJson({
			scripts: {
				...packageJson.scripts,
				start: 'vite',
				prepreview: 'pnpm run build',
				preview: 'vite preview',
				build: 'vite build'
			}
		});

		if (await confirm('Do you want to add vitest?')) {
			console.log(styleText('green', 'Installing dependencies'));
			installDependencies(true, 'vitest', '@vitest/coverage-v8', '@vitest/browser-playwright');
			await copyTemplateFile('vitest.config.template', './vitest.config.ts');

			console.log(styleText('green', 'Updating package.json scripts'));
			await updatePackageJson({
				scripts: {
					...packageJson.scripts,
					// TODO: review browsers and config
					browsers: 'playwright install chromium',
					test: 'vitest'
				}
			});
			execDependency('playwright', 'install', 'chromium');
		}
	}

	console.log(styleText('blue', 'Initialization complete!'));
} catch (error) {
	console.error('Error during initialization:', error);
} finally {
	readLine.close();
}
