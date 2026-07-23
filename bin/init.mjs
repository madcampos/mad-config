#!/usr/bin/env node
// oxlint-disable no-console

/// <reference types="@types/node" />

import { parseArgs, styleText } from 'node:util';
import { cleanup, confirm, prompt, showHelp } from '../src/util/cli.mjs';
import { execDependency, initRepo, installDependencies } from '../src/util/dependencies.mjs';
import { copyTemplateFile, readPackageJson, updatePackageJson, writeTextFile } from '../src/util/files.mjs';
import { initGit } from '../src/util/git.mjs';

// #region Config
const config = /** @type {const} */ ({
	yes: {
		type: 'boolean',
		short: 'y',
		default: false,
		help: {
			message: 'Skip confirmation prompts'
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

// #region Arg Validation
const { values: options } = parseArgs({ options: config });

if (options.help) {
	showHelp('init', 'Init a repository with default configuration.', config);
}
// #endregion

try {
	// #region Init
	console.log(styleText('cyan', 'Initializing project'));

	console.log(styleText('cyan', 'git Initializing git'));
	initGit();

	console.log(styleText('cyan', 'Running npm init'));
	initRepo();
	// #endregion

	// #region Dependencies
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
	// #endregion

	// #region Files
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
	// #endregion

	// #region Certificates
	if (await confirm('Do you want to add certificates?', options.yes)) {
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
	// #endregion

	// #region Env vars
	if (await confirm('Do you want to add env vars?', options.yes)) {
		console.log(styleText('cyan', 'Installing varlock'));
		installDependencies(true, 'varlock');

		console.log(styleText('cyan', 'Copying env schema'));
		await copyTemplateFile('.env.schema', '.env.schema');
	}
	// #endregion

	// #region Wrangler
	if (await confirm('Do you want to add wrangler?', options.yes)) {
		console.log(styleText('cyan', 'Installing dependencies'));
		installDependencies(true, 'wrangler');

		console.log(styleText('cyan', 'Initializing wrangler.json'));
		const workerName = packageJson.name ?? await prompt('What is the worker name?', options.yes);
		const workerDomain = await prompt('What is the domain name?', options.yes);
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
	// #endregion

	// #region Vite/Vitest
	if (await confirm('Do you want to add vite?', options.yes)) {
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

		if (await confirm('Do you want to add vitest?', options.yes)) {
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
	// #endregion

	console.log(styleText('cyan', 'Initialization complete!'));
} catch (error) {
	console.error('Error during initialization:', error);
} finally {
	cleanup();
}
