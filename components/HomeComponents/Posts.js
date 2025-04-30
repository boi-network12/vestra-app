// components/HomeComponents/Posts.js
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import Icon from 'react-native-vector-icons/Ionicons'; 
import { Alert } from 'react-native';
import ActionModal from '../SharedComponents/ActionModal';
import ShareModal from '../../modal/ShareModal';
import RepostModal from '../../modal/RepostModal';
import { PostProvider } from '../../contexts/PostContext';
import PostSkeleton from './PostSkeleton';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const VideoPlaceholder = ({ uri }) => (
  <View style={styles.videoContainer}>
    <Text style={styles.videoPlaceholderText}>Video: {uri}</Text>
  </View>
);

export default function Posts({ 
    context = 'feed',
    filter,
    onRefresh,
    posts,
    fetchPosts,
    fetchPostsByContext,
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
    unrepostPost,
    setFollowStatuses,
    followStatuses,
    userId
 }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
  const [repostModalVisible, setRepostModalVisible] = useState(false);


  // Memoize the fetchPosts function to prevent recreation
  const memoizedFetchPostsByContext = useCallback(
    (ctx, targetUserId, reset) => {
      console.log(`Fetching posts for context: ${ctx}, userId: ${targetUserId}, reset: ${reset}`);
      fetchPostsByContext(ctx, targetUserId, reset);
    },
    [fetchPostsByContext]
  );

  useEffect(() => {
    if ((context === 'profile' || context === 'userProfile') && !userId) {
      console.warn(`userId is required for ${context} context`);
      return;
    }
  
    // Only pass userId for profile/userProfile, otherwise null
    memoizedFetchPostsByContext(context, (context === 'profile' || context === 'userProfile') ? userId : null, true);
  }, [context, userId, memoizedFetchPostsByContext]);


  useEffect(() => {
    const ids = posts.map((post) => post._id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      
    }
  }, [posts]);

  const renderSkeleton = () => {
    return Array(3)
      .fill()
      .map((_, index) => <PostSkeleton key={`skeleton-${index}`} colors={colors} />);
  };

  // Add this function
const handleSharePress = (post) => {
  setSelectedPostForShare(post);
  setShareModalVisible(true);
};
  
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

  const hasReposted = (post) => {
    return posts.some(
      p => p.repost?._id === post._id && p.user._id === user._id && !p.isDeleted
    );
  };

  const handleRepostToggle = async (postId) => {
    const post = posts.find(p => p._id === postId);
    const isReposted = hasReposted(post);
    
    try {
      if (isReposted) {
        await unrepostPost(postId);
        setPosts(prevPosts => prevPosts.filter(
          p => !(p.repost?._id === postId && p.user._id === user._id)
        ));
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p._id === postId
              ? { ...p, repostCount: Math.max(0, (p.repostCount || 0) - 1) }
              : p
          )
        );
        Alert.alert('Success', 'Repost removed successfully');
      } else {
        const repostData = { content: '', visibility: 'public' };
        const response = await repostPost(postId, repostData);
        addRepost(response.data);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p._id === postId
              ? { ...p, repostCount: (p.repostCount || 0) + 1 }
              : p
          )
        );
        Alert.alert('Success', 'Post reposted successfully');
      }
    } catch (err) {
      console.error(isReposted ? 'Unrepost error:' : 'Repost error:', err);
      Alert.alert('Error', isReposted ? 'Failed to unrepost' : 'Failed to repost');
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

  const navigateToProfile = (postUser) => {
    if (!postUser || !postUser._id) {
      console.error('navigateToProfile: Invalid user object', postUser);
      return;
    }
  
    // Determine if the user is the current user
    const isCurrentUser = postUser._id === user._id;
  
    // Determine follow status (mirroring MessageItem logic)
    const status = followStatuses[postUser._id]?.status || 'not_following';
    const isFollowingYou = followStatuses[postUser._id]?.isFollowingYou || false;
  
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
  
    // Use the populated postUser object directly, ensuring password is excluded
    const userData = { ...postUser };
  
    // Ensure password is not included (though backend already excludes it)
    if (userData.password) {
      delete userData.password;
    }
  
    // Navigate to appropriate route
    router.push({
      pathname: isCurrentUser ? 'profile' : 'users-profile',
      params: {
        user: JSON.stringify(userData),
        followStatus,
      },
    });
  };

  // New renderMedia function to handle multiple media items
  const renderMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;
  
    const images = mediaItems.filter(item => item && (item.type === 'image' || item.url.match(/\.(jpg|jpeg|png|gif)$/i)));
    const videos = mediaItems.filter(item => item && (item.type === 'video' || item.url.match(/\.(mp4|mov)$/i)));
  
    // Twitter-like image grid logic
    const renderImageGrid = () => {
      if (images.length === 1) {
        return (
          <Image
            source={{ uri: images[0].url }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        );
      } else if (images.length === 2) {
        return (
          <View style={styles.twoImageContainer}>
            {images.map((item, index) => (
              <Image
                key={index}
                source={{ uri: item.url }}
                style={styles.twoImage}
                resizeMode="cover"
              />
            ))}
          </View>
        );
      } else if (images.length === 3) {
        return (
          <View style={styles.threeImageContainer}>
            <Image
              source={{ uri: images[0].url }}
              style={styles.threeImageLeft}
              resizeMode="cover"
            />
            <View style={styles.threeImageRightContainer}>
              {images.slice(1, 3).map((item, index) => (
                <Image
                  key={index}
                  source={{ uri: item.url }}
                  style={styles.threeImageRight}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        );
      } else if (images.length >= 4) {
        return (
          <View style={styles.fourImageContainer}>
            {images.slice(0, 4).map((item, index) => (
              <Image
                key={index}
                source={{ uri: item.url }}
                style={styles.fourImage}
                resizeMode="cover"
              />
            ))}
          </View>
        );
      }
    };
  
    return (
      <View style={styles.mediaContainer}>
        {images.length > 0 && renderImageGrid()}
        {videos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScroll}>
            {videos.map((item, index) => (
              <VideoPlaceholder key={index} uri={item.url} style={styles.video} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };
  
  const renderQuotedMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;

    // Select only the first media item
    const firstMedia = mediaItems[0];
    if (!firstMedia) return null;

    const isImage = firstMedia.type === 'image' || firstMedia.url.match(/\.(jpg|jpeg|png|gif)$/i);
    const isVideo = firstMedia.type === 'video' || firstMedia.url.match(/\.(mp4|mov)$/i);

    if (isImage) {
      return (
        <Image
          source={{ uri: firstMedia.url }}
          style={styles.quotedMedia}
          resizeMode="cover"
        />
      );
    } else if (isVideo) {
      return (
        <VideoPlaceholder
          uri={firstMedia.url}
          style={styles.quotedMedia}
        />
      );
    }

    return null;
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
          <TouchableOpacity
             onPress={() => navigateToProfile(item.user)}
          >
             <Image source={{ uri: item.user.profilePicture }} style={styles.avatar} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
             onPress={() => navigateToProfile(item.user)}
             style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>
              {item.user.name ? item.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
        )}
        <View>
          <TouchableOpacity
             onPress={() => navigateToProfile(item.user)}
          >
            <Text style={[styles.username, { color: colors.text }]}>{item.user.username}</Text>
          </TouchableOpacity>
          <Text style={[styles.location, { color: colors.subText }]}>
            {item.location?.name || 'Unknown Location'}
          </Text>
        </View>
      </View>

      {item.quote && item.quote.user ? (
      <View style={[styles.quoteContainer, { borderLeftColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigateToProfile(item.quote.user)}>
          <Text style={[styles.quoteLabel, { color: colors.subText }]}>
            Quoted from @{item.quote.user.username || 'Unknown User'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.content, { color: colors.text }]}>{item.quote.content || ''}</Text>
        {renderQuotedMedia(item.quote.media || [])}
      </View>
    ) : item.repost && item.repost.user ? (
      <View style={[styles.repostContainer, { borderLeftColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigateToProfile(item.quote.user)}>
          <Text style={[styles.repostLabel, { color: colors.subText }]}>
            Reposted from @{item.repost.user.username || 'Unknown User'}
          </Text> 
        </TouchableOpacity>
        <Text style={[styles.content, { color: colors.text }]}>{item.repost.content || ''}</Text>
        {renderMedia(item.repost.media)}
      </View>
    ) : (
      <>
        <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
        {renderMedia(item.media)}
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
          onPress={() => {
            setSelectedPostForShare(item);
            setRepostModalVisible(true);
          }}
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
        <View className='flex-row'>
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
            onPress={() => handleSharePress(item)}
          >
            <Icon name="share-outline" size={wp(5)} color={colors.icon} />
            <Text style={[styles.interactionText, { color: colors.subText }]}>
              {item.shareCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.viewCount, { color: colors.subText }]}>
        {item.viewCount || 0} Views
      </Text>
    </TouchableOpacity>
  );

  

  return (
    <>
      {loading && posts.length === 0 ? (
        <View style={styles.listContainer}>{renderSkeleton()}</View>
      ) : (
        <AnimatedFlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => item._id ? `${item._id}-${index}` : `posts-${index}`}
          onEndReached={() => hasMore && !loading && loadMorePosts(context === 'feed' ? filter : 'user')}
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
      )}

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

      {selectedPostForShare && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          colors={colors}
          onRepost={() => {
            handleRepost(selectedPostForShare._id);
            setShareModalVisible(false);
          }}
          onBookmark={() => {
            handleBookmark(
              selectedPostForShare._id, 
              selectedPostForShare.bookmarks?.includes(user._id)
            );
            setShareModalVisible(false);
          }}
          isBookmarked={selectedPostForShare?.bookmarks?.includes(user._id)}
          onShareDirect={() => {
            // This would navigate to direct messages in a real app
            Alert.alert('Direct Message', 'This would open direct messages');
            setShareModalVisible(false);
          }}
          postUrl={`https://yourapp.com/post-view/${selectedPostForShare?._id}`}
          onQuote={() => {
            // Navigate to quote screen with post details
            router.push({
              pathname: 'quote-post',
              params: {
                id: selectedPostForShare._id,
                content: selectedPostForShare.content,
                username: selectedPostForShare.user.username,
                media: JSON.stringify(selectedPostForShare.media),
                repost: selectedPostForShare.repost ? JSON.stringify(selectedPostForShare.repost) : null
              }
            });
          }}
        />
      )}

      {repostModalVisible && (
        <RepostModal
          visible={repostModalVisible}
          onClose={() => setRepostModalVisible(false)}
          colors={colors}
          onRepost={() => handleRepostToggle(selectedPostForShare._id)}
          postId={selectedPostForShare._id}
        /> 
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
  quoteContainer: {
    paddingLeft: wp(3),
    borderLeftWidth: 2,
    marginTop: hp(1),
    marginBottom: hp(1.5),
  },
  quoteLabel: {
    fontSize: wp(3.5),
    marginBottom: hp(0.5),
    fontStyle: 'italic',
  },
  quoteMedia: {
    width: '100%',
    height: hp(25),
    borderRadius: 12,
    marginTop: hp(1)
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
  // Add these to your existing StyleSheet
singleImage: {
  width: '100%',
  aspectRatio: 16/9,
  borderRadius: 12,
  marginBottom: hp(1.5),
},
twoImageContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: hp(1.5),
},
twoImage: {
  width: '49%',
  aspectRatio: 1,
  borderRadius: 12,
},
threeImageContainer: {
  flexDirection: 'row',
  height: hp(25),
  marginBottom: hp(1.5),
},
threeImageLeft: {
  width: '60%',
  height: '100%',
  borderRadius: 12,
  marginRight: wp(1),
},
threeImageRightContainer: {
  width: '39%',
  height: '100%',
  justifyContent: 'space-between',
},
threeImageRight: {
  width: '100%',
  height: '48%',
  borderRadius: 12,
},
fourImageContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: hp(1.5),
},
fourImage: {
  width: '49%',
  aspectRatio: 1,
  borderRadius: 12,
  marginBottom: hp(1),
},
mediaContainer: {
  marginBottom: hp(1),
},
videoScroll: {
  marginTop: hp(1),
},
videoContainer: {
  width: wp(90),
  height: hp(35),
  borderRadius: 12,
  backgroundColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: wp(2),
},
videoPlaceholderText: {
  color: '#fff',
  fontSize: wp(4),
},
quotedMedia: {
  width: wp(40), // Smaller width
  height: hp(15), // Smaller height
  borderRadius: 8,
  marginTop: hp(1),
},
});