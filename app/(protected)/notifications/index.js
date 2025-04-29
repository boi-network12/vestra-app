import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useEffect, useLayoutEffect } from 'react'
import { useNotifications } from '../../../contexts/NotificationContext';
import { useNavigation, router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../contexts/AuthContext';
import NotificationHeader from '../../../components/Headers/NotificationHeader';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import moment from "moment";

export default function Notification() {
    const {
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
    } = useNotifications();
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const { user } = useAuth();

    useLayoutEffect(() => {
      navigation.setOptions({
        gestureEnabled: false,
        swipeEnabled: false,
      });
    }, [navigation]);

    useEffect(() => {
      if (user && user._id) {
        fetchNotifications();
      }
    }, [user?._id]);

    if (loading) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <ActivityIndicator />
        </SafeAreaView>
      );
    }

    if (error) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
            backgroundColor: colors.background,
          }}
        >
          <Text style={{color: colors.error }}>{error}</Text>
        </SafeAreaView>
      );
    }

    const handleNotificationPress = (notification) => {
      // Mark as read when pressed
      if (!notification.read) {
        markAsRead(notification._id);
      }

      if (notification.type === 'tag') {
        if (!notification.relatedItem?.post) {
          console.warn('Malformed tag notification', notification);
          return; 
        }
      }
    
      // Navigate based on notification type
      if (notification.type === 'tag' && notification.relatedItem?.post) {
        const { post, user: postUser } = notification.relatedItem;
        // For post tags, navigate to the post view with all necessary parameters
        router.push({
          pathname: `/post-view/${post._id}`,
          params: {
            id: post._id,
            content: post.content,
            username: postUser.username,
            profilePicture: postUser.profilePicture || '',
            location: post.location?.name || 'Unknown Location',
            media: post.media?.[0]?.url || '',
            likeCount: post.likeCount || 0,
            commentCount: post.commentCount || 0,
            shareCount: post.shareCount || 0,
            repostCount: post.repostCount || 0,
            isLiked: post.isLiked ? 'true' : 'false',
            createdAt: post.createdAt || new Date().toISOString(),
            userId: postUser._id,
            userFullName: postUser.name,
            userVerified: postUser.verified ? 'true' : 'false'
          }
        });
      } else if (notification.url) {
        // Handle other notification types (user profiles, etc.)
        const navigationParams = {
          pathname: notification.url
        };
    
        if (notification.url.includes('users-profile')) {
          navigationParams.params = {
            user: JSON.stringify({
              _id: notification.sender._id,
              name: notification.sender.name,
              username: notification.sender.username,
              profilePicture: notification.sender.profilePicture,
              bio: notification.sender.bio,
              link: notification.sender.link,
              country: notification.sender.country,
              dateOfBirth: notification.sender.dateOfBirth,
              following: notification.sender.following,
              followers: notification.sender.followers,
              blockedUsers: notification.sender.blockedUsers,
              verified: notification.sender.verified,
              ActiveIndicator: notification.sender.ActiveIndicator
            }),
            ...(notification.followStatus && { followStatus: notification.followStatus })
          };
        }
        
        router.push(navigationParams);
      }
    };

    const renderNotificationIcon = (type) => {
      switch(type) {
        case 'friend_request':
          return <Ionicons name="person-add-outline" size={hp(2.5)} color={colors.primary} />;
        case 'friend_accepted':
          return <Ionicons name="checkmark-circle-outline" size={hp(2.5)} color={colors.primary} />;
        case 'message':
          return <Ionicons name="chatbubble-outline" size={hp(2.5)} color={colors.primary} />;
        case 'mention':
          return <Ionicons name="at" size={hp(2.5)} color={colors.primary} />;
        case 'like':
          return <Ionicons name="heart" size={hp(2.5)} color="#E0245E" />;
        case 'comment':
          return <Ionicons name="chatbox" size={hp(2.5)} color={colors.primary} />;
        case 'tag':
          return <Ionicons name='at' size={hp(2.5)} color={colors.primary} />
        case 'repost':
          return <Ionicons name='repeat-sharp' size={hp(2.5)} color={colors.primary} />
        default:
          return <Ionicons name="notifications-outline" size={hp(2.5)} color={colors.primary} />;
      }
    };
    


    const renderItem = ({ item }) => (
      <TouchableOpacity 
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notificationItem,
          { 
            backgroundColor: item.read ? colors.background : colors.card,
            borderBottomColor: colors.border
          }
        ]}
      >
        <View style={styles.iconContainer}>
          {renderNotificationIcon(item.type)}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.notificationText, { color: colors.text }]}>
            {item.content}
            </Text>
                {item.type === 'tag' && item.relatedItem?.post?.content && (
              <Text 
                style={[styles.previewText, { color: colors.subText }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.relatedItem.post.content}
              </Text>
            )}
          <Text style={[styles.timeText, { color: colors.subText }]}>
             {moment(item.createdAt).fromNow()}
          </Text>
        </View>
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );



    return (
      <SafeAreaView
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
          backgroundColor: colors.background,
        }}
      >
        <StatusBar style='auto' />

        <NotificationHeader
            user={user}
            colors={colors}
            router={router}
            unreadCount={unreadCount}
        />
        
        {notifications && notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item, index) => item._id ? item._id : `notification-${index}`}
            ListHeaderComponent={
              <View style={[styles.headerActions, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                  onPress={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <Text style={[
                    styles.actionText, 
                    { 
                      color: unreadCount === 0 ? colors.subText : colors.primary,
                      opacity: unreadCount === 0 ? 0.5 : 1
                    }
                  ]}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: colors.text }}>No notifications yet</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={hp(5)} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.emptySubText, { color: colors.subText }]}>When you get notifications, they'll show up here</Text>
          </View>
        )}
      </SafeAreaView>
    )
}

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
  },
  previewText: {
    fontSize: hp(1.6),
    marginVertical: hp(0.3)
  },
  iconContainer: {
    marginRight: wp(4),
    width: hp(4),
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: hp(1.8),
    marginBottom: hp(0.5),
  },
  timeText: {
    fontSize: hp(1.5),
  },
  unreadDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
  },
  headerActions: {
    padding: hp(1.5),
    borderBottomWidth: 1,
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: hp(1.7),
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyText: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginTop: hp(2),
    marginBottom: hp(0.5),
  },
  emptySubText: {
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  retryButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    borderRadius: hp(1.5),
  },
});