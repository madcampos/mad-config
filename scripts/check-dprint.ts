// oxlint-disable no-await-in-loop no-console
/// <reference types="@types/node" />
/// <reference lib="DOM" />

import puppeteer from 'puppeteer';

import config from '../src/dprint.json' with { type: 'json' };

const SELECTOR = 'h2' as const;
const URLS = [
	{ key: 'typescript', url: 'https://dprint.dev/plugins/typescript/config/' },
	{ key: 'json', url: 'https://dprint.dev/plugins/json/config/' },
	{ key: 'markdown', url: 'https://dprint.dev/plugins/markdown/config/' },
	{ key: 'toml', url: 'https://dprint.dev/plugins/toml/config/' },
	{ key: 'yaml', url: 'https://dprint.dev/plugins/pretty_yaml/config/' },
	{ key: 'dockerfile', url: 'https://dprint.dev/plugins/dockerfile/config/' },
	{ key: 'malva', url: 'https://dprint.dev/plugins/malva/config/' },
	{ key: 'markup', url: 'https://dprint.dev/plugins/markup_fmt/config/' }
] as const;

const browser = await puppeteer.launch({ headless: true });

try {
	for (const { key, url } of URLS) {
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: 'networkidle2' });

		// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unnecessary-condition
		const configKeys = Object.keys(config[key as keyof typeof config] ?? {});
		const configItems = await page.$$eval(SELECTOR, (elements: HTMLElement[]) => elements.map((element) => element.textContent.trim()));

		const missingFromConfig = configItems.filter((item) => !configKeys.includes(item));

		if (missingFromConfig.length > 0) {
			console.log(`Found ${missingFromConfig.length} items NOT in config "${key}":`);
			missingFromConfig.forEach((item) => console.log(` - "${item}"`));
		}

		await page.close();
	}
} catch (error) {
	console.error('An error occurred during execution:', error);
} finally {
	await browser.close();
}
