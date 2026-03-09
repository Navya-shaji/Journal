import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { theme } from '../constants/Theme';
import { getProfile, logout } from '../services/authService';

export default function PinLockScreen({ navigation, route }) {
    const [pin, setPin] = useState('');
    const [correctPin, setCorrectPin] = useState('1234');
    const [loading, setLoading] = useState(true);
    const { onAuthenticated } = route.params || {};

    useEffect(() => {
        const fetchPin = async () => {
            try {
                const profile = await getProfile();
                if (profile && profile.journalPin) {
                    setCorrectPin(profile.journalPin);
                }
            } catch (error) {
                console.error('Failed to fetch PIN:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPin();
    }, []);

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === correctPin) {
                if (onAuthenticated) {
                    onAuthenticated();
                } else {
                    navigation.replace('Dashboard', route.params?.userParams);
                }
            } else {
                Alert.alert('Incorrect PIN', 'Please try again.');
                setPin('');
            }
        }
    }, [pin]);

    const handlePress = (num) => {
        if (pin.length < 4) setPin(pin + num);
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
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
            <View style={styles.container}>
                <ActivityIndicator size="large" color={theme.colors.buttonPink} />
                <Text style={[styles.subtitle, { marginTop: 20 }]}>Checking security...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Secure Entry</Text>
            <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

            <View style={styles.pinDotsContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.pinDot,
                            pin.length >= i && styles.pinDotFilled
                        ]}
                    />
                ))}
            </View>

            <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                    >
                        <Text style={styles.keyText}>{num}</Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.key} />
                <TouchableOpacity
                    style={styles.key}
                    onPress={() => handlePress('0')}
                >
                    <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.key}
                    onPress={handleBackspace}
                >
                    <Text style={[styles.keyText, { fontSize: 18 }]}>⌫</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
                <Text style={styles.logoutLinkText}>Switch Account or Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.subText,
        marginBottom: 48,
    },
    pinDotsContainer: {
        flexDirection: 'row',
        marginBottom: 60,
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.primaryPink,
        marginHorizontal: 15,
    },
    pinDotFilled: {
        backgroundColor: theme.colors.primaryPink,
    },
    keypad: {
        width: '80%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    key: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 10,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 4px 5px rgba(196, 169, 177, 0.1)' },
            default: { shadowColor: '#C4A9B1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 }
        })
    },
    keyText: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
    },
    logoutLink: {
        marginTop: 40,
        padding: 10,
    },
    logoutLinkText: {
        color: theme.colors.buttonPink,
        fontWeight: '700',
        fontSize: 14,
    }
});
