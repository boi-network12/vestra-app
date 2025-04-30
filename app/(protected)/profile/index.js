import { View, Text, SafeAreaView, StatusBar as RNStatusBar, Platform, FlatList, RefreshControl } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from '../../../components/Headers/ProfileHeader';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileView from '../../../components/Profile/ProfileView';
import ProfilePosts from '../../../components/Profile/ProfilePosts';
import ProfileViewSkeleton from '../../../components/Profile/ProfileViewSkeleton';
import { usePost } from '../../../contexts/PostContext';
import { usePostInteraction } from '../../../contexts/PostInteractionContext';
import { useScroll } from '../../../contexts/ScrollContext';
import ActionModal from '../../../components/SharedComponents/ActionModal';
import ShareModal from '../../../modal/ShareModal';
import RepostModal from '../../../modal/RepostModal';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export default function Profile() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { user, updateProfile, refreshUser } = useAuth();
  const [showPosts, setShowPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {
    posts,
    fetchPostsByContext,
    loading,
    hasMore,
    loadMorePosts,
    refreshing: postRefreshing,
    refreshPosts,
    addRepost,
    setPosts,
    updatePostLikeStatus,
    updatePostBookmark,
    deletePost,
  } = usePost();
  const {
    likePost,
    unlikePost,
    sharePost,
    repostPost,
    incrementViewCount,
    bookmarkPost,
    removeBookmark,
    unrepostPost,
  } = usePostInteraction();
  const { scrollY } = useScroll();
  const [followStatuses, setFollowStatuses] = useState({});

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);

  const toggleSection = () => {
    setShowPosts((prev) => !prev);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await fetchPostsByContext('profile', user._id, true);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      swipeEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
      fetchPostsByContext('profile', user._id, true);
    }
  }, [user, fetchPostsByContext]);

  // Modal action handlers
  const handleShare = async (postId) => {
    try {
      const shareData = { content: '', visibility: 'public' };
      await sharePost(postId, shareData);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, shareCount: (post.shareCount || 0) + 1 }
            : post
        )
      );
      Alert.alert('Success', 'Post shared successfully');
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const handleRepost = async (postId) => {
    try {
      const repostData = { content: '', visibility: 'public' };
      const response = await repostPost(postId, repostData);
      addRepost(response.data);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, repostCount: (post.repostCount || 0) + 1 }
            : post
        )
      );
      Alert.alert('Success', 'Post reposted successfully');
    } catch (err) {
      console.error('Repost error:', err);
      Alert.alert('Error', 'Failed to repost');
    }
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

  const handleUnrepost = async (postId) => {
    try {
      await unrepostPost(postId);
      setPosts((prevPosts) =>
        prevPosts.filter((post) => !(post.repost?._id === postId && post.user._id === user._id))
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, repostCount: Math.max(0, (post.repostCount || 0) - 1) }
            : post
        )
      );
      Alert.alert('Success', 'Repost removed successfully');
    } catch (err) {
      console.error('Unrepost error:', err);
      Alert.alert('Error', 'Failed to unrepost');
    }
  };

  const handleRepostToggle = async (postId) => {
    const post = posts.find((p) => p._id === postId);
    const isReposted = posts.some(
      (p) => p.repost?._id === post._id && p.user._id === user._id && !p.isDeleted
    );
    try {
      if (isReposted) {
        await unrepostPost(postId);
        setPosts((prevPosts) =>
          prevPosts.filter((p) => !(p.repost?._id === postId && p.user._id === user._id))
        );
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
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
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
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
      (p) => p.repost?._id === post._id && p.user._id === user._id
    );
    actions.push({
      label: hasReposted ? 'Unrepost' : 'Repost',
      icon: 'repeat-outline',
      onPress: hasReposted
        ? () => handleUnrepost(post._id)
        : () => handleRepost(post._id),
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

  // Data for FlatList
  const data = [
    { type: 'profile', key: 'profile' }, // ProfileView
    ...(showPosts ? posts.map((post) => ({ type: 'post', key: post._id, post })) : []),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'profile') {
      return isLoading || !user ? (
        <ProfileViewSkeleton colors={colors} />
      ) : (
        <ProfileView
          user={user}
          colors={colors}
          onLogout={() => navigation.navigate('login')}
          navigation={navigation}
          showPosts={showPosts}
          toggleSection={toggleSection}
          updateProfile={updateProfile}
        />
      );
    } else if (item.type === 'post') {
      return (
        <ProfilePosts
          context="profile"
          userId={user._id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          colors={colors}
          fetchPostsByContext={fetchPostsByContext}
          hasMore={hasMore}
          loadMorePosts={loadMorePosts}
          loading={loading}
          posts={posts}
          addRepost={addRepost}
          likePost={likePost}
          unlikePost={unlikePost}
          sharePost={sharePost}
          repostPost={repostPost}
          incrementViewCount={incrementViewCount}
          scrollY={scrollY}
          scrollEventThrottle={16}
          setPosts={setPosts}
          updatePostLikeStatus={updatePostLikeStatus}
          bookmarkPost={bookmarkPost}
          removeBookmark={removeBookmark}
          updatePostBookmark={updatePostBookmark}
          user={user}
          deletePost={deletePost}
          unrepostPost={unrepostPost}
          followStatuses={followStatuses}
          setFollowStatuses={setFollowStatuses}
          setModalVisible={setModalVisible}
          setShareModalVisible={setShareModalVisible}
          setRepostModalVisible={setRepostModalVisible}
          setSelectedPost={setSelectedPost}
          setSelectedPostForShare={setSelectedPostForShare}
          handleLike={async (postId, isCurrentlyLiked) => {
            try {
              updatePostLikeStatus(
                postId,
                !isCurrentlyLiked,
                (posts.find((p) => p._id === postId).likeCount || 0) +
                  (isCurrentlyLiked ? -1 : 1)
              );
              let response;
              if (isCurrentlyLiked) {
                response = await unlikePost(postId);
              } else {
                response = await likePost(postId);
              }
              updatePostLikeStatus(postId, response.data.isLiked, response.data.likeCount);
            } catch (err) {
              console.error('Like error:', err);
              updatePostLikeStatus(
                postId,
                isCurrentlyLiked,
                posts.find((p) => p._id === postId).likeCount || 0
              );
              Alert.alert('Error', err.response?.data?.message || 'Failed to update like status');
            }
          }}
        />
      );
    }
    return null;
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
      <ProfileHeader
        title={user.name}
        onBackPress={() => navigation.goBack()}
        colors={colors}
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => hasMore && !loading && loadMorePosts('profile', user._id)}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modals */}
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
        <>
          <ShareModal
            visible={shareModalVisible}
            onClose={() => {
              setShareModalVisible(false);
              setSelectedPostForShare(null);
            }}
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
              Alert.alert('Direct Message', 'This would open direct messages');
              setShareModalVisible(false);
            }}
            postUrl={`https://yourapp.com/post-view/${selectedPostForShare?._id}`}
            onQuote={() => {
              router.push({
                pathname: 'quote-post',
                params: {
                  id: selectedPostForShare._id,
                  content: selectedPostForShare.content,
                  username: selectedPostForShare.user.username,
                  media: JSON.stringify(selectedPostForShare.media),
                  repost: selectedPostForShare.repost
                    ? JSON.stringify(selectedPostForShare.repost)
                    : null,
                },
              });
              setShareModalVisible(false);
            }}
          />
          <RepostModal
            visible={repostModalVisible}
            onClose={() => {
              setRepostModalVisible(false);
              setSelectedPostForShare(null);
            }}
            colors={colors}
            onRepost={() => {
              handleRepostToggle(selectedPostForShare._id);
              setRepostModalVisible(false);
            }}
            postId={selectedPostForShare._id}
          />
        </>
      )}
    </SafeAreaView>
  );
}