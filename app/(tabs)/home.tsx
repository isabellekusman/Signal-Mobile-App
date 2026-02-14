import { useRouter } from 'expo-router'; // Import useRouter
import React, { useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConnectionCard from '../../components/ConnectionCard';

// Mock Data
const CONNECTIONS = [
    {
        id: '1',
        name: 'Samuel',
        tag: 'SITUATIONSHIP',
        zodiac: 'LIBRA',
        lastActive: 'LAST ACTIVE 2D AGO',
        icon: 'leaf-outline',
    },
    {
        id: '2',
        name: 'Nicholas',
        tag: 'TALKING',
        zodiac: 'CAPRICORN',
        lastActive: 'LAST ACTIVE 4H AGO',
        icon: 'flash-outline',
    },
    {
        id: '3',
        name: 'Thomas',
        tag: 'DATING',
        zodiac: 'AQUARIUS',
        lastActive: 'LAST ACTIVE 1W AGO',
        icon: 'water-outline',
    },
];

export default function HomeScreen() {
    const router = useRouter(); // Initialize router
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

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
                    <Text style={styles.pageTitle}>Active Connections</Text>
                    <Text style={styles.sectionLabel}>YOUR INDEX</Text>
                </View>

                {/* Connection Cards */}
                <View style={styles.cardsList}>
                    {CONNECTIONS.map((item) => (
                        <ConnectionCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            tag={item.tag}
                            zodiac={item.zodiac}
                            lastActive={item.lastActive}
                            icon={item.icon}
                            isSelected={selectedConnectionId === item.id}
                            onPress={() => toggleSelection(item.id)}
                            onOpenFile={() => handleOpenFile(item)} // Pass handler
                            onDelete={() => console.log('Delete', item.name)}
                            onDownload={() => console.log('Download', item.name)}
                        />
                    ))}
                </View>

                {/* Add Connection Button */}
                <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                    <Text style={styles.addButtonText}>ADD CONNECTION</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        gap: 16,
        marginBottom: 32,
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
});
