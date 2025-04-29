// components/HomeComponents/Posts.js
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import Icon from 'react-native-vector-icons/Ionicons'; 
import { Alert } from 'react-native';
import ActionModal from '../SharedComponents/ActionModal';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function Posts({ 
    filter,
    onRefresh,
    posts,
    fetchPosts,
    loading,
    hasMore,
    loadMorePosts,
    refreshing,
    colors,
    scrollY, 
    scrollEventThrottle,
    addRepost,
    likePost, 
    unlikePost, 
    sharePost, 
    repostPost, 
    incrementViewCount,
    updatePostLikeStatus,
    setPosts,
    updatePostBookmark,
    bookmarkPost, 
    removeBookmark,
    deletePost,
    user,
    unrepostPost
 }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);


  useEffect(() => {
    fetchPosts(filter);
  }, [filter]);

  useEffect(() => {
    const ids = posts.map((post) => post._id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn('Duplicate post IDs detected:', ids);
    }
  }, [posts]);
  
  const handleBookmark = async (postId, isBookmarked) => {
    try {
      if (isBookmarked) {
        await removeBookmark(postId);
        updatePostBookmark(postId, false);
      } else {
        await bookmarkPost(postId);
        updatePostBookmark(postId, true);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      Alert.alert('Error', 'Failed to update bookmark status');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      Alert.alert('Success', 'Post deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const getPostActions = (post) => {
    const actions = [];
    
    if (post.user._id === user._id) {
      actions.push({
        label: 'Delete Post',
        icon: 'trash-outline',
        onPress: () => handleDelete(post._id),
        danger: true,
      });
    }

    const hasReposted = posts.some(
      p => p.repost?._id === post._id && p.user._id === user._id
    );
    
    actions.push({
      label: hasReposted ? 'Unrepost' : 'Repost',
      icon: 'repeat-outline',
      onPress: hasReposted ? () => handleUnrepost(post._id) : () => handleRepost(post._id),
    });
    
    return actions;
  };

  const getShareActions = (post) => [
    {
      label: 'Share Now',
      icon: 'share-outline',
      onPress: () => handleShare(post._id),
    },
    {
      label: 'Repost',
      icon: 'repeat-outline',
      onPress: () => handleRepost(post._id),
    },
  ];

  
  const handleLike = async (postId, isCurrentlyLiked) => {
    try {
      // Optimistically update UI
      updatePostLikeStatus(
        postId,
        !isCurrentlyLiked,
        (posts.find(p => p._id === postId).likeCount || 0) + (isCurrentlyLiked ? -1 : 1)
      );

      let response;
      if (isCurrentlyLiked) {
        response = await unlikePost(postId);
      } else {
        response = await likePost(postId);
      }

      // Update state with server response
      updatePostLikeStatus(postId, response.data.isLiked, response.data.likeCount);
    } catch (err) {
      console.error('Like error:', {
        message: err.response?.data?.message,
        status: err.response?.status,
        details: err.message,
      });
      // Revert UI on error
      updatePostLikeStatus(
        postId,
        isCurrentlyLiked,
        posts.find(p => p._id === postId).likeCount || 0
      );
      Alert.alert('Error', err.response?.data?.message || 'Failed to update like status');
    }
  };

  
  const handleShare = async (postId) => {
    try {
      const shareData = { content: '', visibility: 'public' };
      await sharePost(postId, shareData);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, shareCount: (post.shareCount || 0) + 1 }
            : post
        )
      );
      Alert.alert('Success', 'Post shared successfully');
    } catch (err) {
      console.error('Share error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const handleUnrepost = async (postId) => {
    try {
      await unrepostPost(postId);
      setPosts(prevPosts => prevPosts.filter(
        post => !(post.repost?._id === postId && post.user._id === user._id)
      ));
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, repostCount: Math.max(0, (post.repostCount || 0) - 1) }
            : post
        )
      );
      Alert.alert('Success', 'Repost removed successfully');
    } catch (err) {
      console.error('Unrepost error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to unrepost');
    }
  };

  const handleRepost = async (postId) => {
    if (!postId) {
      Alert.alert('Error', 'Invalid post ID');
      return;
    }
    try {
      const repostData = { content: '', visibility: 'public' };
      const response = await repostPost(postId, repostData);
      addRepost(response.data);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, repostCount: (post.repostCount || 0) + 1 }
            : post
        )
      );
      Alert.alert('Success', 'Post reposted successfully');
    } catch (err) {
      console.error('Repost error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to repost');
    }
  };

  const navigateToPostView = (item) => {
    incrementViewCount(item._id)
    .then(() => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === item._id
            ? { ...post, viewCount: (post.viewCount || 0) + 1 }
            : post
        )
      );
    })
    .catch(err => console.error('Failed to increment view count:', err));

    const repostMedia = item.repost?.media?.[0]?.url || '';

    router.push({
      pathname: `post-view/${item._id}`,
      params: {
        id: item._id,
        content: item.content,
        username: item.user.username,
        profilePicture: item.user.profilePicture || '',
        location: item.location?.name || 'Unknown Location',
        media: item.media.length > 0 ? item.media[0].url : '',
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        shareCount: item.shareCount,
        repostCount: item.repostCount || 0,
        viewCount: (item.viewCount || 0) + 1,
        isLiked: item.isLiked ? 'true' : 'false',
        createdAt: item.createdAt || new Date().toISOString(),
        repost: item.repost ? JSON.stringify({
          ...item.repost,
          media: item.repost.media,
          user: {
            username: item.repost.user?.username || 'Unknown User'
          }
        }) : null,
      },
    });
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={[styles.postContainer, { backgroundColor: colors.card }]}
      onPress={() => navigateToPostView(item)}
      activeOpacity={0.8}
    >
      <View style={styles.postHeader}>
      <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => {
            setSelectedPost(item);
            setModalVisible(true);
          }}
        >
          <Icon name="ellipsis-horizontal" size={hp(2)} color={colors.subText} />
        </TouchableOpacity>
        {item.user.profilePicture ? (
          <Image source={{ uri: item.user.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>
              {item.user.name ? item.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View>
          <Text style={[styles.username, { color: colors.text }]}>{item.user.username}</Text>
          <Text style={[styles.location, { color: colors.subText }]}>
            {item.location?.name || 'Unknown Location'}
          </Text>
        </View>
      </View>

      {item.repost  && item.repost.user ? (
        <View style={[styles.repostContainer, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.repostLabel, { color: colors.subText }]}>
            Reposted from {item.repost.user.username || 'Unknown User'}
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>{item.repost.content || ''}</Text>
          {item.repost.media.length > 0 && (
            <Image
              source={{ uri: item.repost.media[0].url }}
              style={styles.repostMedia}
              resizeMode="cover"
            />
          )}
        </View>
      ) : (
        <>
          <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
          {item.media.length > 0 && (
            <Image
              source={{ uri: item.media[0].url }}
              style={styles.media}
              resizeMode="cover"
            />
          )}
        </>
      )}

      <View style={styles.interactionBar}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleLike(item._id, item.isLiked)}
       >
          <Icon
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={wp(5)}
            color={item.isLiked ? colors.errorText : colors.subText}
          />
          <Text style={[styles.interactionText, { color: colors.subText }]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleRepost(item._id)}
        >
          <Icon name="repeat-outline" size={wp(5)} color={colors.icon} />
          <Text style={[styles.interactionText, { color: colors.subText }]}>
            {item.repostCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => navigateToPostView(item)}
        >
          <Icon name="chatbubble-outline" size={wp(5)} color={colors.icon} />
          <Text style={[styles.interactionText, { color: colors.subText }]}>
            {item.commentCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleBookmark(item._id, item.bookmarks?.includes(user._id))}
        >
          <Icon
            name={item.bookmarks?.includes(user._id) ? 'bookmark' : 'bookmark-outline'}
            size={wp(5)}
            color={colors.icon}
          />
          <Text style={[styles.interactionText, { color: colors.subText }]}>
            {item.bookmarkCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleShare(item._id)}
        >
          <Icon name="share-outline" size={wp(5)} color={colors.icon} />
          <Text style={[styles.interactionText, { color: colors.subText }]}>
            {item.shareCount}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.viewCount, { color: colors.subText }]}>
        {item.viewCount || 0} Views
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <AnimatedFlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item._id ? `${item._id}-${index}` : `posts-${index}`}
        onEndReached={() => hasMore && !loading && loadMorePosts(filter)}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={scrollEventThrottle}
      />

      {/* modal */}
      {selectedPost && (
        <>
          <ActionModal
            isVisible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setSelectedPost(null);
            }}
            actions={getPostActions(selectedPost)}
            colors={colors}
            title="Post Options"
          />
          <ActionModal
            isVisible={shareModalVisible}
            onClose={() => {
              setShareModalVisible(false);
              setSelectedPost(null);
            }}
            actions={getShareActions(selectedPost)}
            colors={colors}
            title="Share Options"
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: wp(4),
    marginVertical: hp(1),
    marginHorizontal: wp(2.5),
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: wp(2.5),
  },
  avatarPlaceholder: {
     width: wp(10),
     height: wp(10),
     borderRadius: wp(5),
      marginRight: wp(2.5),
      justifyContent: 'center',
      alignItems: 'center',
  },
  initials: {
      color: '#fff',
      fontSize: hp(2.2),
      fontWeight: 'bold',
  },
  username: {
    fontSize: wp(4.2),
    fontWeight: '700',
  },
  location: {
    fontSize: wp(3.2),
    marginTop: hp(0.2),
  },
  content: {
    fontSize: wp(3.8),
    lineHeight: hp(2.5),
    marginBottom: hp(1.5),
  },
  media: {
    width: '100%',
    height: hp(35),
    borderRadius: 12,
    marginBottom: hp(1.5),
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2),
    borderRadius: 8,
  },
  interactionText: {
    fontSize: wp(3.2),
    marginLeft: wp(1.5),
  },
  listContainer: {
    paddingBottom: hp(2),
  },
  repostMedia: {
    width: '100%',
    height: hp(25),
    borderRadius: 12,
    marginTop: hp(1)
  },
  optionsButton: {
    position: 'absolute',
    right: 0,
    padding: wp(2),
  },
});