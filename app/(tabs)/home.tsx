
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import useRouter
import React, { useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConnectionCard from '../../components/ConnectionCard';
import { Connection, useConnections } from '../../context/ConnectionsContext';

export default function HomeScreen() {
    const router = useRouter(); // Initialize router
    const { connections, addConnection, deleteConnection, updateConnection } = useConnections();
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

    // Delete Confirmation State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);

    const toggleSelection = (id: string) => {
        if (selectedConnectionId === id) {
            setSelectedConnectionId(null);
        } else {
            setSelectedConnectionId(id);
        }
    };

    const handleOpenFile = (item: any) => {
        router.push({
            pathname: '/connection/[id]',
            params: {
                id: item.id,
                name: item.name,
                tag: item.tag,
                zodiac: item.zodiac,
                icon: item.icon
            }
        });
    };

    const handleArchive = (id: string, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        updateConnection(id, { status: newStatus });
        // Optional: Clear selection if archiving/unarchiving selected
        if (selectedConnectionId === id) setSelectedConnectionId(null);
    };

    const promptDelete = (connection: Connection) => {
        setConnectionToDelete(connection);
        setDeleteModalVisible(true);
    };

    const confirmDelete = () => {
        if (connectionToDelete) {
            deleteConnection(connectionToDelete.id);
            setDeleteModalVisible(false);
            setConnectionToDelete(null);
            if (selectedConnectionId === connectionToDelete.id) setSelectedConnectionId(null);
        }
    };

    const displayedConnections = connections.filter(c => c.status === activeTab);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandTitle}>Signal</Text>
                    </View>
                </View>

                {/* Toggle Section */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, activeTab === 'active' && styles.toggleButtonActive]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'active' && styles.toggleTextActive]}>ACTIVE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, activeTab === 'archived' && styles.toggleButtonActive]}
                        onPress={() => setActiveTab('archived')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'archived' && styles.toggleTextActive]}>ARCHIVED</Text>
                    </TouchableOpacity>
                </View>

                {/* Page Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>{activeTab === 'active' ? 'Active Connections' : 'Archived Connections'}</Text>
                    <Text style={styles.sectionLabel}>YOUR INDEX</Text>
                </View>

                {/* Connection Cards */}
                <View style={styles.cardsList}>
                    {displayedConnections.length === 0 ? (
                        <Text style={styles.emptyText}>No {activeTab} connections.</Text>
                    ) : (
                        displayedConnections.map((item) => (
                            <ConnectionCard
                                key={item.id}
                                id={item.id}
                                name={item.name}
                                tag={item.tag}
                                zodiac={item.zodiac}
                                lastActive={item.lastActive}
                                icon={item.icon}
                                isSelected={selectedConnectionId === item.id}
                                status={item.status}
                                onPress={() => handleOpenFile(item)}
                                onOpenFile={() => handleOpenFile(item)}
                                onDelete={() => promptDelete(item)}
                                onDownload={() => handleArchive(item.id, item.status)}
                            />
                        ))
                    )}
                </View>

                {/* Add Connection Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.8}
                    onPress={() => router.push('/add-connection')}
                >
                    <Text style={styles.addButtonText}>ADD CONNECTION</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setDeleteModalVisible(false)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color="#1C1C1E" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Are we done with them?</Text>
                        <Text style={styles.modalSubtitle}>
                            This action cannot be undone. This profile will be permanently deleted from your signal history.
                        </Text>

                        {connectionToDelete && (
                            <View style={styles.deleteTargetContainer}>
                                <Text style={styles.deleteTargetName}>{connectionToDelete.name}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                            <Text style={styles.deleteConfirmText}>DELETE PROFILE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 0,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    brandTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 4,
        alignSelf: 'flex-start',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    toggleButtonActive: {
        backgroundColor: '#1C1C1E',
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    titleSection: {
        marginBottom: 24,
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    cardsList: {
        flexDirection: 'column',
        marginBottom: 32,
    },
    emptyText: {
        fontSize: 14,
        color: '#8E8E93',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    addButton: {
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 1,
    },
    modalTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 28,
        color: '#1C1C1E',
        marginBottom: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    deleteTargetContainer: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 32,
    },
    deleteTargetName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    deleteConfirmButton: {
        backgroundColor: '#1C1C1E',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    deleteConfirmText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});
