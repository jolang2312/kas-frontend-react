import axios from 'axios';

const api = axios.create({
    baseURL: 'https://kas-backend-dun.vercel.app/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;