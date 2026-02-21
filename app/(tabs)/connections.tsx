
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConnectionCard from '../../components/ConnectionCard';
import { Connection, useConnections } from '../../context/ConnectionsContext';
import { fontSize as fs, scale, verticalScale } from '../../utils/responsive';

export default function ConnectionsScreen() {
    const router = useRouter();
    const { connections, addConnection, deleteConnection, updateConnection, theme, setTheme } = useConnections();
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);


    // Sync global theme with tab selection
    React.useEffect(() => {
        setTheme(activeTab === 'archived' ? 'dark' : 'light');
        return () => setTheme('light');
    }, [activeTab]);

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
        // Now opens the Relationship Hub (Overview) instead of tools directly
        router.push({
            pathname: '/connection/[id]',
            params: {
                id: item.id,
                name: item.name,
                tag: item.tag,
                zodiac: item.zodiac,
                icon: item.icon,
                tab: 'OVERVIEW'
            }
        });
    };

    const handleArchive = (id: string, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        updateConnection(id, { status: newStatus });
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
    const isDark = theme === 'dark';

    return (
        <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#1C1C1E" : "#FFFFFF"} />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* Header Section: Title Left, Toggle Right */}
                <View style={[styles.headerRow, isDark && { backgroundColor: '#1C1C1E' }]}>
                    <View style={styles.titleSection}>
                        <Text style={[styles.pageTitle, isDark && styles.textDark]}>
                            {activeTab === 'active' ? 'Active' : 'Archived'} Connections
                        </Text>
                        <Text style={styles.sectionLabel}>YOUR INDEX</Text>
                    </View>

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                activeTab === 'active' ? styles.toggleButtonActive : styles.toggleButtonInactive
                            ]}
                            onPress={() => setActiveTab('active')}
                        >
                            <Text style={[
                                styles.toggleText,
                                activeTab === 'active' ? styles.toggleTextActive : styles.toggleTextInactive
                            ]}>ACTIVE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                activeTab === 'archived' ? styles.toggleButtonActive : styles.toggleButtonInactive
                            ]}
                            onPress={() => setActiveTab('archived')}
                        >
                            <Text style={[
                                styles.toggleText,
                                activeTab === 'archived' ? styles.toggleTextActive : styles.toggleTextInactive
                            ]}>ARCHIVED</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subtle Divider */}
                <View style={styles.headerDivider} />

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
                {activeTab === 'active' && (
                    <TouchableOpacity
                        style={[styles.addButton, isDark && styles.addButtonDark]}
                        activeOpacity={0.8}
                        onPress={() => router.push('/add-connection')}
                    >
                        <Text style={[styles.addButtonText, isDark && styles.addButtonTextDark]}>ADD CONNECTION</Text>
                    </TouchableOpacity>
                )}

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
                    <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setDeleteModalVisible(false)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#1C1C1E"} />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>Are we done with them?</Text>
                        <Text style={styles.modalSubtitle}>
                            This action cannot be undone. This profile will be permanently deleted from your signal history.
                        </Text>

                        {connectionToDelete && (
                            <View style={[styles.deleteTargetContainer, isDark && styles.deleteTargetContainerDark]}>
                                <Text style={[styles.deleteTargetName, isDark && styles.textDark]}>{connectionToDelete.name}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.deleteConfirmButton, isDark && styles.deleteConfirmButtonDark]} onPress={confirmDelete}>
                            <Text style={styles.deleteConfirmText}>DELETE PROFILE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    safeAreaDark: {
        backgroundColor: '#1C1C1E',
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginTop: verticalScale(20),
        marginBottom: verticalScale(24),
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    titleSection: {
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: scale(20),
        padding: scale(2),
        marginTop: verticalScale(24),
        alignSelf: 'flex-start',
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 18,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#000000',
    },
    toggleButtonInactive: {
        backgroundColor: 'transparent',
    },
    toggleText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    toggleTextInactive: {
        color: '#8E8E93',
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(32),
        color: '#1C1C1E',
        marginBottom: verticalScale(4),
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'left',
    },
    headerDivider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        width: '100%',
        marginBottom: 32,
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
    },
    textDark: {
        color: '#FFFFFF',
    },
    modalContentDark: {
        backgroundColor: '#2C2C2E',
    },
    deleteTargetContainerDark: {
        backgroundColor: '#3A3A3C',
    },
    deleteConfirmButtonDark: {
        backgroundColor: '#FFFFFF',
    },
    deleteConfirmTextDark: {
        color: '#1C1C1E',
    },
    addButtonDark: {
        backgroundColor: '#FFFFFF',
    },
    addButtonTextDark: {
        color: '#1C1C1E',
    }
});
