import axios, { CanceledError } from "axios";

export { CanceledError };

const backend_url = import.meta.env.VITE_BACKEND_URL
const apiClient = axios.create({
    baseURL: backend_url,
});

export default apiClient;