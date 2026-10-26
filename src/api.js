import axios from 'axios';

const api = axios.create({
    // Ganti URL di bawah ini dengan URL backend publik kamu yang sudah di-deploy
    baseURL: 'https://kas-backend.vercel.app/api', 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;