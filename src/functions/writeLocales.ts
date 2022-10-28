import * as fs from 'fs'
import * as path from 'path'
import {config} from "../init";

export const writeLocales = (locales: Map<string, any>) => {
	const outputDir = path.join(
			process.cwd(),
			config.outputDir
		)
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir)
	}

	[...locales].forEach((value) => {
		fs.writeFileSync(
			path.join(
				outputDir,
				`${value[0]}.json`
			),
			JSON.stringify(value[1], null, 2),
			{
				flag: 'w'
			}
		)
	})
}
