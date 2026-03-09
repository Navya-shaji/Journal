import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBase = () => {
    if (Platform.OS === 'web') {
        return window.location.hostname;
    }
    return '192.168.24.239';
};

const API_BASE = getApiBase();
const API_URL = `http://${API_BASE}:5000/api/entries`;

// Helper to get authorization headers
const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createEntry = async (entryData) => {
    try {
        console.log(`📡 POST to ${API_URL}`);
        const headers = await getAuthHeader();
        const response = await axios.post(`${API_URL}`, entryData, { headers });
        console.log('✅ Entry created:', response.data._id);
        return response.data;
    } catch (error) {
        console.error('❌ Create Entry Error:', error.response?.status, error.message);
        throw error.response?.data || { error: 'Failed to save entry' };
    }
};

export const getEntries = async (user, page = 1, limit = 10) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${API_URL}/${user}?page=${page}&limit=${limit}`, { headers });
        return response.data;
    } catch (error) {
        console.error('❌ Get Entries Error:', error.message);
        throw error.response?.data || { error: 'Failed to fetch entries' };
    }
};

export const getEntryById = async (id) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${API_URL}/id/${id}`, { headers });
        return response.data;
    } catch (error) {
        console.error('❌ Get Single Entry Error:', error.message);
        throw error.response?.data || { error: 'Failed to fetch entry' };
    }
};

export const updateEntry = async (id, entryData) => {
    try {
        console.log(`📡 PUT to ${API_URL}/${id}`);
        const headers = await getAuthHeader();
        const response = await axios.put(`${API_URL}/${id}`, entryData, { headers });
        console.log('✅ Entry updated:', id);
        return response.data;
    } catch (error) {
        console.error('❌ Update Entry Error:', error.response?.status, error.message);
        throw error.response?.data || { error: 'Failed to update entry' };
    }
};

export const deleteEntry = async (id) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.delete(`${API_URL}/${id}`, { headers });
        return response.data;
    } catch (error) {
        console.error('❌ Delete Entry Error:', error.message);
        throw error.response?.data || { error: 'Failed to delete entry' };
    }
};
