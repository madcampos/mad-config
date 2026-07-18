import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const readLine = createInterface({ input: stdin, output: stdout });

/**
 * Prompts the user with a yes/no question.
 *
 * @param {string} question
 * @param {boolean} [force]
 */
export async function confirm(question, force = false) {
	if (force) {
		return true;
	}

	const answer = await readLine.question(`${question} (y/N): `);

	return answer.toLowerCase() === 'y';
}

/**
 * Prompts the user for a text input.
 *
 * @param {string} question
 * @param {boolean} [force]
 */
export async function prompt(question, force) {
	if (force) {
		return '';
	}

	const answer = await readLine.question(`${question} `);

	return answer;
}

export function cleanup() {
	readLine.close();
}
