import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBase = () => {
    if (Platform.OS === 'web') {
        return window.location.hostname;
    }
    return '192.168.24.239'; // Your local IP
};

const API_BASE = getApiBase();
const API_URL = `http://${API_BASE}:5000/api/auth`;

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { token, username, userId } = response.data;

        // Save Session
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify({ username, userId }));

        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Network Connection Error' };
    }
};

export const register = async (username, email, password) => {
    try {
        // Basic Frontend Validation
        if (!email.includes('@')) throw { error: 'Invalid email format' };
        if (password.length < 6) throw { error: 'Password must be at least 6 characters' };

        const response = await axios.post(`${API_URL}/register`, { username, email, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Registration failed' };
    }
};

export const logout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
};

export const getSession = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const data = await AsyncStorage.getItem('userData');
    return token ? JSON.parse(data) : null;
};

export const getProfile = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch profile' };
    }
};

export const updatePin = async (pin) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.put(`${API_URL}/update-pin`, { pin }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update pin' };
    }
};
