import { View, Text, SafeAreaView, StatusBar as RNStatusBar, Platform, ScrollView, RefreshControl } from 'react-native'
import React, { useLayoutEffect, useState } from 'react'
import { useNavigation } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from '../../../components/Headers/ProfileHeader';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileView from '../../../components/Profile/ProfileView';
import ProfilePosts from '../../../components/Profile/ProfilePosts';

export default function Profile() {
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const { user, updateProfile, refreshUser } = useAuth();
    const [showPosts, setShowPosts] = useState(false);
    const [refreshing, setRefreshing] = useState(false);


    const toggleSection = () => {
        setShowPosts((prev) => !prev);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUser();
        } catch (error) {
            console.error('Error refreshing user data:', error);
        } finally {
            setRefreshing(false);
        }
    }
 
    useLayoutEffect(() => {
        navigation.setOptions({
          gestureEnabled: false,
          swipeEnabled: false,
        });
      }, [navigation]);

  return (
    <SafeAreaView
       style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
        }}
    >
        <StatusBar style='auto'/>
        <ProfileHeader
            title={user.name}
            onBackPress={() => navigation.goBack()}
            colors={colors}
        />
        
        <ScrollView style={{ flex: 1 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
          <ProfileView
              user={user}
              colors={colors}
              onLogout={() => {
                  navigation.navigate('login')
              }}
              navigation={navigation}
              showPosts={showPosts} 
              toggleSection={toggleSection} 
              updateProfile={updateProfile}
          />

          {showPosts && 
            <ProfilePosts
                user={user}
                colors={colors}
            />
          }
        </ScrollView>
    </SafeAreaView>
  );
}