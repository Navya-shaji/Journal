import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
    Modal,
    Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/Theme';
import { Alert } from 'react-native';
import { getEntries, deleteEntry, updateEntry } from '../services/journalService';

export default function DashboardScreen({ navigation, route }) {
    const [username, setUsername] = useState(route.params?.username || 'Dreamer');
    const [userId, setUserId] = useState(route.params?.userId || 'no-id');
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [confirmModal, setConfirmModal] = useState({ visible: false, id: null, title: '', message: '' });

    useEffect(() => {
        const loadSession = async () => {
            if (userId === 'no-id') {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUsername(parsed.username);
                    setUserId(parsed.userId);
                    setDebugInfo(`Session Loaded: ${parsed.userId}`);
                } else {
                    setDebugInfo('No session found in storage');
                }
            } else {
                setDebugInfo(`Params Received: ${userId}`);
            }
        };
        loadSession();
    }, []);

    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const [viewItem, setViewItem] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);

    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);

    const fetchEntries = async (pageNum = 1, shouldRefresh = false) => {
        try {
            if (userId === 'no-id') return;
            if (pageNum > 1) setLoadingMore(true);

            const data = await getEntries(userId, pageNum, 10);

            if (!data || !data.entries) {
                setHasMore(false);
                return;
            }

            if (shouldRefresh || pageNum === 1) {
                setEntries(data.entries || []);
            } else {
                setEntries(prev => [...(prev || []), ...(data.entries || [])]);
            }

            if (data.entries?.length > 0) {
                setDebugInfo(`Loaded ${data.entries.length} memories`);
            } else if (pageNum === 1) {
                setDebugInfo('No memories found in cloud');
            }

            setHasMore(data.currentPage < data.totalPages);
            setPage(data.currentPage);
        } catch (error) {
            setDebugInfo(`Error: ${error.message || 'Fetch failed'}`);
            if (pageNum === 1) {
                Alert.alert('Connection Issue', 'Could not sync with cloud. Check your internet.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId !== 'no-id') {
                setActiveFilter('All');
                fetchEntries(1, true);
            }
        }, [userId])
    );

    useEffect(() => {
        let result = entries;

        if (activeFilter === 'Journals') {
            result = result.filter(entry => entry.styling?.theme !== 'Premium Scrapbook');
        } else if (activeFilter === 'Scrapbooks') {
            result = result.filter(entry => entry.styling?.theme === 'Premium Scrapbook');
        }

        if (searchQuery.trim() !== '') {
            result = result.filter(entry =>
                entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (entry.mood && entry.mood.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredEntries(result);
    }, [searchQuery, entries, activeFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEntries(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchEntries(page + 1);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            visible: true,
            id,
            title: 'Delete Memory?',
            message: 'This will permanently remove this memory from your journal. Are you sure?'
        });
    };

    const confirmDelete = async () => {
        const id = confirmModal.id;
        try {
            await deleteEntry(id);
            setEntries(prev => prev.filter(e => e._id !== id));
            setFilteredEntries(prev => prev.filter(e => e._id !== id));
            setConfirmModal({ visible: false, id: null, title: '', message: '' });
        } catch (e) {
            Alert.alert('Error', 'Could not delete entry');
            setConfirmModal({ visible: false, id: null, title: '', message: '' });
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) {
            Alert.alert('Error', 'Content cannot be empty');
            return;
        }
        try {
            const updated = await updateEntry(editingId, { content: editContent });
            setEntries(prev => (prev || []).map(e => e._id === editingId ? { ...e, content: updated.content } : e));
            setFilteredEntries(prev => (prev || []).map(e => e._id === editingId ? { ...e, content: updated.content } : e));
            setIsEditModalVisible(false);
            setEditingId(null);
            setEditContent('');
        } catch (e) {
            Alert.alert('Error', 'Could not update entry');
        }
    };

    const openEditModal = (item) => {
        setEditingId(item._id);
        setEditContent(item.content);
        setIsEditModalVisible(true);
    };

    const renderEntry = ({ item }) => {
        const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return (
            <TouchableOpacity
                style={styles.entryCard}
                onPress={() => {
                    if (item.styling?.theme === 'Premium Scrapbook') {
                        navigation.navigate('PremiumScrapbook', { entryId: item._id });
                    } else {
                        setViewItem(item);
                        setIsViewModalVisible(true);
                    }
                }}
            >
                <View style={styles.entryHeader}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateLabel}>{formattedDate}</Text>
                    </View>
                    <View style={[
                        styles.moodBadge,
                        { backgroundColor: item.mood === 'Happy' ? theme.colors.primaryPink : (item.mood === 'Sad' ? '#ADD8E6' : theme.colors.softLavender) }
                    ]}>
                        <Text style={styles.moodLabel}>{item.mood}</Text>
                    </View>
                </View>
                <Text style={styles.scrapbookTag}>
                    {item.styling?.theme === 'Premium Scrapbook' ? 'Artistic Scrapbook Entry' : 'Journal Entry'}
                </Text>
                <Text style={[styles.entryPreview, { fontStyle: 'italic', color: '#BCAAA4', fontSize: 13, marginTop: 4 }]}>
                    Tap to unlock this memory...
                </Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => item.styling?.theme === 'Premium Scrapbook'
                            ? navigation.navigate('PremiumScrapbook', { entryId: item._id })
                            : openEditModal(item)}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                        <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.circle, { top: -40, right: -30, backgroundColor: theme.colors.primaryPink, width: 150, height: 150 }]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={styles.greeting}>Hello, {username}</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={[styles.actionIcon, { backgroundColor: '#FFF0F5', marginRight: 10 }]}
                                onPress={() => navigation.navigate('PremiumScrapbook', { userId })}
                            >
                                <Text style={{ fontSize: 18 }}>Studio</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionIcon}
                                onPress={() => navigation.navigate('Profile')}
                            >
                                <Text style={{ fontSize: 20 }}>Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.dateText}>Your journey so far...</Text>
                    {__DEV__ && (
                        <Text style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>
                            Debug: {debugInfo} | Entries: {entries.length}
                        </Text>
                    )}
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search your memories..."
                        placeholderTextColor="#C4A9B1"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterContainer}>
                    {['All', 'Journals', 'Scrapbooks'].map((cat) => {
                        const count = cat === 'All'
                            ? entries.length
                            : (cat === 'Journals'
                                ? entries.filter(e => e.styling?.theme !== 'Premium Scrapbook').length
                                : entries.filter(e => e.styling?.theme === 'Premium Scrapbook').length);

                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.filterChip,
                                    activeFilter === cat && styles.filterChipActive
                                ]}
                                onPress={() => setActiveFilter(cat)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    activeFilter === cat && styles.filterTextActive
                                ]}>
                                    {cat} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={theme.colors.buttonPink} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredEntries}
                        keyExtractor={(item) => item._id}
                        renderItem={renderEntry}
                        contentContainerStyle={styles.listContent}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListFooterComponent={() => (
                            loadingMore ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator color={theme.colors.buttonPink} />
                                </View>
                            ) : hasMore ? (
                                <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                                    <Text style={styles.loadMoreText}>Load older memories...</Text>
                                </TouchableOpacity>
                            ) : null
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {searchQuery ? 'No matches found' : `No ${activeFilter.toLowerCase()} yet`}
                                </Text>
                                <Text style={styles.emptySubtext}>
                                    {activeFilter !== 'All' && entries.length > 0
                                        ? `You have memories in other categories! Try tapping the "All" or "${activeFilter === 'Scrapbooks' ? 'Journals' : 'Scrapbooks'}" tab.`
                                        : (entries.length === 0
                                            ? "Start writing your story by tapping the + button below."
                                            : "Try a different search word.")
                                    }
                                </Text>
                            </View>
                        }
                    />
                )}

                <Modal
                    visible={isViewModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setIsViewModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '70%', padding: 30 }]}>
                            <View style={styles.entryHeader}>
                                <Text style={styles.modalTitle}>Opened Memory</Text>
                                <View style={[styles.moodBadge, { backgroundColor: theme.colors.primaryPink }]}>
                                    <Text style={styles.moodLabel}>{viewItem?.mood}</Text>
                                </View>
                            </View>

                            <FlatList
                                data={[viewItem?.content]}
                                keyExtractor={(it, idx) => idx.toString()}
                                renderItem={({ item }) => (
                                    <Text style={{
                                        fontSize: 18,
                                        lineHeight: 28,
                                        color: '#3E2723',
                                        fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'
                                    }}>
                                        {item}
                                    </Text>
                                )}
                            />

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn, { marginTop: 20, alignSelf: 'center', width: '100%' }]}
                                onPress={() => setIsViewModalVisible(false)}
                            >
                                <Text style={styles.saveBtnText}>Close Journal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isSelectionModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsSelectionModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { padding: 30 }]}>
                            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 25 }]}>
                                What would you like to create?
                            </Text>

                            <TouchableOpacity
                                style={[styles.selectionBtn, { backgroundColor: '#FDFCF0', borderColor: '#E8DCC8' }]}
                                onPress={() => {
                                    setIsSelectionModalVisible(false);
                                    navigation.navigate('AddEntry', { userId });
                                }}
                            >
                                <Text style={styles.selectionBtnTitle}>Classic Journal</Text>
                                <Text style={styles.selectionBtnSub}>Write your thoughts on paper</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.selectionBtn, { backgroundColor: '#FFF9FB', borderColor: '#F0E0E5', marginTop: 15 }]}
                                onPress={() => {
                                    setIsSelectionModalVisible(false);
                                    navigation.navigate('PremiumScrapbook', { userId });
                                }}
                            >
                                <Text style={[styles.selectionBtnTitle, { color: '#D88A9F' }]}>Artistic Scrapbook</Text>
                                <Text style={styles.selectionBtnSub}>Stickers, quotes, and memories</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ marginTop: 25, alignSelf: 'center' }}
                                onPress={() => setIsSelectionModalVisible(false)}
                            >
                                <Text style={{ color: '#BCAAA4', fontWeight: '700' }}>Maybe later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isEditModalVisible}
                    animationType="slide"
                    transparent={true}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Memory</Text>
                            <TextInput
                                style={styles.modalInput}
                                multiline
                                value={editContent}
                                onChangeText={setEditContent}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => setIsEditModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.saveBtn]}
                                    onPress={handleUpdate}
                                >
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal visible={confirmModal.visible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { alignItems: 'center', padding: 30 }]}>
                            <Text style={[styles.modalTitle, { fontSize: 24, marginBottom: 12 }]}>{confirmModal.title}</Text>
                            <Text style={{ textAlign: 'center', color: '#8D6E63', marginBottom: 25, fontSize: 16 }}>{confirmModal.message}</Text>
                            <View style={{ flexDirection: 'row', width: '100%' }}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { flex: 1, backgroundColor: '#F5F5F5', marginLeft: 0 }]}
                                    onPress={() => setConfirmModal({ visible: false, id: null, title: '', message: '' })}
                                >
                                    <Text style={{ color: '#8D6E63', textAlign: 'center', fontWeight: '700' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { flex: 1, backgroundColor: '#FF7096' }]}
                                    onPress={confirmDelete}
                                >
                                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '800' }}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsSelectionModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, paddingHorizontal: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerActions: { flexDirection: 'row' },
    actionIcon: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOpacity: 0.05 }
        })
    },
    searchContainer: { marginBottom: 15 },
    searchBar: {
        backgroundColor: theme.colors.cardWhite,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
        elevation: 3,
        ...Platform.select({
            web: { boxShadow: '0px 3px 6px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6 }
        })
    },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    circle: { position: 'absolute', borderRadius: 75, opacity: 0.2 },
    header: { marginTop: 60, marginBottom: 16 },
    greeting: { fontSize: 26, fontWeight: '800', color: theme.colors.text },
    dateText: { fontSize: 14, color: theme.colors.subText, marginTop: 4 },
    listContent: { paddingBottom: 100 },
    entryCard: {
        backgroundColor: theme.colors.cardWhite,
        borderRadius: theme.borderRadius.xl,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }
        })
    },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    editBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.colors.softLavender, borderRadius: 8, marginRight: 8 },
    editBtnText: { color: theme.colors.text, fontWeight: '600' },
    deleteBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FFEDF1', borderRadius: 8 },
    deleteBtnText: { color: '#FF7096', fontWeight: '600' },
    loadMoreBtn: { padding: 15, alignItems: 'center', marginBottom: 20 },
    loadMoreText: { color: theme.colors.buttonPink, fontWeight: '700', fontSize: 14 },
    scrapbookTag: { marginTop: 8, color: '#D88A9F', fontWeight: '700', fontSize: 13, fontStyle: 'italic' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 10,
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }
        })
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
    modalInput: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 16, minHeight: 120, textAlignVertical: 'top', fontSize: 16, color: theme.colors.text },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    modalBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginLeft: 10 },
    cancelBtn: { backgroundColor: '#F0F0F0' },
    saveBtn: { backgroundColor: theme.colors.buttonPink },
    cancelBtnText: { color: '#666', fontWeight: '700' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    dateBadge: { backgroundColor: '#F3F5F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dateLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E8E' },
    moodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    moodLabel: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
    entryPreview: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    emptySubtext: { fontSize: 12, color: theme.colors.subText, marginTop: 4 },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        backgroundColor: theme.colors.buttonPink,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        ...Platform.select({
            web: { boxShadow: '0px 8px 16px rgba(255, 112, 150, 0.3)' },
            default: { shadowColor: theme.colors.buttonPink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10 }
        })
    },
    fabText: { color: '#fff', fontSize: 32, fontWeight: '300' },
    selectionBtn: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' }
        })
    },
    selectionBtnTitle: { fontSize: 18, fontWeight: '800', color: '#5D4037' },
    selectionBtnSub: { fontSize: 12, color: '#BCAAA4', marginTop: 4 },
    filterContainer: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 2 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }
        })
    },
    filterChipActive: {
        backgroundColor: theme.colors.primaryPink,
        borderColor: theme.colors.primaryPink,
    },
    filterText: {
        color: '#8E8E8E',
        fontWeight: '700',
        fontSize: 13
    },
    filterTextActive: {
        color: '#fff'
    },
});
