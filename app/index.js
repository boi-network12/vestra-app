import { Redirect, router, usePathname } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';
import SplashScreen from './splash';

export default function Index() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000)
    return () => clearTimeout(timer);
  },[])

  useEffect(() => {
    if (!loading && user && pathname === '/') {
      // Only redirect to feed if on the root route
      router.replace('feed');
    }
  }, [loading, user, pathname]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A86FF" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/get-started" />;
  }

  return null
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