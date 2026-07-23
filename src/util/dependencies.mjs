// oxlint-disable typescript/no-unnecessary-condition

import { execSync } from 'node:child_process';

/**
 * Installs dependencies using `pnpm`.
 *
 * @param {boolean} [isDev=false]
 * @param {...string} dependencies
 */
export function installDependencies(isDev = false, ...dependencies) {
	const installCommand = `pnpm install${isDev ? ' --save-dev' : ''} ${dependencies.join(' ')}`;

	try {
		process.permission?.has('child', installCommand);

		return execSync(installCommand, { encoding: 'utf-8', stdio: ['ignore', 'ignore', 'pipe'] });
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
	const installCommand = `pnpm init -y`;

	try {
		process.permission?.has('child', installCommand);

		return execSync(installCommand, { encoding: 'utf-8', stdio: ['ignore', 'ignore', 'pipe'] });
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
	const command = `pnpm dlx ${dependency}${params.length ? ` ${params.join(' ')}` : ''}`;

	try {
		process.permission?.has('child', command);

		return execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
	} catch (err) {
		if (err?.code === 'ERR_ACCESS_DENIED') {
			console.error('Permission to spawn child processes is required.');
		}

		throw err;
	}
}
