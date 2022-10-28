import axios from "axios";
import {config} from "./configure";

const args = process.argv.slice(2)
if (args[0] !== 'init') {
	axios.defaults.baseURL = config.host
}
