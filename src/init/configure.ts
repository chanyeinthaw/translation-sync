import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'
import {CONFIG_FILE_NAME} from "../constants";

export let config: {
	host: string,

	projectId: string,
	clientId: string,
	clientSecret: string,

	locales: string[],
	outputDir: string
}

const configure = () => {
	const args = process.argv.slice(2)
	if (args[0] === 'init') return

	const configPath = path.join(
		process.cwd(),
		CONFIG_FILE_NAME
	)

	if (!fs.existsSync(configPath)) {
		console.error('Config file does not exists! Use `init` to create configuration file.')
		process.exit(-1)
	}

	const contents = fs.readFileSync(configPath).toString()

	try {
		config = YAML.parse(contents)
	} catch (e) {
		console.error('Invalid YAML format!')
		process.exit(-1)
	}
}

configure()
