import React, { useState } from 'react';
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
import { register } from '../services/authService';
import { theme } from '../constants/Theme';

export default function SignupScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!username || !email || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields to bloom');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password);
            navigation.navigate('Login', { email: email, registered: true });
        } catch (error) {
            Alert.alert('Oops!', error.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.circle, { top: -60, left: -40, backgroundColor: theme.colors.softLavender }]} />
            <View style={[styles.circle, { bottom: -50, right: -50, backgroundColor: theme.colors.mintGreen }]} />

            <View style={styles.content}>
                <Text style={styles.title}>Start Your{"\n"}Story</Text>
                <Text style={styles.subtitle}>Create an account to save your thoughts</Text>

                <View style={styles.inputCard}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What should we call you?"
                            placeholderTextColor="#C4A9B1"
                            value={username}
                            onChangeText={setUsername}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
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
                            placeholder="Keep it safe"
                            placeholderTextColor="#C4A9B1"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Get Started</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.link}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.linkText}>
                        Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
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
        width: 220,
        height: 220,
        borderRadius: 110,
        opacity: 0.3,
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
        marginBottom: 32,
        fontWeight: '500',
    },
    inputCard: {
        backgroundColor: theme.colors.cardWhite,
        borderRadius: theme.borderRadius.xl,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        ...Platform.select({
            web: { boxShadow: '0px 10px 20px rgba(196, 169, 177, 0.1)' },
            default: { shadowColor: '#C4A9B1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }
        })
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B28EA1',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FDF6F8',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        fontSize: 15,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: '#F0E0E5',
    },
    button: {
        backgroundColor: theme.colors.softLavender,
        paddingVertical: 18,
        borderRadius: theme.borderRadius.round,
        alignItems: 'center',
        elevation: 6,
        ...Platform.select({
            web: { boxShadow: '0px 8px 12px rgba(150, 112, 255, 0.4)' },
            default: { shadowColor: theme.colors.softLavender, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12 }
        })
    },
    buttonDisabled: {
        backgroundColor: '#D1C4E9',
    },
    buttonText: {
        color: '#5E3A9E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    link: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: theme.colors.subText,
    },
    linkHighlight: {
        color: '#7B61FF',
        fontWeight: '700',
    },
});
