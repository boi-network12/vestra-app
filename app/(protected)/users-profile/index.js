import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, RefreshControl } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from '../../../components/Headers/ProfileHeader';
import ProfilePosts from '../../../components/Profile/ProfilePosts';
import ProfileViewDetail from '../../../components/UsersDetails/ProfileView';
import { useFollow } from '../../../contexts/FriendContext';

export default function index() {
  const { user, followStatus } = useLocalSearchParams();
  const userDetails = JSON.parse(user);
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { followUser, unfollowUser, checkFollowStatus } = useFollow();
  const [currentFollowStatus, setCurrentFollowStatus] = useState(followStatus || 'not_following');
  const [refreshing, setRefreshing] = useState(false);


  // Fetch the actual follow status when the user profile loads or changes
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const status = await checkFollowStatus(userDetails._id);
        setCurrentFollowStatus(
          status.status === 'blocked'
            ? 'blocked'
            : status.status === 'following'
            ? 'following'
            : status.isFollowingYou
            ? 'follow_back'
            : 'not_following'
        );
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    fetchFollowStatus();
  }, [userDetails._id, checkFollowStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Optionally refresh user data or follow status here
      const status = await checkFollowStatus(userDetails._id);
      setCurrentFollowStatus(
        status.status === 'blocked'
          ? 'blocked'
          : status.status === 'following'
          ? 'following'
          : status.isFollowingYou
          ? 'follow_back'
          : 'not_following'
      );
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
    
     
  const handleFollowAction = async () => {
    try {
      if (currentFollowStatus === 'following') {
        const { success } = await unfollowUser(userDetails._id);
        if (success) {
          const newStatus = await checkFollowStatus(userDetails._id);
          setCurrentFollowStatus(
            newStatus.isFollowingYou ? 'follow_back' : 'not_following'
          );
        }
      } else if (currentFollowStatus === 'follow_back' || currentFollowStatus === 'not_following') {
        const { success } = await followUser(userDetails._id);
        if (success) {
          setCurrentFollowStatus('following');
        }
      }
    } catch (error) {
      console.error('Error in follow action:', error);
    }
  };

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
            />
           }
        >
          <ProfileViewDetail
              user={userDetails}
              colors={colors}
              navigation={navigation}
              handleFollowAction={handleFollowAction}
              currentFollowStatus={currentFollowStatus}
          />
 
            <ProfilePosts
                user={user}
                colors={colors}
            />
          
        </ScrollView>
    </SafeAreaView>
  )
}