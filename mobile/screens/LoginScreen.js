import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { login, googleLogin } from '../services/authService';
import { theme } from '../constants/Theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation, route }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [regSuccess, setRegSuccess] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLogin(id_token);
        }
    }, [response]);

    const handleGoogleLogin = async (idToken) => {
        console.log('Frontend: Google Login initiated');
        setLoading(true);
        try {
            // DEMO MODE: If no real token is received (due to missing Client IDs), use mock
            const tokenToSend = idToken || 'mock_google_token';
            console.log('Frontend: Sending token to backend:', tokenToSend);
            
            const data = await googleLogin(tokenToSend);
            navigation.navigate('Dashboard', { username: data.username, userId: data.userId });
        } catch (error) {
            console.log('Frontend: Google Login error:', error);
            Alert.alert('Google Login Failed', error.error || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const startGoogleLogin = () => {
        // If Client IDs are placeholders, skip real prompt and use Demo Mode
        if (request?.url === null || !request) {
             handleGoogleLogin('mock_google_token');
        } else {
            promptAsync();
        }
    };

    useEffect(() => {
        if (route.params?.email) {
            setEmail(route.params.email);
            if (route.params?.registered) {
                setRegSuccess(true);
            }
        }
    }, [route.params]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter your details');
            return;
        }

        setLoading(true);
        try {
            const data = await login(email, password);
            navigation.navigate('Dashboard', { username: data.username, userId: data.userId });
        } catch (error) {
            Alert.alert('Login Failed', error.error || 'Check your connection');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.circle, { top: -50, right: -50, backgroundColor: theme.colors.primaryPink }]} />
            <View style={[styles.circle, { bottom: -80, left: -60, backgroundColor: theme.colors.softLavender, width: 250, height: 250 }]} />

            <View style={styles.content}>
                <Text style={styles.title}>Welcome{"\n"}Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your journey</Text>

                {regSuccess && (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>Registration successful! Please sign in.</Text>
                    </View>
                )}

                <View style={styles.inputCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="hello@journal.com"
                            placeholderTextColor="#C4A9B1"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#C4A9B1"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => startGoogleLogin()}
                    disabled={loading}
                >
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.link}
                    onPress={() => navigation.navigate('Signup')}
                >
                    <Text style={styles.linkText}>
                        New here? <Text style={styles.linkHighlight}>Join the community</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    circle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.4,
    },
    content: {
        zIndex: 1,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: theme.colors.text,
        lineHeight: 48,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.subText,
        marginBottom: 40,
        fontWeight: '500',
    },
    inputCard: {
        backgroundColor: theme.colors.cardWhite,
        borderRadius: theme.borderRadius.xl,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(196, 169, 177, 0.15)' },
            default: { shadowColor: '#C4A9B1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 }
        })
    },
    successBox: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    successText: {
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B28EA1',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FDF6F8',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: '#F0E0E5',
    },
    button: {
        backgroundColor: theme.colors.buttonPink,
        paddingVertical: 18,
        borderRadius: theme.borderRadius.round,
        alignItems: 'center',
        elevation: 6,
        ...Platform.select({
            web: { boxShadow: '0px 8px 12px rgba(255, 112, 150, 0.4)' },
            default: { shadowColor: theme.colors.buttonPink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12 }
        })
    },
    buttonDisabled: {
        backgroundColor: '#EACFD5',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    link: {
        marginTop: 32,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: theme.colors.subText,
    },
    linkHighlight: {
        color: '#D88A9F',
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#F0E0E5',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#C4A9B1',
        fontSize: 12,
        fontWeight: '700',
    },
    googleButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: theme.borderRadius.round,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0E0E5',
        flexDirection: 'row',
        justifyContent: 'center',
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 4px 6px rgba(196, 169, 177, 0.1)' },
            default: { shadowColor: '#C4A9B1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }
        })
    },
    googleButtonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
});
