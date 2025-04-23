import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, RefreshControl, FlatList, Button, Image, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';
import UsersHeader from '../../../../components/Headers/usersHeader';
import { StatusBar } from 'expo-status-bar';
import { router, useNavigation } from 'expo-router';
import { ScrollView } from 'react-native';
import { useFollow } from '../../../../contexts/FriendContext';
import { StyleSheet } from 'react-native';

export default function users() {
  const { user, refreshUser } = useAuth();
  const {
    suggestedFriends, 
    suggestionsLoading, 
    fetchSuggestedFriends,
    followUser,
    unfollowUser,
    checkFollowStatus
  } = useFollow();
  const [refreshing, setRefreshing] = useState(false);
  const [followStatuses, setFollowStatuses] = useState({});
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const [currentFollowStatus, setCurrentFollowStatus] = useState({});

  useEffect(() => {
    fetchSuggestedFriends();
  }, []);

  useEffect(() => {
    // Initialize follow statuses when suggestedFriends changes
    const initFollowStatuses = async () => {
      const statuses = {};
      for (const friend of suggestedFriends) {
        const status = await checkFollowStatus(friend._id);
        statuses[friend._id] = status;
      }
      setFollowStatuses(statuses);
    };
    
    if (suggestedFriends.length > 0) {
      initFollowStatuses();
    }
  }, [suggestedFriends]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await fetchSuggestedFriends();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollowAction = async (userId) => {
    try {
      const status = followStatuses[userId]?.status || 'not_following';
      const isFollowingYou = followStatuses[userId]?.isFollowingYou || false;
  
      if (status === 'following') {
        const { success } = await unfollowUser(userId);
        if (success) {
          setFollowStatuses((prev) => ({
            ...prev,
            [userId]: { status: 'not_following', isFollowingYou },
          }));
        }
      } else {
        const { success } = await followUser(userId);
        if (success) {
          setFollowStatuses((prev) => ({
            ...prev,
            [userId]: { status: 'following', isFollowingYou },
          }));
        }
      }
    } catch (error) {
      console.error('Error in follow action:', error);
    }
  };

  // In your users.js list component
const navigateToProfile = (user) => {
  const status = followStatuses[user._id]?.status || 'not_following';
  const isFollowingYou = followStatuses[user._id]?.isFollowingYou || false;

  if (!user || !user._id) {
    console.error('navigateToProfile: Invalid user object', user);
    return;
  }
  
  let followStatus;
  if (status === 'blocked') {
    followStatus = 'blocked';
  } else if (status === 'following') {
    followStatus = 'following';
  } else if (isFollowingYou) {
    followStatus = 'follow_back';
  } else {
    followStatus = 'not_following';
  }

  router.navigate({
    pathname: 'users-profile',
    params: { 
      user: JSON.stringify(user),
      followStatus
    },
  });
};

  const renderItem = ({ item }) => {
    const status = followStatuses[item._id]?.status || 'not_following';
    const isFollowingYou = followStatuses[item._id]?.isFollowingYou || false;

    let buttonText = 'Follow';
    let buttonStyle = { backgroundColor: colors.primary };

    if (status === 'following') {
      buttonText = 'Following';
      buttonStyle = { backgroundColor: colors.secondary };
    } else if (isFollowingYou) {
      buttonText = 'Follow Back';
      buttonStyle = { backgroundColor: colors.tertiary || '#3a86ff' }; // Use a different color for follow back
    }

    return (
      <TouchableOpacity
        style={[styles.suggestionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigateToProfile(item)}
      >
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.initials}>
                {item.name ? item.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </Text>
            </View>
        )}
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.username, { color: colors.subText }]}>@{item.username}</Text>
          {item.mutualConnections > 0 && (
            <Text style={[styles.meta, { color: colors.subText }]}>
              {item.mutualConnections} mutual connections
            </Text>
          )}
          {item.commonInterests > 0 && (
            <Text style={[styles.meta, { color: colors.subText }]}>
              {item.commonInterests} common interests
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.followButton, 
            buttonStyle,
            ]}
          onPress={() => handleFollowAction(item._id)}
        >
          <Text style={styles.followButtonText}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
};

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar style="auto" />
      <UsersHeader
        colors={colors} 
        user={user}
        navigation={navigation}
      />

      {suggestionsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={suggestedFriends}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No suggested friends found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initials: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});