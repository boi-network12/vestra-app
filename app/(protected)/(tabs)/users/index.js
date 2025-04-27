import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, RefreshControl, FlatList, Button, Image, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native'
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
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { useBlock } from '../../../../contexts/BlockContext';

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
  const [followStatuses, setFollowStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const { blockUser, unblockUser, blockedUsers, checkBlockStatus, fetchBlockedUsers, isBlockedByUser } = useBlock();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByTargetUser, setIsBlockedByTargetUser] = useState(false);

    useEffect(() => {
      const checkBlockedStatus = async () => {
        try {
         
        } catch (error) {
          
        }
      };
      checkBlockedStatus();
    }, [userDetails._id, checkBlockStatus, isBlockedByUser]);

  useEffect(() => {
    fetchSuggestedFriends();
  }, []);

  useEffect(() => {
    const initFollowStatuses = async () => {
      try {
        const statuses = {};
        for (const friend of suggestedFriends) {
          if (friend._id) {
            const status = await checkFollowStatus(friend._id);
            statuses[friend._id] = status;
          }
        }
        setFollowStatuses(statuses);
      } catch (error) {
        console.error('Error initializing follow statuses:', error);
      }
    };
  
    if (suggestedFriends.length > 0) {
      initFollowStatuses();
    }
  }, [suggestedFriends, checkFollowStatus]);

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

  const RenderItem = React.memo(({ item }) => {
    const status = followStatuses[item._id]?.status || 'not_following';
    const isFollowingYou = followStatuses[item._id]?.isFollowingYou || false;

    let buttonText = 'Follow';
    let buttonStyle = { backgroundColor: colors.primary };

    if (status === 'following') {
      buttonText = 'Following';
      buttonStyle = { backgroundColor: colors.secondary };
    } else if (isFollowingYou) {
      buttonText = 'Follow Back';
      buttonStyle = { backgroundColor: colors.primary || '#3a86ff' }; // Use a different color for follow back
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
});

const filteredFriends = suggestedFriends.filter(friend =>
  friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
);

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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.inputBg,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="Search users..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {suggestionsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RenderItem item={item} />}
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
                {searchQuery ? 'No users found' : 'No suggested friends found'}
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
    width: hp(8),
    height: hp(8),
    borderRadius: hp(5),
    marginRight: 15,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initials: {
    fontSize: hp(3),
    fontWeight: 'bold',
    color: 'white',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: hp(2),
    fontWeight: '600',
  },
  username: {
    fontSize: hp(1.6),
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
    fontSize: hp(1.8),
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
  searchContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  searchInput: {
    height: hp(5),
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: wp(4),
    fontSize: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});