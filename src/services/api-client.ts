import axios, { CanceledError } from "axios";

export { CanceledError };

const backend_url = "http://localhost:3000";
const apiClient = axios.create({
    baseURL: backend_url,
});

export default apiClient;