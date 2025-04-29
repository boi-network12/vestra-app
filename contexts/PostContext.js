// contexts/PostContext.js
import React, { createContext, useContext, useState, useEffect, Platform } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import config from '../config';

const PostContext = createContext();

export function PostProvider({ children }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);

  const token = user?.token

  // Create a new post
  const createPost = async (postData) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility);
      formData.append('isNSFW', postData.isNSFW);

      if (postData.taggedUsers && postData.taggedUsers.length > 0) {
        postData.taggedUsers.forEach((userId, index) => {
          formData.append(`taggedUsers[${index}]`, userId);
        });
      }

      // Append location only once
      if (postData.location && postData.location.name) {
        formData.append('location', JSON.stringify({
          name: postData.location.name,
        }));
      }


      // Handle media uploads
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((media, index) => {
          console.log('Appending media:', media.uri, media.type);
          formData.append('media', {
            uri: media.uri,
            name: `media_${index}.${media.type === 'image' ? 'jpg' : 'mp4'}`,
            type: `${media.type}/${media.type === 'image' ? 'jpeg' : 'mp4'}`
          });
        });
      }

      console.log('FormData contents:', formData);


      const response = await axios.post(`${config.API_URL}/api/post`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      setPosts(prevPosts => [response.data.data, ...prevPosts]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

   // Fetch friends
   const fetchFriends = async () => {
    if (!token) {
      setError('You must be logged in to fetch friends.');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/api/post/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFriends(response.data.data);
      setFilteredFriends(response.data.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err.response?.data?.message || 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  // Filter friends (optional: can be moved to context if reusable)
  const filterFriends = (query) => {
    if (query) {
      const filtered = friends.filter(
        (friend) =>
          friend.username.toLowerCase().includes(query.toLowerCase()) ||
          friend.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  };

  // Fetch posts with pagination
  const fetchPosts = async (filter = 'all', reset = false) => {
    if (!token) {
      setError('You must be logged in to fetch posts.');
      return;
    }

    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
        setRefreshing(true);
      } else if (loading) {
        return;
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${config.API_URL}/api/post`, {
        params: {
          page: reset ? 1 : page,
          limit: 10,
          filter,
          _t: new Date().getTime()
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { docs, hasNextPage, page: currentPage } = response.data.data;

      if (reset) {
        setPosts(docs);
      } else {
        setPosts(prevPosts => [...prevPosts, ...docs]);
      }

      setHasMore(hasNextPage);
      setPage(currentPage + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      if (reset) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Delete a post
  const deletePost = async (postId) => {
    try {
      await axios.delete(`${config.API_URL}/api/post/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
      throw err;
    }
  };

  // Report a post
  const reportPost = async (postId, reason) => {
    try {
      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/report`,
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report post');
      throw err;
    }
  };

  // Get a single post
  const getPost = async (postId) => {
    if (!token) {
      setError('You must be logged in to fetch a post.');
      throw new Error('Unauthorized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${config.API_URL}/api/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedPost(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Pick images/videos from device
  const pickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert('Permission to access media library is required!');
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        return result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          width: asset.width,
          height: asset.height,
        }));
      }

      return [];
    } catch (err) {
      console.error('Error picking media:', err);
      setError('Failed to pick media');
      return [];
    }
  };

  // Refresh posts
  const refreshPosts = async (filter = 'all') => {
    await fetchPosts(filter, true);
  };

  // Load more posts
  const loadMorePosts = async (filter = 'all') => {
    if (hasMore && !loading) {
      await fetchPosts(filter);
    }
  };

  const fetchBookmarkedPosts = async (page = 1) => {
    if (!token) {
      setError('You must be logged in to fetch bookmarked posts.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/api/post`, {
        params: {
          page,
          limit: 10,
          filter: 'bookmarked',
          _t: new Date().getTime()
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { docs, hasNextPage, page: currentPage } = response.data.data;

      if (page === 1) {
        setBookmarkedPosts(docs);
      } else {
        setBookmarkedPosts(prev => [...prev, ...docs]);
      }

      setHasMore(hasNextPage);
      setPage(currentPage + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookmarked posts');
    } finally {
      setLoading(false);
    }
  };

  // Update post state after bookmark
  const updatePostBookmark = (postId, isBookmarked) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
              ...post,
              bookmarks: isBookmarked
                ? [...post.bookmarks, user._id]
                : post.bookmarks.filter(id => id !== user._id),
              bookmarkCount: isBookmarked
                ? post.bookmarkCount + 1
                : post.bookmarkCount - 1
            }
          : post
      )
    );
  };

  const addRepost = (repostData) => {
    setPosts(prevPosts => [repostData, ...prevPosts]);
  };

  const updatePostLikeStatus = (postId, isLiked, likeCount) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? { ...post, isLiked, likeCount }
          : post
      )
    );
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(prev => ({ ...prev, isLiked, likeCount }));
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        setPosts,
        bookmarkedPosts,
        loading,
        error,
        refreshing,
        hasMore,
        selectedPost,
        friends,
        filteredFriends, 
        createPost,
        fetchPosts,
        deletePost,
        reportPost,
        getPost,
        pickMedia,
        refreshPosts,
        loadMorePosts,
        clearError,
        setSelectedPost,
        fetchFriends, 
        filterFriends, 
        setFilteredFriends, 
        fetchBookmarkedPosts,
        updatePostBookmark,
        updatePostLikeStatus,
        addRepost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePost() {
  return useContext(PostContext);
}