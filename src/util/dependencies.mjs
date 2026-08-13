// oxlint-disable typescript/no-unnecessary-condition

import { spawnSync } from 'node:child_process';

/**
 * Installs dependencies using `pnpm`.
 *
 * @param {boolean} [isDev=false]
 * @param {...string} dependencies
 */
export function installDependencies(isDev = false, ...dependencies) {
	try {
		process.permission?.has('child', 'pnpm');

		const spawnResult = spawnSync('pnpm', [
			'install',
			isDev ? ' --save-dev' : '',
			...dependencies.filter(Boolean)
		], {
			shell: false,
			encoding: 'utf-8',
			stdio: ['ignore', 'ignore', 'pipe']
		});

		if (spawnResult.error) {
			throw spawnResult.error;
		}

		if (spawnResult.stderr) {
			throw new Error(spawnResult.stderr);
		}
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		throw err;
	}
}

/**
 * Init a repository using `pnpm`.
 */
export function initRepo() {
	try {
		process.permission?.has('child', 'pnpm');

		const spawnResult = spawnSync('pnpm', ['init', '-y'], {
			shell: false,
			encoding: 'utf-8',
			stdio: ['ignore', 'ignore', 'pipe']
		});

		if (spawnResult.error) {
			throw spawnResult.error;
		}

		if (spawnResult.stderr) {
			throw new Error(spawnResult.stderr);
		}
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		throw err;
	}
}

/**
 * Updates dependencies using `pnpm`.
 */
export function updateDependencies() {
	try {
		process.permission?.has('child', 'pnpm');

		const spawnResult = spawnSync('pnpm', ['update'], {
			shell: false,
			encoding: 'utf-8',
			stdio: ['ignore', 'ignore', 'pipe']
		});

		if (spawnResult.error) {
			throw spawnResult.error;
		}

		if (spawnResult.stderr) {
			throw new Error(spawnResult.stderr);
		}
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		throw err;
	}
}

/**
 * Execute a dependency using `pnpm exec`.
 *
 * @param {string} dependency
 * @param {...string} params
 */
export function execDependency(dependency, ...params) {
	try {
		process.permission?.has('child', 'pnpm');

		const spawnResult = spawnSync('pnpm', [
			'dlx',
			dependency,
			...params
		], {
			shell: false,
			encoding: 'utf-8',
			stdio: 'inherit'
		});

		if (spawnResult.error) {
			throw spawnResult.error;
		}

		if (spawnResult.stderr) {
			throw new Error(spawnResult.stderr);
		}

		return spawnResult.stdout.replaceAll(/^['"]|['"]$/ugm, '').trim();
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		throw err;
	}
}
