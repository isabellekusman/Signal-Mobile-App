import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';

export default function Index() {
  const { hasCompletedOnboarding } = useConnections();

  // Still loading from AsyncStorage
  if (hasCompletedOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="small" color="#1C1C1E" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}
