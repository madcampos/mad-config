import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { stripVTControlCharacters, styleText } from 'node:util';

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

const readLine = createInterface({ input: stdin, output: stdout });

/**
 * Prompts the user with a yes/no question.
 *
 * @param {string} question
 * @param {boolean} [force]
 */
// oxlint-disable-next-line no-shadow
export async function confirm(question, force = false) {
	if (force) {
		return true;
	}

	const answer = await readLine.question(`${question} (y/N): `);

	return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
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

/**
 * Cleanup for readline, must be called in the end.
 */
export function cleanup() {
	readLine.close();
}

/**
 * @param {string} command
 * @param {string} description
 * @param {Readonly<Record<string, Config>>} options
 */
export function showHelp(command, description, options) {
	// oxlint-disable no-console
	console.log(`${description}\n`);

	console.log(styleText('bold', 'Usage:'));
	console.log(`  $ ${command} [options]\n`);

	console.log(styleText('bold', 'Options:'));

	const optionsEntries = Object.entries(options);
	const optionsHelp = optionsEntries.map(([arg, { help, short, required, default: dft }]) => {
		const shortString = short ? `-${short}, ` : '';
		const argString = `--${arg}`;
		const argValue = help.value ? ` ${styleText('cyanBright', `<${help.value}>`)}` : '';
		const argLine = `  ${shortString}${argString}${argValue} `;

		const requiredHelp = required ? ` ${styleText('redBright', '(required)')}` : '';
		const defaultHelp = help.default ?? dft
			? ` ${styleText('blueBright', `(default: ${help.default ?? `"${dft}"`})`)}`
			: '';
		const argHelp = `${styleText('gray', help.message)}${requiredHelp}${defaultHelp}`;

		return {
			arg: argLine,
			argLength: stripVTControlCharacters(argLine).length,
			help: argHelp
		};
	});

	const longestArg = Math.max(...optionsHelp.map(({ argLength }) => argLength));
	optionsHelp.forEach(({ arg, argLength, help }) => {
		console.log(`${arg}${''.padEnd(longestArg - argLength, ' ')} ${help}`);
	});

	process.exit(0);
	// oxlint-disable no-console
}
