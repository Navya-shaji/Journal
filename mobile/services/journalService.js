import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = `https://journal-w9ls.onrender.com/api/entries`;

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createEntry = async (entryData) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.post(`${API_URL}`, entryData, { headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to save entry' };
    }
};

export const getEntries = async (user, page = 1, limit = 10) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${API_URL}/${user}?page=${page}&limit=${limit}`, { headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch entries' };
    }
};

export const getEntryById = async (id) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${API_URL}/id/${id}`, { headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch entry' };
    }
};

export const updateEntry = async (id, entryData) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.put(`${API_URL}/${id}`, entryData, { headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update entry' };
    }
};

export const deleteEntry = async (id) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.delete(`${API_URL}/${id}`, { headers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete entry' };
    }
};
