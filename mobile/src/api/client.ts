import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BASE_URL configuration
// For Android Emulator: http://10.0.2.2:5000/api/v1
// For iOS Simulator: http://localhost:5000/api/v1
// For Physical Device: http://YOUR_PC_IP_ADDRESS:5000/api/v1 (e.g., http://192.168.1.2:5000/api/v1)

// Detected IP: 192.168.1.2
const BASE_URL = 'http://192.168.1.2:5000/api/v1';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Add interceptor to add token to requests
client.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;
