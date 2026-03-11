import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { theme } from '../constants/Theme';
import { getProfile, updatePin, logout } from '../services/authService';

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPin, setNewPin] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setUser(data);
            } catch (error) {
                Alert.alert('Error', 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdatePin = async () => {
        if (newPin.length !== 4) {
            Alert.alert('Error', 'Pin must be 4 digits');
            return;
        }

        setSaving(true);
        try {
            await updatePin(newPin);
            Alert.alert('Success', 'Journal Pin updated successfully!');
            setNewPin('');
        } catch (error) {
            Alert.alert('Error', error.error || 'Failed to update pin');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.buttonPink} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>My Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.username}>{user?.username}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Settings</Text>
                    <View style={styles.pinCard}>
                        <Text style={styles.pinLabel}>Update Journal Pin</Text>
                        <Text style={styles.pinSubtext}>Set a 4-digit code to lock your private entries.</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.pinInput}
                                placeholder="Enter 4-digit pin"
                                keyboardType="number-pad"
                                maxLength={4}
                                secureTextEntry
                                value={newPin}
                                onChangeText={setNewPin}
                            />
                            <TouchableOpacity
                                style={[styles.updateBtn, saving && styles.btnDisabled]}
                                onPress={handleUpdatePin}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.updateBtnText}>Update</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    backBtn: { padding: 10 },
    backBtnText: { fontSize: 16, color: theme.colors.text, fontWeight: '600' },
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
    content: { flex: 1, padding: 24 },
    profileCard: { alignItems: 'center', marginBottom: 40 },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primaryPink,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        ...Platform.select({
            web: { boxShadow: '0px 5px 15px rgba(255, 112, 150, 0.3)' },
            default: { shadowColor: '#000', shadowOpacity: 0.1 }
        })
    },
    avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
    username: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
    email: { fontSize: 16, color: theme.colors.subText },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
    pinCard: {
        backgroundColor: theme.colors.cardWhite,
        borderRadius: 20,
        padding: 20,
        elevation: 3,
        ...Platform.select({
            web: { boxShadow: '0px 3px 10px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOpacity: 0.05 }
        })
    },
    pinLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    pinSubtext: { fontSize: 12, color: theme.colors.subText, marginTop: 4, marginBottom: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    pinInput: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
    updateBtn: { backgroundColor: theme.colors.buttonPink, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginLeft: 10 },
    updateBtnText: { color: '#fff', fontWeight: '700' },
    btnDisabled: { opacity: 0.6 },
    logoutBtn: { backgroundColor: '#FFEDF1', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 'auto' },
    logoutBtnText: { color: '#FF7096', fontSize: 16, fontWeight: '800' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
