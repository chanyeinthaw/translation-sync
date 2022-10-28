import axios from "axios";
import {config} from "../init";

export const validateLocales = async () => {
	const res = await axios.get(`/api/v1/projects/${config.projectId}/translations`)
		.catch(() => {
			console.log('Could not get locales!')
			process.exit(-1)
		})

	if (res.status !== 200) {
		console.log('Could not get locales!')
		process.exit(-1)
	}

	const locales: string[] = res.data.data.map((translation: any) => translation.locale.code)
	config.locales.forEach(locale => {
		if (locales.indexOf(locale) < 0) {
			console.log('Invalid locale', locale, '!')
			process.exit(-1)
		}
	})
}
