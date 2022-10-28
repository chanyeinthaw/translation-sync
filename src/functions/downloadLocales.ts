import axios from "axios";
import {config} from "../init";

export const downloadLocales = async () => {
	const locales = new Map<string, any>()
	const downloadPromises = config.locales.map(async (locale) => {
		const data = await downloadLocale(config.projectId, locale)
		locales.set(locale, data)
	})

	await Promise.all(downloadPromises)
	return locales
}

const downloadLocale = async (projectId: string, locale: string) => {
	const res = await axios.get(`/api/v1/projects/${projectId}/exports`, {
		params: {
			locale: locale,
			format: 'jsonnested'
		}
	}).catch(() => {
		console.log('Could not download', locale, '!')
		process.exit(-1)
	})

	if (res.status !== 200) {
		console.log('Could not download', locale, '!')
		process.exit(-1)
	}

	return res.data
}
