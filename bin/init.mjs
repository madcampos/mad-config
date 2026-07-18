#!/usr/bin/env node
// oxlint-disable no-console

/// <reference types="@types/node" />

import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { styleText } from 'node:util';
import { execDependency, initRepo, installDependencies } from '../src/util/dependencies.mjs';
import { copyTemplateFile, readPackageJson, updatePackageJson, writeTextFile } from '../src/util/files.mjs';
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
	console.log(styleText('cyan', 'Initializing project'));

	console.log(styleText('cyan', 'git Initializing git'));
	initGit();

	console.log(styleText('cyan', 'Running npm init'));
	initRepo();

	console.log(styleText('cyan', 'Adding pnpm-workspace.yaml'));
	await copyTemplateFile('pnpm-workspace.yaml', './pnpm-workspace.yaml');

	const packageJson = await readPackageJson();

	console.log(styleText('cyan', 'Installing dependencies'));
	installDependencies(true, 'dprint', 'typescript', 'oxlint', '@mad-c/config');

	console.log(styleText('cyan', 'Updating package.json scripts'));
	packageJson.scripts = {
		'typecheck': 'tsc --noEmit',
		'lint:js': 'oxlint --fix',
		'lint': 'npm run typecheck && npm run lint:js',
		'format': 'dprint fmt',
		'version': 'npm version --sign-git-tag --message "chore: update package version"',
		'postversion': 'changelog --output "docs/changelog" --push --create-release'
	};
	await updatePackageJson({ scripts: packageJson.scripts });

	console.log(styleText('cyan', 'Creating src folder'));
	await writeTextFile('src/index.ts', '// TODO: entry point');

	console.log(styleText('cyan', 'Adding .gitignore'));
	await copyTemplateFile('.gitignore', '.gitignore');

	console.log(styleText('cyan', 'Adding README.md'));
	await writeTextFile('./README.md', `# ${packageJson.name ?? ''}\n`);

	console.log(styleText('cyan', 'Adding dependabot config'));
	await copyTemplateFile('dependabot.yml', '.github/dependabot.yml');

	console.log(styleText('cyan', 'Adding oxlint config'));
	await copyTemplateFile('.oxlintrc.json', '.oxlintrc.json');

	console.log(styleText('cyan', 'Adding dprint config'));
	await copyTemplateFile('dprint.json', 'dprint.json');

	console.log(styleText('cyan', 'Adding typescript config'));
	await copyTemplateFile('tsconfig.json', 'tsconfig.json');

	const license = await prompt('What license would you like to add? [mit/lgpl/other]');
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

	if (await confirm('Do you want to add certificates?')) {
		console.log(styleText('cyan', 'Adding mkcert script'));

		console.log(styleText('cyan', 'Updating package.json scripts'));
		packageJson.scripts = {
			...packageJson.scripts,
			certs: 'mkcert -install && mkcert -key-file=certs/server.key -cert-file=certs/server.crt localhost'
		};
		await updatePackageJson({ scripts: packageJson.scripts });

		console.log(styleText('cyan', 'Adding certs folder'));
		await writeTextFile('certs/.gitkeep', '');
	}

	if (await confirm('Do you want to add env vars?')) {
		console.log(styleText('cyan', 'Installing varlock'));
		installDependencies(true, 'varlock');

		console.log(styleText('cyan', 'Copying env schema'));
		await copyTemplateFile('.env.schema', '.env.schema');
	}

	if (await confirm('Do you want to add wrangler?')) {
		console.log(styleText('cyan', 'Installing dependencies'));
		installDependencies(true, 'wrangler');

		console.log(styleText('cyan', 'Initializing wrangler.json'));
		const workerName = packageJson.name ?? await prompt('What is the worker name?');
		const workerDomain = await prompt('What is the domain name?');
		await copyTemplateFile('wrangler.json', 'wrangler.json', {
			name: workerName,
			domain: workerDomain
		});

		console.log(styleText('cyan', 'Creating server dir'));
		await writeTextFile('server/index.ts', '// TODO: server entry point');

		console.log(styleText('cyan', 'Updating package.json scripts'));
		packageJson.scripts = {
			...packageJson.scripts,
			types: 'wrangler types server/env.d.ts',
			deploy: 'wrangler deploy --minify --env=""'
		};
		await updatePackageJson({ scripts: packageJson.scripts });

		console.log(styleText('cyan', 'Create public dir'));
		await writeTextFile('./public/.gitkeep', '');
	}

	if (await confirm('Do you want to add vite?')) {
		console.log(styleText('cyan', 'Installing dependencies'));
		installDependencies(true, 'vite', '@types/node');
		// oxlint-disable-next-line no-magic-numbers
		const port = Math.min(9999, Math.max(Math.trunc(Math.random() * 10000), 1000)).toString(10);
		await copyTemplateFile('vite.config.template', './vite.config.ts', { port });

		console.log(styleText('cyan', 'Create public dir'));
		await writeTextFile('./public/.gitkeep', '');

		console.log(styleText('cyan', 'Updating package.json scripts'));
		packageJson.scripts = {
			...packageJson.scripts,
			start: 'vite',
			prepreview: 'pnpm run build',
			preview: 'vite preview',
			build: 'vite build'
		};
		await updatePackageJson({ scripts: packageJson.scripts });

		if (await confirm('Do you want to add vitest?')) {
			console.log(styleText('cyan', 'Installing dependencies'));
			installDependencies(true, 'vitest', '@vitest/coverage-v8', '@vitest/browser-playwright');
			await copyTemplateFile('vitest.config.template', './vitest.config.ts');

			console.log(styleText('cyan', 'Updating package.json scripts'));
			packageJson.scripts = {
				...packageJson.scripts,
				browsers: 'playwright install chromium',
				test: 'vitest'
			};
			await updatePackageJson({ scripts: packageJson.scripts });
			execDependency('playwright', 'install', 'chromium');
		}
	}

	console.log(styleText('cyan', 'Initialization complete!'));
} catch (error) {
	console.error('Error during initialization:', error);
} finally {
	readLine.close();
}
