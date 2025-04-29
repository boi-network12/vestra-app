import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from '../../../components/Headers/ProfileHeader';
import ProfilePosts from '../../../components/Profile/ProfilePosts';
import ProfileViewDetail from '../../../components/UsersDetails/ProfileView';
import { useFollow } from '../../../contexts/FriendContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useBlock } from '../../../contexts/BlockContext';
import UserProfileHeader from '../../../components/Headers/UserProfileHeader';

export default function UserProfile() {
  const { user, followStatus } = useLocalSearchParams();
  const userDetails = JSON.parse(user);
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { followUser, unfollowUser, checkFollowStatus } = useFollow();
  const [currentFollowStatus, setCurrentFollowStatus] = useState(followStatus || 'not_following');
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser, refreshUser } = useAuth();
  const { blockUser, unblockUser, blockedUsers, checkBlockStatus, fetchBlockedUsers, isBlockedByUser } = useBlock();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByTargetUser, setIsBlockedByTargetUser] = useState(false);


  if (!currentUser || !currentUser._id) {
    console.error('Auth user is undefined or missing _id');
    return null;
  }

  useEffect(() => {
    const checkBlockedStatus = async () => {
      try {
        const isUserBlocked = await checkBlockStatus(userDetails._id);
        setIsBlocked(isUserBlocked);
        const blockedByUser = await isBlockedByUser(userDetails._id);
        setIsBlockedByTargetUser(blockedByUser);
      } catch (error) {
        console.error('Error checking block status:', error.message);
        // Optionally show an alert or set a fallback state
        Alert.alert('Error', 'Failed to load block status. Please try again.');
      }
    };
    checkBlockedStatus();
  }, [userDetails._id, checkBlockStatus, isBlockedByUser]);


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

  const handleBlockAction = async () => {
    console.log('Blocking user with ID:', userDetails._id);
    const previousIsBlocked = isBlocked;
    setIsBlocked(!isBlocked); // Optimistic update
    try {
      if (previousIsBlocked) {
        await unblockUser(userDetails._id);
        Alert.alert('Success', 'User has been unblocked');
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${userDetails.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockUser(userDetails._id);
                await fetchBlockedUsers();
                Alert.alert('Success', 'User has been blocked');
              },
            },
          ]
        );
      }
    } catch (error) {
      setIsBlocked(previousIsBlocked); // Revert on error
      Alert.alert('Error', `Failed to ${previousIsBlocked ? 'unblock' : 'block'} user`);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      refreshUser()
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
      const isUserBlocked = await checkBlockStatus(userDetails._id);
      setIsBlocked(isUserBlocked);
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

   // Render "You blocked this user" view
   const renderBlockedView = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    }}>
      <Text style={{
        fontSize: 18,
        color: colors.text,
        marginBottom: 20,
      }}>
        You blocked this user
      </Text>
      <TouchableOpacity
        onPress={handleBlockAction}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
        }}
      >
        <Text style={{
          color: colors.background,
          fontSize: 16,
          fontWeight: '600',
        }}>
          Unblock
        </Text>
      </TouchableOpacity>
    </View>
  );

  // UserProfile.js
const renderBlockedByUserView = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        color: colors.text,
        marginBottom: 20,
        textAlign: 'center',
      }}
    >
      This user has blocked you. You cannot view their profile.
    </Text>
    <TouchableOpacity
      onPress={onRefresh}
      style={{
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
      }}
    >
      <Text
        style={{
          color: colors.background,
          fontSize: 16,
          fontWeight: '600',
        }}
      >
        Refresh
      </Text>
    </TouchableOpacity>
  </View>
);

  return (
    <SafeAreaView
       style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
        }}
    >
        <StatusBar style='auto'/>
        <UserProfileHeader
            title={user.name}
            onBackPress={() => navigation.goBack()}
            colors={colors}
            handleBlockAction={handleBlockAction}
            isBlocked={isBlocked}
            isBlockedByTargetUser={isBlockedByTargetUser}
        />
        
        {isBlocked ? (
          renderBlockedView()
        ) : isBlockedByTargetUser  ?  (
          renderBlockedByUserView()
        ) : (
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
                currentUser={currentUser}
            />
  
              <ProfilePosts
                  user={user}
                  colors={colors}
              />
            
          </ScrollView>
        )}
    </SafeAreaView>
  )
}