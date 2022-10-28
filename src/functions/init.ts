import * as path from 'path'
import * as fs from 'fs'
import {CONFIG_FILE_NAME} from "../constants";

export const init = () => {
	const args = process.argv.slice(2)

	if (args[0] === 'init') {
		if (checkForConfig()) {
			console.log('Configuration already exists!')
			process.exit(0)
		}

		copyConfig()
	}
}

const checkForConfig = () => {
	return fs.existsSync(
		path.join(
			process.cwd(),
			CONFIG_FILE_NAME
		)
	)
}

const copyConfig = () => {
	fs.copyFileSync(
		__dirname + '/../../config.example.yaml',
		path.join(
			process.cwd(),
			CONFIG_FILE_NAME
		)
	)

	console.log('Configuration file created!')
	process.exit(0)
}
