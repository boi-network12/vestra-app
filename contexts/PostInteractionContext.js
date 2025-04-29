// contexts/PostInteractionContext.js
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import config from '../config';

const PostInteractionContext = createContext();

export function PostInteractionProvider({ children }) {
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const processingPosts = new Set();

  const token = user?.token;

  // Like a post
  const likePost = async (postId) => {
    if (processingPosts.has(postId)) return; // Prevent multiple requests
    processingPosts.add(postId);
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to like post');
      throw err;
    } finally {
      setLoading(false);
      processingPosts.delete(postId);
    }
  };

  // Unlike a post
  const unlikePost = async (postId) => {
    if (processingPosts.has(postId)) return; // Prevent multiple requests
    processingPosts.add(postId);
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `${config.API_URL}/api/post/${postId}/like`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlike post');
      throw err;
    } finally {
      setLoading(false);
      processingPosts.delete(postId);
    }
  };

  // Add a comment to a post
  const addComment = async (postId, commentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/comments`,
        commentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComments((prevComments) => [response.data.data, ...prevComments]);

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Share a post
  const sharePost = async (postId, shareData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/share`,
        shareData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get comments for a post
  const fetchComments = async (postId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${config.API_URL}/api/post/${postId}/comments`,
        {
          params: { page, limit: 10 },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComments((prevComments) =>
        page === 1
          ? response.data.data.docs
          : [...prevComments, ...response.data.data.docs]
      );

      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch comments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Repost a post
  const repostPost = async (postId, repostData) => {
    console.log('Reposting post:', postId, repostData);
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/repost`,
        repostData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Repost response:', response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to repost post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Unrepost a post
  const unrepostPost = async (postId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `${config.API_URL}/api/post/${postId}/repost`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unrepost post');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  // Bookmark a post
  const bookmarkPost = async (postId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/bookmark`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bookmark post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove bookmark
  const removeBookmark = async (postId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `${config.API_URL}/api/post/${postId}/bookmark`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove bookmark');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Increment view count
  const incrementViewCount = async (postId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/view`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to increment view count');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const quotePost = async (postId, formData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/api/post/${postId}/quote`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to quote post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };


  return (
    <PostInteractionContext.Provider
      value={{
        loading,
        error,
        comments,
        likePost,
        unlikePost,
        addComment,
        sharePost,
        fetchComments,
        repostPost,
        bookmarkPost,
        removeBookmark,
        incrementViewCount,
        clearError,
        unrepostPost,
        quotePost,
      }}
    >
      {children}
    </PostInteractionContext.Provider>
  );
}

export function usePostInteraction() {
  return useContext(PostInteractionContext);
}