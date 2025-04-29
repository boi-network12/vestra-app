import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FollowContext = createContext();

export function FollowProvider({ children }) {
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Refresh follow data when user changes
  useEffect(() => {
    if (user) {
      fetchFollowers();
      fetchFollowing();
      fetchSuggestedFriends();
    } else {
      setFollowers([]);
      setFollowing([]);
    }
  }, [user]);

  const makeAuthenticatedRequest = async (endpoint, method = 'GET', body = null) => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${config.API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggested friends
const fetchSuggestedFriends = async () => {
  try {
    setSuggestionsLoading(true);
    const data = await makeAuthenticatedRequest('/api/friends/suggested');
    setSuggestedFriends(data.data || []);
    return { success: true };
  } catch (err) {
    console.error('Failed to fetch suggested friends:', err);
    setError(err.message || 'Failed to load suggestions');
    return { success: false, error: err.message };
  } finally {
    setSuggestionsLoading(false);
  }
};

  // Fetch followers list
  // Fetch followers list
const fetchFollowers = async () => {
  try {
    const data = await makeAuthenticatedRequest('/api/friends/followers'); // Remove config.API_URL
    setFollowers(data.data || []);
  } catch (err) {
    console.error('Failed to fetch followers:', err);
  }
};

// Fetch following list
const fetchFollowing = async () => {
  try {
    const data = await makeAuthenticatedRequest('/api/friends/following'); // Remove config.API_URL
    setFollowing(data.data || []);
  } catch (err) {
    console.error('Failed to fetch following:', err);
  }
};

 // Update the followUser and unfollowUser functions to return more data
 const followUser = useCallback(async (userId) => {
  try {
    const data = await makeAuthenticatedRequest('/api/friends', 'POST', { userId });
    await Promise.all([fetchFollowers(), fetchFollowing()]);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to follow user:', err);
    return { success: false, error: err.message };
  }
}, [makeAuthenticatedRequest, fetchFollowers, fetchFollowing]);

const unfollowUser = useCallback(async (userId) => {
  try {
    const data = await makeAuthenticatedRequest(`/api/friends/${userId}`, 'DELETE');
    await Promise.all([fetchFollowers(), fetchFollowing()]);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to unfollow user:', err);
    return { success: false, error: err.message };
  }
}, [makeAuthenticatedRequest, fetchFollowers, fetchFollowing]);

// Update checkFollowStatus to be more reliable
const checkFollowStatus = async (userId) => {
  try {
    const data = await makeAuthenticatedRequest(`/api/friends/status/${userId}`);
    return {
      status: data.status || 'not_following',
      isFollowingMe: data.isFollowingMe || false,
    };
  } catch (err) {
    console.error('Failed to check follow status:', err);
    return { status: 'error', isFollowingMe: false };
  }
};


  return (
    <FollowContext.Provider
      value={{
        followers,
        following,
        loading,
        error,
        followUser,
        unfollowUser,
        fetchFollowers,
        fetchFollowing,
        checkFollowStatus,
        suggestedFriends,
        suggestionsLoading,
        fetchSuggestedFriends,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  return useContext(FollowContext);
}