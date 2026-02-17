import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 85,
          borderTopWidth: 1,
          borderTopColor: '#F2F2F7',
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#ec4899', // pink-500
        tabBarInactiveTintColor: '#C7C7CC',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Self-Alignment',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signal"
        options={{
          title: 'Signal',
          tabBarIcon: ({ color }) => (
            <Ionicons name="radio-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
