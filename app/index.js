import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';
import SplashScreen from './splash';

export default function Index() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000)
    return () => clearTimeout(timer);
  },[])

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A86FF" />
        <Text style={styles.loadingText}>Loading your experience...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/get-started" />;
  }

  return <Redirect href="./(protected)/(tabs)/feed" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#495057',
  },
});