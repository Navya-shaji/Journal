import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
    Dimensions, Image, PanResponder, Animated, ScrollView,
    TextInput, Alert, Platform, StatusBar, Modal, KeyboardAvoidingView
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEntry, getEntryById, updateEntry } from '../services/journalService';
import { theme } from '../constants/Theme';

let ViewShot;
if (Platform.OS !== 'web') {
    try { ViewShot = require("react-native-view-shot").default; } catch (e) { }
}

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

const BRUSH_COLORS = ['#6D4C41', '#C62828', '#1565C0', '#2E7D32', '#F57F17', '#6A1B9A', '#000', '#E91E8C'];
const BRUSH_SIZES = [2, 4, 8, 14];

// ─── Text Shapes ─────────────────────────────────────────────────────────────
const TEXT_SHAPES = [
    { id: 'card', label: '📋 Card', style: { backgroundColor: '#FDF5E6', borderRadius: 5, padding: 14, width: 200 } },
    { id: 'sticky', label: '📌 Sticky', style: { backgroundColor: '#FFF9C4', borderRadius: 3, padding: 14, width: 180, borderBottomWidth: 4, borderBottomColor: '#F9A825' } },
    { id: 'ribbon', label: '🎀 Ribbon', style: { backgroundColor: '#F8BBD0', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' } },
    { id: 'badge', label: '🏷️ Badge', style: { backgroundColor: '#E8F5E9', borderRadius: 50, padding: 16, width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A5D6A7' } },
    { id: 'torn', label: '📄 Torn', style: { backgroundColor: '#FFFDE7', padding: 14, width: 200, borderTopWidth: 1, borderTopColor: '#F0E070', borderStyle: 'dashed' } },
    { id: 'minimal', label: '✏️ Plain', style: { padding: 10, width: 200, borderBottomWidth: 2, borderBottomColor: '#8D6E63' } },
    { id: 'frame', label: '🖼️ Frame', style: { backgroundColor: '#fff', padding: 14, width: 200, borderWidth: 3, borderColor: '#8D6E63' } },
    { id: 'cloud', label: '☁️ Cloud', style: { backgroundColor: '#E3F2FD', borderRadius: 40, padding: 18, width: 200, alignItems: 'center' } },
];

// ─── Sticker Library ─────────────────────────────────────────────────────────
const STICKER_CATEGORIES = {
    '⭐ Faves': ['🌸', '🦋', '📖', '❤️', '☕', '🌿', '📷', '✨', '🎀', '🌷'],
    '🌸 Flowers': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '💐', '🪷', '🌾', '🍀', '🪻', '🌱', '🌿', '🍃', '🪸', '🌳', '🌲', '🪴', '🌵', '🌴'],
    '🦋 Insects': ['🦋', '🐝', '🐞', '🪲', '🐛', '🦟', '🪳', '🐌', '🦎', '🌸', '🌼', '🌺', '🌻', '🌹', '🪷'],
    '📚 Vintage': ['📖', '📚', '📜', '🪶', '🖊️', '✒️', '🕰️', '🎩', '🧳', '🗝️', '🗃️', '📯', '🎗️', '🪞', '🕯️'],
    '📷 Retro': ['📷', '📸', '🎥', '📽️', '📻', '📺', '☎️', '🗺️', '🧭', '🪄', '🎞️', '🔮', '🪬', '🏮', '🎑'],
    '❤️ Lovely': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💗', '💖', '💝', '💌', '🫶', '💋', '🌹'],
    '🐾 Animals': ['🐇', '🦊', '🐿️', '🦔', '🐦', '🕊️', '🦩', '🦚', '🐠', '🦋', '🐝', '🌸', '🌿', '🍃', '🪷'],
    '✨ Magic': ['✨', '🌟', '💫', '⚡', '🔮', '🪄', '🌈', '☄️', '🌌', '💎', '🌙', '⭐', '🌠', '🫧', '🪐'],
    '☕ Cafe': ['☕', '🍵', '🧋', '🫖', '🍰', '🧁', '🍩', '🍪', '🍫', '🍓', '🍒', '🫐', '🍋', '🌸', '🕯️'],
    '🌤 Sky': ['☀️', '🌤️', '⛅', '☁️', '🌈', '🌙', '🌛', '⭐', '🌟', '💫', '⚡', '❄️', '☂️', '🌊', '🌠'],
    '✈️ Travel': ['✈️', '🚲', '🚂', '⛵', '🏕️', '🏖️', '🏰', '🗼', '🌍', '🧭', '📷', '🎒', '🌅', '🌄', '🏔️'],
    '🎵 Music': ['🎵', '🎶', '🎸', '🎹', '🎤', '🎧', '🎼', '🎺', '🎻', '🥁', '🎷', '🪗', '🪈', '🎙️', '🎚️'],
    '🌙 Disney': ['🐭', '🐰', '🦁', '🐟', '🐙', '🤍', '⭐', '✨', '🏰', '🎡', '🌠', '💫', '🦋', '🌺', '🪄'],
    '🌙 Cozy': ['🕯️', '🧸', '📖', '🍵', '🛋️', '🌙', '🧶', '🪴', '🐾', '🍂', '🏠', '🧣', '🫖', '🪞', '🌛'],
    '🪷 Korean': ['🌸', '🎀', '☁️', '🍵', '🪄', '✨', '💌', '🌙', '🐰', '🍡', '🫧', '🪻', '🌷', '🎐', '🏮'],
};

// ─── Quotes Library ──────────────────────────────────────────────────────────
const QUOTE_CATEGORIES = {
    '💫 Inspire': ['Life is a beautiful ride.', 'Dream without fear.', 'Be the change you wish to see.', 'Every day is a second chance.', 'Choose happy.', 'Think less, live more.', 'Say yes to new adventures.', 'You are enough.', 'Grow through what you go through.', 'Good things take time.'],
    '🌸 Soft': ['Be gentle with yourself.', 'Small steps every day.', 'Bloom where you are planted.', 'She believed she could, so she did.', 'You are made of magic.', 'Collect moments, not things.', 'Breathe. Trust. Let go.', 'Stay soft. It is beautiful.', 'Sunshine and flowers.', 'In the middle of difficulty lies opportunity.'],
    '📖 Journal': ['Today I am grateful for…', 'I felt most alive when…', 'My favourite memory is…', 'Something that made me smile…', 'What I want to remember…', 'The best part of today…', 'I am proud of myself for…', 'A lesson I learned today…', 'Something I love about my life…', 'Goals for tomorrow…'],
    '💪 Bold': ['No rain, no flowers.', 'Be a voice, not an echo.', 'Difficult roads lead to beautiful destinations.', 'You were born an original.', 'Do what they think you can\'t.', 'Never let go of your dreams.', 'Every moment is a fresh beginning.', 'Mistakes are proof you are trying.', 'Strive for progress, not perfection.', 'Go the extra mile — it\'s never crowded.'],
};

// ─── Text Shape Picker Modal ──────────────────────────────────────────────────
const TextShapePickerModal = ({ visible, onSelect, onClose }) => (
    <Modal visible={visible} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
            <View style={styles.shapePickerModal}>
                <Text style={styles.shapePickerTitle}>Choose Text Style</Text>
                <ScrollView contentContainerStyle={styles.shapeGrid}>
                    {TEXT_SHAPES.map(shape => (
                        <TouchableOpacity
                            key={shape.id}
                            style={styles.shapeOption}
                            onPress={() => { onSelect(shape.id); onClose(); }}
                        >
                            <View style={[styles.shapePreview, shape.style]}>
                                <Text style={styles.shapePreviewText} numberOfLines={2}>Aa text</Text>
                            </View>
                            <Text style={styles.shapeLabel}>{shape.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
    </Modal>
);

// ─── Text Edit Modal ──────────────────────────────────────────────────────────
const TextEditModal = ({ visible, item, onSave, onClose }) => {
    const [draft, setDraft] = useState(item?.content || '');
    useEffect(() => { setDraft(item?.content || ''); }, [item]);
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'} style={styles.modalBackdrop}>
                <View style={styles.editModal}>
                    <View style={styles.editModalHeader}>
                        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
                        <Text style={styles.editModalTitle}>{item?.label || 'Text'}</Text>
                        <TouchableOpacity onPress={() => { onSave(item?.id, draft); onClose(); }}>
                            <Text style={styles.modalDone}>Done ✓</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput style={styles.editModalInput} value={draft} onChangeText={setDraft}
                        multiline autoFocus placeholder="Write here..." placeholderTextColor="#BCAAA4" />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Quotes Modal ─────────────────────────────────────────────────────────────
const QuotePickerModal = ({ visible, onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState('💫 Inspire');
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalBackdrop}>
                <View style={styles.quoteModal}>
                    <View style={styles.editModalHeader}>
                        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
                        <Text style={styles.editModalTitle}>💬 Quotes</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabsRow}>
                        {Object.keys(QUOTE_CATEGORIES).map(cat => (
                            <TouchableOpacity key={cat} style={[styles.catTab, activeTab === cat && styles.catTabActive]} onPress={() => setActiveTab(cat)}>
                                <Text style={[styles.catTabText, activeTab === cat && styles.catTabTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView contentContainerStyle={styles.quoteList}>
                        {QUOTE_CATEGORIES[activeTab].map((q, i) => (
                            <TouchableOpacity key={i} style={styles.quoteItem} onPress={() => { onSelect(q); onClose(); }}>
                                <Text style={styles.quoteText}>"{q}"</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ─── Custom Premium Confirmation Popup ────────────────────────────────────────
const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, isDestructive }) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
            <View style={styles.premiumPopup}>
                <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>{title}</Text>
                </View>
                <Text style={styles.popupMessage}>{message}</Text>
                <View style={styles.popupActions}>
                    <TouchableOpacity style={styles.popupCancel} onPress={onCancel}>
                        <Text style={styles.popupCancelText}>{cancelText || 'Back'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.popupConfirm, isDestructive && styles.destructiveConfirm]}
                        onPress={onConfirm}
                    >
                        <Text style={styles.popupConfirmText}>{confirmText || 'Yes'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// ─── Selection Action Bar ─────────────────────────────────────────────────────
const SelectionBar = ({ visible, onDelete, onDuplicate, onRotate, onDeselect }) => {
    if (!visible) return null;
    return (
        <View style={styles.selectionBar}>
            <TouchableOpacity style={styles.selAction} onPress={onDeselect}>
                <Text style={styles.selActionEmoji}>✕</Text>
                <Text style={styles.selActionText}>Deselect</Text>
            </TouchableOpacity>
            <View style={styles.selDivider} />
            <TouchableOpacity style={styles.selAction} onPress={onRotate}>
                <Text style={styles.selActionEmoji}>🔄</Text>
                <Text style={styles.selActionText}>Rotate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selAction} onPress={onDuplicate}>
                <Text style={styles.selActionEmoji}>📋</Text>
                <Text style={styles.selActionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selAction, styles.selDelete]} onPress={onDelete}>
                <Text style={styles.selActionEmoji}>🗑️</Text>
                <Text style={[styles.selActionText, { color: '#C62828' }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    );
};

// ─── Box Content Renderer (shape-aware) ──────────────────────────────────────
const getBoxStyle = (shape) => {
    const s = TEXT_SHAPES.find(t => t.id === shape);
    return s ? s.style : TEXT_SHAPES[0].style;
};

const getTextStyle = (shape) => {
    if (shape === 'ribbon') return { fontSize: 15, fontWeight: '700', color: '#880E4F', textAlign: 'center' };
    if (shape === 'badge') return { fontSize: 16, fontWeight: '800', color: '#2E7D32', textAlign: 'center' };
    if (shape === 'minimal') return { fontSize: 18, color: '#3E2723', fontFamily: IS_IOS ? 'Palatino' : 'serif', fontStyle: 'italic' };
    if (shape === 'sticky') return { fontSize: 17, color: '#3E2723', fontFamily: IS_IOS ? 'Palatino' : 'serif' };
    if (shape === 'cloud') return { fontSize: 16, color: '#0D47A1', textAlign: 'center', fontStyle: 'italic' };
    return { fontSize: 17, color: '#3E2723', fontFamily: IS_IOS ? 'Palatino' : 'serif', lineHeight: 26 };
};

// ─── Draggable Element ────────────────────────────────────────────────────────
const ScrapbookElement = ({ item, isSelected, onSelect, onUpdate, isViewMode, currentTool, onOpenEdit }) => {
    const pan = useRef(new Animated.ValueXY({ x: item.x, y: item.y })).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const currentToolRef = useRef(currentTool);
    const isViewModeRef = useRef(isViewMode);
    useEffect(() => { currentToolRef.current = currentTool; }, [currentTool]);
    useEffect(() => { isViewModeRef.current = isViewMode; }, [isViewMode]);

    useEffect(() => {
        if (!isViewMode && item.type === 'sticker') {
            Animated.loop(Animated.sequence([
                Animated.timing(floatAnim, { toValue: -3, duration: 2000, useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])).start();
        }
    }, [isViewMode]);

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => !isViewModeRef.current && currentToolRef.current === 'move',
        onMoveShouldSetPanResponder: () => !isViewModeRef.current && currentToolRef.current === 'move',
        onPanResponderGrant: () => {
            onSelect(item.id);
            pan.setOffset({ x: pan.x._value, y: pan.y._value });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: () => {
            pan.flattenOffset();
            onUpdate(item.id, pan.x._value, pan.y._value);
        },
    })).current;

    const inDoodle = currentTool === 'doodle';

    return (
        <Animated.View
            {...panResponder.panHandlers}
            pointerEvents={inDoodle || isViewMode ? 'none' : 'auto'}
            style={[styles.element, {
                transform: [
                    { translateX: pan.x }, { translateY: pan.y },
                    item.type === 'sticker' ? { translateY: floatAnim } : { translateY: 0 },
                    { rotate: `${item.rotation || 0}deg` }
                ],
                zIndex: item.type === 'tape' ? 50 : 2,
            }]}
        >
            {/* Selection ring */}
            {isSelected && !isViewMode && !inDoodle && (
                <View style={styles.selectedRing} pointerEvents="none" />
            )}

            {item.type === 'sticker' && <Text style={{ fontSize: item.size || 42 }}>{item.content}</Text>}

            {item.type === 'tape' && (
                <View style={[styles.tape, { backgroundColor: item.color || 'rgba(188,170,164,0.65)', width: 80, height: 26 }]} />
            )}

            {item.type === 'polaroid' && (
                <View style={styles.polaroidFrame}>
                    <View style={styles.polaroidInner}>
                        <Image source={{ uri: item.content }} style={styles.polaroidImage} />
                    </View>
                    <Text style={styles.polaroidCaption}>{item.label || '✨'}</Text>
                </View>
            )}

            {(item.type === 'box' || item.type === 'quote') && (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => !isViewMode && currentToolRef.current === 'move' && onOpenEdit(item)}
                    style={item.type === 'quote'
                        ? [styles.quoteBox]
                        : [getBoxStyle(item.shape || 'card')]}
                >
                    {item.type === 'box' && item.shape !== 'minimal' && item.shape !== 'ribbon' && item.shape !== 'badge' && item.shape !== 'cloud' && (
                        <Text style={styles.boxLabel}>{item.label}</Text>
                    )}
                    <Text style={[
                        item.type === 'quote' ? styles.quoteBoxText : getTextStyle(item.shape || 'card'),
                        !item.content && styles.placeholder
                    ]}>
                        {item.content || 'Tap to write...'}
                    </Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PremiumScrapbookScreen({ navigation, route }) {
    const [userId, setUserId] = useState(route.params?.userId || 'no-id');

    useEffect(() => {
        const getUserId = async () => {
            if (userId !== 'no-id') return;
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                // Fix: use userId which matches authService.js
                setUserId(user.userId || user.id || user._id);
                console.log('✅ Session restored in Scrapbook:', user.userId);
            }
        };
        getUserId();
    }, []);

    const [pages, setPages] = useState([{
        id: 'page1',
        elements: [],
        paths: []
    }]);

    const [existingId, setExistingId] = useState(route.params?.entryId || null);

    const [currentPage, setCurrentPage] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [currentTool, setCurrentTool] = useState('move');
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showQuotes, setShowQuotes] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [showPageGrid, setShowPageGrid] = useState(false);
    const [activeLibTab, setActiveLibTab] = useState('⭐ Faves');
    const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: () => { }, isDestructive: false });

    const livePathRef = useRef('');
    const [livePath, setLivePath] = useState(null);
    const brushColorRef = useRef(BRUSH_COLORS[0]);
    const brushSizeRef = useRef(3);
    const [brushColor, setBrushColorUI] = useState(BRUSH_COLORS[0]);
    const [brushSize, setBrushSizeUI] = useState(3);
    const setBrushColor = (c) => { brushColorRef.current = c; setBrushColorUI(c); };
    const setBrushSize = (s) => { brushSizeRef.current = s; setBrushSizeUI(s); };

    const [sound, setSound] = useState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved'
    const viewShotRef = useRef();
    const pageTranslateX = useRef(new Animated.Value(0)).current;
    const pagesRef = useRef(pages);
    const currentPageRef = useRef(0);

    useEffect(() => { pagesRef.current = pages; }, [pages]);
    useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

    // ── Load data on mount ──
    useEffect(() => {
        const loadInitialData = async () => {
            if (existingId) {
                // Load from database if we have an ID
                setSaveStatus('loading');
                try {
                    const entry = await getEntryById(existingId);
                    if (entry && entry.styling?.theme === 'Premium Scrapbook') {
                        setPages([{
                            id: 'page1',
                            elements: entry.styling.elements || [],
                            paths: entry.styling.paths || []
                        }]);
                    }
                } catch (e) {
                    console.error('Failed to load entry:', e);
                } finally {
                    setSaveStatus('');
                }
            } else {
                // Load from local cache if no specific entry ID
                const data = await AsyncStorage.getItem('scrapbook_pages');
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.length > 0) setPages(parsed);
                    } catch (e) { }
                } else if (!existingId) {
                    // Default elements for new blank scrapbook
                    setPages([{
                        id: 'page1',
                        elements: [
                            { id: '1', type: 'box', shape: 'card', label: 'Title', content: 'Dear Diary...', x: 40, y: 55, color: '#FDF5E6' },
                            { id: '2', type: 'sticker', content: '🌸', x: width * 0.65, y: 40, rotation: 12 },
                            { id: '3', type: 'sticker', content: '✨', x: width * 0.2, y: 300, rotation: -5 },
                            { id: '4', type: 'box', shape: 'sticky', label: 'My Mood', content: 'Happy ✨', x: 40, y: height * 0.45 },
                        ],
                        paths: []
                    }]);
                }
            }
        };
        loadInitialData();
    }, [existingId]);

    // ── Auto-save pages whenever they change ──
    const saveTimerRef = useRef(null);
    useEffect(() => {
        setSaveStatus('saving');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            AsyncStorage.setItem('scrapbook_pages', JSON.stringify(pages))
                .then(() => {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus(''), 2000);
                })
                .catch(() => setSaveStatus(''));
        }, 800);
    }, [pages]);

    // Music
    async function playSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                { shouldPlay: true, isLooping: true, volume: 0.2 }
            );
            setSound(sound); setIsPlaying(true);
        } catch (e) { }
    }
    useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);
    useEffect(() => {
        if (isViewMode && !isPlaying) playSound();
        else if (!isViewMode && isPlaying) { sound?.stopAsync(); setIsPlaying(false); }
    }, [isViewMode]);

    const handlePageChange = (dir) => {
        const currentIdx = currentPageRef.current;
        const next = currentIdx + dir;
        const totalPages = pagesRef.current.length;

        if (next < 0 || next >= totalPages) return;

        Animated.timing(pageTranslateX, { toValue: dir === 1 ? -width : width, duration: 350, useNativeDriver: true })
            .start(() => {
                setCurrentPage(next);
                pageTranslateX.setValue(dir === 1 ? width : -width);
                Animated.timing(pageTranslateX, { toValue: 0, duration: 350, useNativeDriver: true }).start();
            });
    };

    const updateElement = (id, x, y, content) => {
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : {
            ...pg,
            elements: pg.elements.map(el =>
                el.id === id ? { ...el, x, y: y ?? el.y, content: content !== undefined ? content : el.content } : el
            )
        }));
    };

    const saveText = (id, content) => {
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : {
            ...pg, elements: pg.elements.map(el => el.id === id ? { ...el, content } : el)
        }));
    };

    // Selection actions
    const selectedElement = pages[currentPage]?.elements.find(e => e.id === selectedId);

    const deleteSelected = () => {
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : {
            ...pg, elements: pg.elements.filter(el => el.id !== selectedId)
        }));
        setSelectedId(null);
    };

    const duplicateSelected = () => {
        if (!selectedElement) return;
        const copy = { ...selectedElement, id: Date.now().toString(), x: selectedElement.x + 20, y: selectedElement.y + 20 };
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, copy] }));
        setSelectedId(copy.id);
    };

    const rotateSelected = () => {
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : {
            ...pg, elements: pg.elements.map(el =>
                el.id === selectedId ? { ...el, rotation: ((el.rotation || 0) + 15) % 360 } : el
            )
        }));
    };

    const randX = () => 30 + Math.random() * (width - 130);
    const randY = () => 60 + Math.random() * (height * 0.5);

    const addSticker = (emoji) => {
        const el = { id: Date.now().toString(), type: 'sticker', content: emoji, x: randX(), y: randY(), rotation: Math.random() * 24 - 12 };
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, el] }));
    };

    const addQuote = (text) => {
        const el = { id: Date.now().toString(), type: 'quote', content: text, x: randX(), y: randY(), rotation: Math.random() * 6 - 3 };
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, el] }));
    };

    const addTape = () => {
        const colors = ['rgba(216,178,178,0.55)', 'rgba(178,210,185,0.55)', 'rgba(178,195,220,0.55)', 'rgba(220,206,170,0.6)'];
        const el = { id: Date.now().toString(), type: 'tape', x: randX(), y: randY(), rotation: Math.random() * 40 - 20, color: colors[Math.floor(Math.random() * colors.length)] };
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, el] }));
    };

    const addBox = (shapeId) => {
        const el = { id: Date.now().toString(), type: 'box', shape: shapeId || 'card', label: 'Note', content: '', x: randX(), y: randY() };
        setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, el] }));
        setTimeout(() => setEditingItem(el), 150);
    };

    // Drawing
    const drawingPanResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            const { locationX, locationY } = e.nativeEvent;
            livePathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
            setLivePath({ d: livePathRef.current, color: brushColorRef.current, size: brushSizeRef.current });
        },
        onPanResponderMove: (e) => {
            const { locationX, locationY } = e.nativeEvent;
            livePathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
            setLivePath(prev => prev ? { ...prev, d: livePathRef.current } : null);
        },
        onPanResponderRelease: () => {
            if (livePathRef.current) {
                const stroke = { d: livePathRef.current, color: brushColorRef.current, size: brushSizeRef.current };
                setPages(prev => prev.map((pg, i) => i !== currentPageRef.current ? pg : { ...pg, paths: [...pg.paths, stroke] }));
                livePathRef.current = '';
                setLivePath(null);
            }
        },
    })).current;

    const undoStroke = () => {
        setPages(prev => prev.map((pg, i) => i !== currentPage || pg.paths.length === 0 ? pg : { ...pg, paths: pg.paths.slice(0, -1) }));
    };

    const clearPage = () => {
        setConfirmConfig({
            visible: true,
            title: "Clear Current Page? 🧹",
            message: "This will remove all your stickers, notes, and drawings on this specific page. This action cannot be undone! ✨",
            confirmText: "Clear All",
            isDestructive: true,
            onConfirm: () => {
                setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [], paths: [] }));
                setSelectedId(null);
                setConfirmConfig(prev => ({ ...prev, visible: false }));
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(''), 1500);
            }
        });
    };

    const addNewPage = () => {
        const newPage = { id: Date.now().toString(), elements: [], paths: [] };
        setPages(prev => [...prev, newPage]);
        // Update ref immediately so handlePageChange can see it
        pagesRef.current = [...pagesRef.current, newPage];

        setTimeout(() => {
            handlePageChange(1);
        }, 50);
    };

    const deletePage = () => {
        if (pages.length <= 1) {
            setConfirmConfig({
                visible: true,
                title: "Cannot Delete 🚫",
                message: "You must have at least one page in your scrapbook.",
                confirmText: "Got it",
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setConfirmConfig({
            visible: true,
            title: "Delete Page? 🗑️",
            message: "Are you sure you want to delete this entire page? All memories on it will be lost.",
            confirmText: "Delete Page",
            isDestructive: true,
            onConfirm: () => {
                const nextPages = pages.filter((_, i) => i !== currentPage);
                setPages(nextPages);
                setCurrentPage(Math.max(0, currentPage - 1));
                setConfirmConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const startNewWork = () => {
        setConfirmConfig({
            visible: true,
            title: "Start Next Work? 🎨",
            message: "Do you want to clear this entire scrapbook (all pages) and start a fresh masterpiece? Make sure you've saved to cloud first!",
            confirmText: "Start Fresh ✨",
            isDestructive: false,
            onConfirm: () => {
                setExistingId(null);
                const freshPages = [{ id: 'page1', elements: [], paths: [] }];
                setPages(freshPages);
                pagesRef.current = freshPages;
                setCurrentPage(0);
                currentPageRef.current = 0;
                pageTranslateX.setValue(0);
                setSelectedId(null);
                setConfirmConfig(prev => ({ ...prev, visible: false }));
                setSaveStatus('saved');
                AsyncStorage.removeItem('scrapbook_pages'); // Clear cache
                setTimeout(() => setSaveStatus(''), 1500);
            }
        });
    };

    const saveToCloud = async () => {
        let currentUid = userId;
        if (currentUid === 'no-id') {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                currentUid = parsed.userId;
                setUserId(currentUid);
            } else {
                setConfirmConfig({
                    visible: true,
                    title: 'Login Required',
                    message: 'Please log in to save your scrapbook.',
                    confirmText: 'Okay',
                    onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
                });
                return;
            }
        }

        console.log('📡 Attempting cloud save for user:', currentUid);
        setSaveStatus('saving');
        try {
            const currentPageData = pages[currentPage];
            const entryData = {
                user: currentUid,
                content: `Artistic Scrapbook Page ${currentPage + 1}`,
                mood: 'Happy',
                styling: {
                    theme: 'Premium Scrapbook',
                    elements: currentPageData.elements || [],
                    paths: currentPageData.paths || []
                }
            };

            if (existingId) {
                console.log('✏️ Updating existing entry:', existingId);
                await updateEntry(existingId, entryData);
            } else {
                console.log('🆕 Creating new entry...');
                const res = await createEntry(entryData);
                if (res._id) setExistingId(res._id);
            }

            console.log('✅ Save successful!');

            setConfirmConfig({
                visible: true,
                title: 'Saved ✨',
                message: 'Your memory is safe in the cloud!',
                confirmText: 'Great!',
                onConfirm: () => {
                    setConfirmConfig(prev => ({ ...prev, visible: false }));
                    navigation.navigate('Dashboard');
                }
            });
        } catch (e) {
            console.error('❌ Cloud save error:', e);
            const msg = e.response?.data?.error || e.message || 'Check your connection';
            setConfirmConfig({
                visible: true,
                title: 'Save Failed',
                message: `Details: ${msg}`,
                confirmText: 'Retry',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setSaveStatus('');
        }
    };

    const saveToGallery = async () => {
        if (Platform.OS === 'web' || !ViewShot) {
            setConfirmConfig({
                visible: true,
                title: 'Not Supported',
                message: 'Gallery saving is available on mobile only.',
                confirmText: 'Understood',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                setConfirmConfig({
                    visible: true,
                    title: 'Permission Denied',
                    message: 'We need permission to save to your photo library.',
                    confirmText: 'Okay',
                    onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
                });
                return;
            }
            const uri = await viewShotRef.current.capture();
            await MediaLibrary.saveToLibraryAsync(uri);
            setConfirmConfig({
                visible: true,
                title: 'Saved! 📸🎨',
                message: 'The page has been saved to your photo gallery.',
                confirmText: 'Yay!',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
            });
        } catch {
            setConfirmConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to capture or save image.',
                confirmText: 'Close',
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    const Wrapper = ViewShot || View;

    return (
        <SafeAreaView style={[styles.container, isViewMode && styles.viewModeBg]}>
            <StatusBar hidden={isViewMode} />

            <Modal visible={showPageGrid} animationType="slide" transparent>
                <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(26,15,8,0.95)' }]}>
                    <SafeAreaView style={styles.pageGridContainer}>
                        <View style={styles.pageGridHeader}>
                            <Text style={styles.pageGridTitle}>Your Scrapbook Pages</Text>
                            <TouchableOpacity onPress={() => setShowPageGrid(false)}>
                                <Text style={styles.closePageGrid}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.pageGridEntries}>
                            {pages.map((pg, idx) => (
                                <View key={pg.id} style={styles.pageThumbContainer}>
                                    <TouchableOpacity
                                        style={[styles.pageThumb, currentPage === idx && styles.activePageThumb]}
                                        onPress={() => { setCurrentPage(idx); setShowPageGrid(false); }}
                                    >
                                        <Text style={styles.pageThumbDetail}>Page {idx + 1}</Text>
                                        <Text style={styles.pageThumbElements}>{pg.elements.length} items</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deletePgThumb}
                                        onPress={() => {
                                            setCurrentPage(idx);
                                            deletePage();
                                        }}
                                    >
                                        <Text style={styles.deletePgThumbIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addPageThumb} onPress={addNewPage}>
                                <Text style={styles.addPageThumbIcon}>+</Text>
                                <Text style={styles.addPageThumbText}>Add Page</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>

            <TextEditModal visible={!!editingItem} item={editingItem} onSave={saveText} onClose={() => setEditingItem(null)} />
            <QuotePickerModal visible={showQuotes} onSelect={addQuote} onClose={() => setShowQuotes(false)} />
            <TextShapePickerModal visible={showShapePicker} onSelect={(shapeId) => addBox(shapeId)} onClose={() => setShowShapePicker(false)} />
            <ConfirmModal
                visible={confirmConfig.visible}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                isDestructive={confirmConfig.isDestructive}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, visible: false }))}
            />

            {!isViewMode && (
                <View style={styles.topBar}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.iconBtn, { marginRight: 8 }]} onPress={() => navigation.goBack()}>
                            <Text style={{ fontSize: 16 }}>🔙</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowPageGrid(true)}>
                            <Text style={{ fontSize: 16 }}>📚</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Journal Studio</Text>
                    <View style={styles.topActions}>
                        {saveStatus !== '' && (
                            <Text style={styles.saveStatus}>
                                {saveStatus === 'saving' ? '⏳' : '✓ Saved'}
                            </Text>
                        )}

                        <TouchableOpacity style={[styles.saveIconBtn, { marginRight: 4 }]} onPress={clearPage}>
                            <Text style={{ fontSize: 18 }}>🧹</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveBtnUI, { backgroundColor: theme.colors.primaryPink, marginRight: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, elevation: 2 }]}
                            onPress={saveToCloud}
                            disabled={saveStatus === 'saving'}
                        >
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{saveStatus === 'saving' ? 'Saving...' : 'Save ✨'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.saveIconBtn, { marginRight: 6 }]} onPress={startNewWork}>
                            <Text style={{ fontSize: 18 }}>🆕</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveIconBtn} onPress={saveToGallery}>
                            <Text style={{ fontSize: 18 }}>📸</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.viewBtn} onPress={() => setIsViewMode(true)}>
                            <Text style={styles.viewBtnText}>Preview ▶</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isViewMode && (
                <TouchableOpacity style={styles.exitViewBtn} onPress={() => setIsViewMode(false)}>
                    <Text style={styles.exitViewText}>✎ Edit</Text>
                </TouchableOpacity>
            )}

            <Wrapper ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }} style={{ flex: 1 }}>
                <Animated.View style={[styles.canvas, { transform: [{ translateX: pageTranslateX }] }]}>
                    <View style={styles.rulingContainer} pointerEvents="none">
                        {Array(24).fill(0).map((_, i) => <View key={i} style={styles.ruledLine} />)}
                    </View>
                    <View style={styles.margin} pointerEvents="none" />

                    <View style={StyleSheet.absoluteFill} pointerEvents={currentTool === 'doodle' ? 'none' : 'box-none'}>
                        {pages[currentPage] && pages[currentPage].elements.map(el => (
                            <ScrapbookElement
                                key={el.id} item={el}
                                isSelected={selectedId === el.id}
                                onSelect={setSelectedId} onUpdate={updateElement}
                                isViewMode={isViewMode} currentTool={currentTool} onOpenEdit={setEditingItem}
                            />
                        ))}
                    </View>

                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        {pages[currentPage] && pages[currentPage].paths.map((p, i) => (
                            <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        ))}
                        {livePath && (
                            <Path d={livePath.d} stroke={livePath.color} strokeWidth={livePath.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </Svg>

                    {currentTool === 'doodle' && !isViewMode && (
                        <View style={StyleSheet.absoluteFill} {...drawingPanResponder.panHandlers} />
                    )}
                </Animated.View>
            </Wrapper>

            {!isViewMode && (
                <View style={styles.bottomSection}>
                    {/* Page nav */}
                    <View style={styles.pageNav}>
                        <TouchableOpacity onPress={() => handlePageChange(-1)} disabled={currentPage === 0}>
                            <Text style={[styles.navBtn, currentPage === 0 && styles.disabled]}>◀ Prev</Text>
                        </TouchableOpacity>

                        <View style={styles.pageCenter}>
                            <Text style={styles.pageIndicator}>Pg {currentPage + 1} / {pages.length}</Text>
                            <TouchableOpacity onPress={deletePage} style={styles.deletePgBtn}>
                                <Text style={{ fontSize: 12 }}>🗑️</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => currentPage === pages.length - 1
                            ? addNewPage()
                            : handlePageChange(1)}>
                            <Text style={styles.navBtn}>{currentPage === pages.length - 1 ? '+ New ▶' : 'Next ▶'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selection bar */}
                    <SelectionBar
                        visible={!!selectedId && currentTool === 'move'}
                        onDeselect={() => setSelectedId(null)}
                        onDelete={deleteSelected}
                        onDuplicate={duplicateSelected}
                        onRotate={rotateSelected}
                    />

                    {/* Brush panel */}
                    {currentTool === 'doodle' && (
                        <View style={styles.brushPanel}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brushRow}>
                                {BRUSH_COLORS.map(c => (
                                    <TouchableOpacity key={c} onPress={() => setBrushColor(c)}
                                        style={[styles.colorDot, { backgroundColor: c, transform: [{ scale: c === brushColor ? 1.35 : 1 }], borderWidth: c === brushColor ? 2.5 : 1 }]} />
                                ))}
                                <View style={styles.brushDivider} />
                                {BRUSH_SIZES.map(sz => (
                                    <TouchableOpacity key={sz} style={[styles.sizeBtn, brushSize === sz && styles.sizeBtnActive]} onPress={() => setBrushSize(sz)}>
                                        <View style={{ width: sz * 2.5, height: sz * 2.5, borderRadius: sz * 2.5, backgroundColor: brushColor }} />
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={styles.undoBtn} onPress={undoStroke}>
                                    <Text style={styles.undoBtnText}>↩ Undo</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    )}

                    {/* Sticker library panel */}
                    {showLibrary && (
                        <View style={styles.libraryPanel}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabsRow}>
                                {Object.keys(STICKER_CATEGORIES).map(cat => (
                                    <TouchableOpacity key={cat} style={[styles.catTab, activeLibTab === cat && styles.catTabActive]} onPress={() => setActiveLibTab(cat)}>
                                        <Text style={[styles.catTabText, activeLibTab === cat && styles.catTabTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerGrid}>
                                {STICKER_CATEGORIES[activeLibTab].map((s, idx) => (
                                    <TouchableOpacity key={idx} style={styles.libStickerBtn}
                                        onPress={() => { addSticker(s); setShowLibrary(false); }}>
                                        <Text style={styles.libSticker}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Toolbar */}
                    <View style={styles.footer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolBar}>
                            <TouchableOpacity style={[styles.tool, currentTool === 'move' && styles.toolActive]} onPress={() => { setCurrentTool('move'); setShowLibrary(false); }}>
                                <Text style={styles.toolEmoji}>🖐️</Text><Text style={styles.toolText}>Move</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tool, currentTool === 'doodle' && styles.toolActive]} onPress={() => { setCurrentTool('doodle'); setShowLibrary(false); setSelectedId(null); }}>
                                <Text style={styles.toolEmoji}>🖋️</Text><Text style={styles.toolText}>Draw</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tool} onPress={() => { setShowShapePicker(true); setShowLibrary(false); }}>
                                <Text style={styles.toolEmoji}>📝</Text><Text style={styles.toolText}>Text</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tool, showQuotes && styles.toolActive]} onPress={() => { setShowQuotes(true); setShowLibrary(false); }}>
                                <Text style={styles.toolEmoji}>💬</Text><Text style={styles.toolText}>Quotes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tool} onPress={addTape}>
                                <Text style={styles.toolEmoji}>🩹</Text><Text style={styles.toolText}>Tape</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tool} onPress={async () => {
                                let r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1] });
                                if (!r.canceled) {
                                    const el = { id: Date.now().toString(), type: 'polaroid', content: r.assets[0].uri, x: randX(), y: randY(), rotation: Math.random() * 8 - 4 };
                                    setPages(prev => prev.map((pg, i) => i !== currentPage ? pg : { ...pg, elements: [...pg.elements, el] }));
                                }
                            }}>
                                <Text style={styles.toolEmoji}>📸</Text><Text style={styles.toolText}>Photo</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={[styles.tool, showLibrary && styles.toolActive]} onPress={() => { setShowLibrary(v => !v); setCurrentTool('move'); }}>
                                <Text style={styles.toolEmoji}>🪄</Text><Text style={styles.toolText}>Library</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5EDD1' },
    viewModeBg: { backgroundColor: '#1A0F08' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, alignItems: 'center' },
    iconBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 14,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 }
        })
    },
    topActions: { flexDirection: 'row', alignItems: 'center' },
    saveIconBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        marginRight: 8,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 }
        })
    },
    viewBtn: { backgroundColor: '#8D6E63', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    viewBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#5D4037', fontStyle: 'italic' },

    canvas: {
        flex: 1,
        marginHorizontal: 10,
        marginBottom: 4,
        backgroundColor: '#FFFDF4',
        borderRadius: 6,
        overflow: 'hidden',
        elevation: 12,
        borderWidth: 1,
        borderColor: '#E8DCC8',
        ...Platform.select({
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 }
        })
    },

    // Popup Styles
    premiumPopup: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '85%',
        alignItems: 'center',
        elevation: 20,
        ...Platform.select({
            web: { boxShadow: '0px 15px 40px rgba(0,0,0,0.2)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 }
        })
    },
    popupHeader: { marginBottom: 16 },
    popupTitle: { fontSize: 20, fontWeight: '900', color: '#5D4037', textAlign: 'center' },
    popupMessage: { fontSize: 15, color: '#8D6E63', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    popupActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    popupCancel: { flex: 1, paddingVertical: 14, marginRight: 10, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center' },
    popupCancelText: { color: '#8D6E63', fontWeight: '700' },
    popupConfirm: { flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: '#8D6E63', alignItems: 'center' },
    popupConfirmText: { color: '#fff', fontWeight: '800' },
    destructiveConfirm: { backgroundColor: '#FF7096' },

    pageCenter: { alignItems: 'center', flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    deletePgBtn: { marginLeft: 8, padding: 4 },

    pageGridContainer: { flex: 1, width: '100%', padding: 20 },
    pageGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    pageGridTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    closePageGrid: { color: '#FF7096', fontSize: 18, fontWeight: '700' },
    pageGridEntries: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    pageThumbContainer: { margin: 10, alignItems: 'center' },
    pageThumb: { width: 140, height: 180, backgroundColor: '#FFFDF4', borderRadius: 12, padding: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    activePageThumb: { borderWidth: 3, borderColor: '#FF7096' },
    pageThumbDetail: { fontWeight: '800', fontSize: 16, color: '#5D4037' },
    pageThumbElements: { fontSize: 12, color: '#BCAAA4', marginTop: 4 },
    deletePgThumb: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12, padding: 6, elevation: 6 },
    deletePgThumbIcon: { fontSize: 14 },
    addPageThumb: { width: 140, height: 180, borderStyle: 'dashed', borderWidth: 2, borderColor: '#fff', borderRadius: 12, margin: 10, justifyContent: 'center', alignItems: 'center' },
    addPageThumbIcon: { color: '#fff', fontSize: 40, fontWeight: '300' },
    addPageThumbText: { color: '#fff', fontSize: 14, marginTop: 8 },
    rulingContainer: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 55, paddingTop: 50 },
    ruledLine: { height: 1, backgroundColor: 'rgba(141,110,99,0.07)', marginBottom: 28 },
    margin: { position: 'absolute', left: 46, top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(210,100,100,0.1)' },
    element: { position: 'absolute' },
    selectedRing: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderWidth: 1.5, borderColor: '#8D6E63', borderStyle: 'dashed', borderRadius: 6 },

    tape: { opacity: 0.7, borderRadius: 2 },
    polaroidFrame: {
        backgroundColor: '#fff',
        padding: 8,
        paddingBottom: 30,
        elevation: 6,
        ...Platform.select({
            web: { boxShadow: '0px 5px 15px rgba(0,0,0,0.12)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 10 }
        })
    },
    polaroidInner: { width: 130, height: 130, backgroundColor: '#eee' },
    polaroidImage: { width: '100%', height: '100%' },
    polaroidCaption: { position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontStyle: 'italic', color: '#8D6E63', fontSize: 12 },

    boxLabel: { fontSize: 10, fontWeight: '900', color: '#8D6E63', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    quoteBox: { padding: 14, maxWidth: 240, borderRadius: 5, borderLeftWidth: 3, borderLeftColor: '#8D6E63' },
    quoteBoxText: { fontSize: 16, color: '#4E342E', fontFamily: IS_IOS ? 'Palatino' : 'serif', fontStyle: 'italic', lineHeight: 24 },
    placeholder: { color: '#BCAAA4', fontStyle: 'italic' },

    // Shape Picker Modal
    shapePickerModal: { backgroundColor: '#FFFDF4', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: height * 0.6 },
    shapePickerTitle: { fontSize: 18, fontWeight: '900', color: '#5D4037', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
    shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 20 },
    shapeOption: { width: '48%', marginBottom: 16, alignItems: 'center' },
    shapePreview: { width: '100%', minHeight: 60, justifyContent: 'center' },
    shapePreviewText: { color: '#5D4037', fontFamily: IS_IOS ? 'Palatino' : 'serif', fontSize: 16 },
    shapeLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#8D6E63' },

    // Selection bar
    selectionBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3E2723', marginHorizontal: 10, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4 },
    selAction: { alignItems: 'center', paddingHorizontal: 12 },
    selDelete: { marginLeft: 'auto' },
    selActionEmoji: { fontSize: 18 },
    selActionText: { fontSize: 10, fontWeight: '700', color: '#FFCCBC', marginTop: 2 },
    selDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

    // Modals
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModal: { backgroundColor: '#FFFDF4', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 360 },
    quoteModal: { backgroundColor: '#FFFDF4', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: height * 0.65 },
    editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    editModalTitle: { fontSize: 18, fontWeight: '900', color: '#5D4037', fontStyle: 'italic' },
    modalCancel: { fontSize: 15, color: '#BCAAA4', fontWeight: '600' },
    modalDone: { fontSize: 15, color: '#8D6E63', fontWeight: '900' },
    editModalInput: { flex: 1, fontSize: 20, color: '#3E2723', fontFamily: IS_IOS ? 'Palatino' : 'serif', lineHeight: 32, textAlignVertical: 'top', minHeight: 250 },
    quoteList: { padding: 10 },
    quoteItem: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 }
        })
    },
    quoteText: { fontSize: 16, color: '#4E342E', fontFamily: IS_IOS ? 'Palatino' : 'serif', fontStyle: 'italic', lineHeight: 24 },

    bottomSection: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        elevation: 30,
        paddingTop: 4,
        ...Platform.select({
            web: { boxShadow: '0px -10px 30px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 }
        })
    },
    pageNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
    navBtn: { fontSize: 13, fontWeight: '800', color: '#8D6E63' },
    pageIndicator: { fontSize: 11, color: '#BCAAA4', letterSpacing: 1 },

    brushPanel: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FEF9F0', borderTopWidth: 1, borderTopColor: '#F0E6D0' },
    brushRow: { alignItems: 'center', paddingHorizontal: 5 },
    colorDot: { width: 28, height: 28, borderRadius: 14, marginRight: 8, borderColor: '#8D6E63' },
    brushDivider: { width: 1, height: 28, backgroundColor: '#ddd', marginHorizontal: 10 },
    sizeBtn: { padding: 6, borderRadius: 20, marginRight: 6, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
    sizeBtnActive: { backgroundColor: '#FDF5E6', borderWidth: 1.5, borderColor: '#8D6E63' },
    undoBtn: { marginLeft: 12, backgroundColor: '#EFEBE9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    undoBtnText: { fontSize: 12, fontWeight: '700', color: '#8D6E63' },

    libraryPanel: { backgroundColor: '#FEF9F0', borderTopWidth: 1, borderTopColor: '#F0E6D0', paddingBottom: 4 },
    catTabsRow: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F0E6D0' },
    catTab: { paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, borderRadius: 20, backgroundColor: '#F5EDD1' },
    catTabActive: { backgroundColor: '#8D6E63' },
    catTabText: { fontSize: 11, fontWeight: '700', color: '#8D6E63' },
    catTabTextActive: { color: '#fff' },
    stickerGrid: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
    libStickerBtn: {
        padding: 8,
        marginHorizontal: 4,
        backgroundColor: '#fff',
        borderRadius: 14,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 }
        })
    },
    libSticker: { fontSize: 30 },

    footer: { paddingHorizontal: 10, paddingBottom: 18, paddingTop: 4 },
    toolBar: { alignItems: 'center', paddingHorizontal: 5 },
    tool: { alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, marginRight: 5 },
    toolActive: { backgroundColor: '#FDF5E6', borderRadius: 12, borderWidth: 1.5, borderColor: '#8D6E63' },
    toolEmoji: { fontSize: 22 },
    toolText: { fontSize: 9, fontWeight: '700', color: '#8D6E63', marginTop: 2 },
    divider: { width: 1, height: 30, backgroundColor: '#eee', marginHorizontal: 8 },

    exitViewBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 10,
        ...Platform.select({
            web: { boxShadow: '0px 5px 20px rgba(0,0,0,0.2)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 15 }
        })
    },
    exitViewText: { fontWeight: '900', color: '#5D4037', fontSize: 13 },
    disabled: { opacity: 0.3 },
});
