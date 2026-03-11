import React from 'react';
import { Modal, View, FlatList, TouchableOpacity, Image, StyleSheet, Text, Platform } from 'react-native';
import { stickers } from '../constants/stickers';

export default function StickerPicker({ visible, onClose, onSelectSticker }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.stickerItem}
            onPress={() => {
                onSelectSticker(item);
                onClose();
            }}
        >
            <Image source={item.src} style={styles.stickerImage} resizeMode="contain" />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Select a Sticker</Text>
                    <FlatList
                        data={stickers}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.listContent}
                    />
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 5,
        ...Platform.select({
            web: { boxShadow: '0px 5px 15px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
        color: '#333',
    },
    listContent: {
        alignItems: 'center',
    },
    stickerItem: {
        margin: 8,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        elevation: 2,
        ...Platform.select({
            web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 }
        })
    },
    stickerImage: {
        width: 70,
        height: 70,
    },
    closeBtn: {
        marginTop: 12,
        paddingVertical: 8,
        backgroundColor: '#FF7096',
        borderRadius: 6,
    },
    closeText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
});
