#!/usr/bin/env node
// oxlint-disable no-console

/// <reference types="@types/node" />

import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const readLine = createInterface({ input: stdin, output: stdout });

/**
 * @param {string} question
 */
async function ask(question) {
	const answer = await readLine.question(`${question} (y/N): `);

	return answer.toLowerCase() === 'y';
}

try {
	console.log('Initializing project');

	console.log('Running npm init');
	execSync('npm init -y', { stdio: 'inherit' });

	console.log('git Initializing git');
	execSync('git init', { stdio: 'inherit' });

	console.log('Adding pnpm-workspace.yaml');
	const pnpmWorkspace = await readFile('../src/templates/pnpm-workspace.yaml', { encoding: 'utf-8' });
	await writeFile('pnpm-workspace.yaml', pnpmWorkspace);

	console.log('Adding .gitignore');
	const gitignore = await readFile('../src/templates/.gitignore', { encoding: 'utf-8' });
	await writeFile('.gitignore', gitignore);

	console.log('Adding README.md');
	// TODO: add project name
	await writeFile('README.md', '');

	console.log('Installing dependencies');
	execSync('pnpm install -D dprint typescript oxlint @mad-c/config', { stdio: 'inherit' });

	// TODO: extract as functions to update scripts
	console.log('Updating package.json scripts');
	const packageJsonContent = await readFile('package.json', 'utf8');
	const packageJson = JSON.parse(packageJsonContent);

	packageJson.scripts = {
		...packageJson.scripts,
		'typecheck': 'tsc --noEmit',
		'lint:js': 'oxlint --fix',
		'lint': 'npm run typecheck && npm run lint:js',
		'format': 'dprint fmt',
		'version': 'npm version --sign-git-tag --message "chore: update package version"',
		'postversion': 'changelog --output "docs/changelog" --push --create-release'
	};

	// TODO: create src folder

	await writeFile('package.json', JSON.stringify(packageJson, null, '\t'));

	if (await ask('Do you want to add certificates?')) {
		console.log('Installing mkcert');
		// TODO: check if it is on npm?
		execSync('pnpm install -D mkcert', { stdio: 'inherit' });

		const updatedPackageJsonContent = await readFile('package.json', 'utf8');

		// TODO: add certs folder and .gitkeep file there

		const updatedPackageJson = JSON.parse(updatedPackageJsonContent);
		updatedPackageJson.scripts.certs = 'mkcert -install && mkcert localhost';

		await writeFile('package.json', JSON.stringify(updatedPackageJson, null, '\t'));
	}

	if (await ask('Do you want to add env vars?')) {
		console.log('Installing varlock');
		execSync('pnpm install -D varlock', { stdio: 'inherit' });
		console.log('Initializing varlock');
		execSync('pnpm exec varlock init', { stdio: 'inherit' });
	}

	// TODO: ask/add template for wrangler + package

	// TODO: add licence
	// TODO: ask/add vite + vitest

	console.log('Initialization complete!');
} catch (error) {
	console.error('Error during initialization:', error);
} finally {
	readLine.close();
}
