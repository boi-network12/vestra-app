import { View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../../../components/Headers/HomeHeader';
import { useNavigation, router, useLocalSearchParams } from 'expo-router';
import { usePost } from '../../../contexts/PostContext';
import { usePostInteraction } from '../../../contexts/PostInteractionContext';
import Posts from '../../../components/HomeComponents/Posts';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { useScroll } from '../../../contexts/ScrollContext';

export default function Feed() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const { posts, fetchPosts, loading, hasMore, loadMorePosts, refreshing, refreshPosts, addRepost, setPosts, updatePostLikeStatus, updatePostBookmark, deletePost, fetchPostsByContext } = usePost();
  const [activeTab, setActiveTab] = useState('forYou');
  const { likePost, unlikePost, sharePost, repostPost, incrementViewCount, bookmarkPost, removeBookmark, unrepostPost } = usePostInteraction();
  const { scrollY } = useScroll(); 

  const [followStatuses, setFollowStatuses] = useState({}); 


  // Get status bar height
    const getStatusBarHeight = () => {
      return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
    };

    useEffect(() => {
      // Fetch posts for feed context with appropriate filter
      fetchPostsByContext('feed', null, true);
    }, [activeTab, fetchPostsByContext]);
  
    const handleRefresh = () => {
      refreshPosts(activeTab === 'forYou' ? 'all' : 'following');
    };

  return (
    <SafeAreaView
       style={{ flex: 1, backgroundColor: colors.background, paddingTop: getStatusBarHeight() }}
    >
      <StatusBar style='auto' />
      <HomeHeader
         colors={colors}
         user={user}
         navigation={navigation}
         router={router}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forYou' ? styles.activeTab : styles.nonActiveTab, { borderBottomColor: activeTab === 'forYou' ? colors.primary : colors.border }]}
          onPress={() => setActiveTab('forYou')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' ? styles.activeTab : styles.nonActiveTab, { borderBottomColor: activeTab === "following" ? colors.primary : colors.border }]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>Following</Text>
        </TouchableOpacity>
      </View>

      <Posts
        context="feed"
        filter={activeTab === 'forYou' ? 'all' : 'following'}
        onRefresh={handleRefresh}
        colors={colors}
        fetchPosts={fetchPosts}
        hasMore={hasMore}
        loadMorePosts={loadMorePosts}
        loading={loading}
        posts={posts}
        addRepost={addRepost}
        refreshing={refreshing}
        likePost={likePost}
        unlikePost={unlikePost}
        sharePost={sharePost}
        repostPost={repostPost}
        incrementViewCount={incrementViewCount}
        scrollY={scrollY}
        scrollEventThrottle={16}
        setPosts={setPosts}
        updatePostLikeStatus ={updatePostLikeStatus}
        bookmarkPost={bookmarkPost}
        removeBookmark={removeBookmark}
        updatePostBookmark={updatePostBookmark}
        user={user}
        deletePost={deletePost}
        unrepostPost={unrepostPost}
        followStatuses={followStatuses}
        setFollowStatuses={setFollowStatuses}
        fetchPostsByContext={fetchPostsByContext}
        userId={null}
      />

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.8),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  nonActiveTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: hp(1.8),
    fontWeight: '500',
  },
});