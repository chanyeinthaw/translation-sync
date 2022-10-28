#!/usr/bin/env node

import {authenticate} from "./functions/authenticate";
import {validateLocales} from "./functions/validateLocales";
import {downloadLocales} from "./functions/downloadLocales";
import {writeLocales} from "./functions/writeLocales";
import {init} from "./functions/init";

async function main() {
	init()

	await authenticate()
	await validateLocales()

	const locales = await downloadLocales()
	writeLocales(locales)

	console.log('Done!')
}

main()
	.then()
	.catch((e) => {
		console.log(e)
		console.log('Something went wrong!')
		process.exit(-1)
	})
