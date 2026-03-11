import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    PanResponder,
    Animated
} from 'react-native';
import { theme } from '../constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEntry } from '../services/journalService';

const PAGE_THEMES = [
    { name: 'Paper', color: '#FDFCF0', text: '#3E2723', lined: true },
    { name: 'Vintage', color: '#EBD5B3', text: '#2C1B0E', lined: false },
    { name: 'Modern', color: '#FFFFFF', text: '#333333', lined: true },
];

const STICKERS_LIST = [
    { id: 'heart', emoji: 'Heart' },
    { id: 'star', emoji: 'Star' },
    { id: 'sparkle', emoji: 'Sparkle' },
    { id: 'flower', emoji: 'Flower' },
    { id: 'bear', emoji: 'Bear' },
];

const DraggableSticker = ({ s, onUpdate }) => {
    const pan = useRef(new Animated.ValueXY({ x: s.x, y: s.y })).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                onUpdate(s.id, pan.x._value, pan.y._value);
            }
        })
    ).current;

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                zIndex: 100,
            }}
            {...panResponder.panHandlers}
        >
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{s.emoji}</Text>
        </Animated.View>
    );
};

export default function AddEntryScreen({ navigation, route }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [pageTheme, setPageTheme] = useState(PAGE_THEMES[0]);
    const [activeStickers, setActiveStickers] = useState([]);

    const user = route.params?.userId || 'no-id';

    const inputRef = useRef(null);

    useEffect(() => {
        // Force focus on mount for web/mobile
        if (inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 250);
        }
    }, []);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Empty Entry', 'Please write something in your book.');
            return;
        }

        let currentUid = user;
        if (currentUid === 'no-id') {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                currentUid = parsed.userId;
            } else {
                Alert.alert('Error', 'Please log in to save your entry.');
                return;
            }
        }

        setLoading(true);
        try {
            await createEntry({
                user: currentUid,
                content,
                mood: 'Neutral',
                styling: {
                    theme: pageTheme.name,
                    stickers: activeStickers
                }
            });
            Alert.alert('Saved', 'Your memory has been bound into your book.', [
                { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
            ]);
        } catch (error) {
            Alert.alert('Error', `Failed to save: ${error.error || 'Check connection'}`);
        } finally {
            setLoading(false);
        }
    };

    const addSticker = (stickerTemplate) => {
        const newSticker = {
            ...stickerTemplate,
            id: Date.now().toString(),
            x: 50,
            y: 50
        };
        setActiveStickers([...activeStickers, newSticker]);
        setShowCustomizer(false);
    };

    const updateStickerPos = (id, x, y) => {
        setActiveStickers(prev =>
            (prev || []).map(s => s.id === id ? { ...s, x, y } : s)
        );
    };

    const clearForm = () => {
        Alert.alert(
            "Clear Page?",
            "This will remove all text and stickers you've added. Start fresh?",
            [
                { text: "Continue Writing", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: () => {
                        setContent('');
                        setActiveStickers([]);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#5D4037' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'web' ? undefined : (Platform.OS === 'ios' ? 'padding' : 'height')}
                style={styles.bookWrapper}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.headerText}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.bookTitle}>Journal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={clearForm} style={{ marginRight: 15 }}>
                            <Text style={[styles.headerText, { color: '#BCAAA4' }]}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.page, { backgroundColor: pageTheme.color }]}>
                    {pageTheme.lined && (
                        <View style={styles.linesContainer} pointerEvents="none">
                            {(Array(25).fill(0)).map((_, i) => (
                                <View key={i} style={styles.line} />
                            ))}
                        </View>
                    )}

                    <View style={styles.binding} pointerEvents="none">
                        {(Array(15).fill(0)).map((_, i) => (
                            <View key={i} style={styles.hole} />
                        ))}
                    </View>

                    <View style={styles.stickerLayer} pointerEvents="box-none">
                        {(activeStickers || []).map((s) => (
                            <DraggableSticker
                                key={s.id}
                                s={s}
                                onUpdate={updateStickerPos}
                            />
                        ))}
                    </View>

                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: pageTheme.text }]}
                        placeholder="Write your story here..."
                        placeholderTextColor={pageTheme.text + '80'}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        autoFocus
                    />
                </View>

                <TouchableOpacity
                    style={styles.floatingTool}
                    onPress={() => setShowCustomizer(true)}
                >
                    <Text style={{ fontSize: 18, color: '#5D4037', fontWeight: 'bold' }}>Style</Text>
                </TouchableOpacity>

                <Modal visible={showCustomizer} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Customize Your Page</Text>

                            <Text style={styles.label}>Paper Style</Text>
                            <View style={styles.row}>
                                {PAGE_THEMES.map(t => (
                                    <TouchableOpacity
                                        key={t.name}
                                        style={[styles.themeBtn, { backgroundColor: t.color, borderColor: pageTheme.name === t.name ? '#5D4037' : '#eee' }]}
                                        onPress={() => setPageTheme(t)}
                                    >
                                        <Text style={{ color: t.text, fontWeight: '700' }}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Stickers (Tap to add)</Text>
                            <View style={styles.row}>
                                {(STICKERS_LIST || []).map(s => (
                                    <TouchableOpacity key={s.id} style={styles.stickerBtn} onPress={() => addSticker(s)}>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{s.emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowCustomizer(false)}>
                                <Text style={styles.doneBtnText}>Return to Writing</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bookWrapper: { flex: 1, padding: 15 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    headerText: { color: '#D7CCC8', fontSize: 16, fontWeight: '600' },
    bookTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
    saveText: { color: '#FFCCBC', fontSize: 18, fontWeight: '900' },
    page: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderLeftWidth: 12,
        borderLeftColor: 'rgba(0,0,0,0.15)',
        overflow: 'hidden',
        position: 'relative',
        ...Platform.select({
            web: { boxShadow: '0px 15px 15px rgba(0,0,0,0.4)' },
            default: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, elevation: 25 }
        })
    },
    linesContainer: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 35, paddingTop: 45 },
    line: { height: 1.2, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 28 },
    binding: {
        position: 'absolute',
        left: 4,
        top: 30,
        bottom: 30,
        width: 25,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    hole: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    stickerLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    input: {
        ...StyleSheet.absoluteFillObject,
        paddingHorizontal: 35,
        paddingTop: 45,
        fontSize: 19,
        lineHeight: 28,
        textAlignVertical: 'top',
        zIndex: 50,
        backgroundColor: 'transparent',
        fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
    },
    floatingTool: {
        position: 'absolute',
        bottom: 40,
        right: 40,
        width: 65,
        height: 65,
        borderRadius: 33,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        ...Platform.select({
            web: { boxShadow: '0px 10px 10px rgba(0,0,0,0.3)' },
            default: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 }
        })
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', padding: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
    modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 25, color: '#3E2723' },
    label: { fontSize: 13, fontWeight: '800', color: '#BCAAA4', marginBottom: 12, textTransform: 'uppercase' },
    row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25 },
    themeBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, borderWidth: 2, marginRight: 15, alignItems: 'center' },
    stickerBtn: { padding: 12, backgroundColor: '#efebe9', borderRadius: 18, marginRight: 15, marginBottom: 15 },
    doneBtn: { backgroundColor: '#5D4037', padding: 18, borderRadius: 20, alignItems: 'center' },
    doneBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});
