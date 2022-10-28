import axios from "axios";
import {config} from "../init";

export const authenticate = async () => {
	const res = await axios({
		method: 'POST',
		url: '/api/v1/auth/token',
		data: {
			grant_type: 'client_credentials',
			client_id: config.clientId,
			client_secret: config.clientSecret
		}
	}).catch(() => {
		console.log('Fail to send authentication request!')
		process.exit(-1)
	})

	if (res.status !== 200) {
		console.log('Invalid credentials!')
		process.exit(-1)
	}

	const accessToken = res.data.access_token

	axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken
}
