import { Platform, SafeAreaView, StyleSheet, Text, View, StatusBar as RNStatusBar, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useNavigation, router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { useAuth } from '../../../contexts/AuthContext';
import PostHeader from '../../../components/Headers/PostHeader';
import { Ionicons, MaterialIcons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { usePost } from '../../../contexts/PostContext';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import debounce from 'lodash.debounce';
import * as FileSystem from 'expo-file-system';




export default function Posts() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { user } = useAuth();
  const {
    createPost,
    clearError,
    fetchFriends, // Use from context
    friends, // Use from context
    filteredFriends, // Use from context
    filterFriends, // Use from context
    setFilteredFriends, // Use from context
  } = usePost();
  
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [visibility, setVisibility] = useState('public');
  const [isNSFW, setIsNSFW] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('')
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!user?.token) {
    Alert.alert('Error', 'You must be logged in to fetch friends.');
    return;
  }

  // Debounced search function
  const debouncedSearch = debounce((query) => {
    filterFriends(query); // Use context's filterFriends
  }, 300);

   // Handle text input changes
   const handleTextChange = (text) => {
    setContent(text);

    // Detect @ and extract query
    const lastWord = text.split(' ').pop();
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1); // Remove @
      setMentionQuery(query);
      setShowFriendsDropdown(true);
      debouncedSearch(query);
      if (friends.length === 0) {
        fetchFriends();
      }
    } else {
      setShowFriendsDropdown(false);
      setMentionQuery('');
      setFilteredFriends(friends);
    }
  };

  // Select a friend to tag
  const selectFriend = (friend) => {
    if (!taggedUsers.find((u) => u._id === friend._id)) {
      setTaggedUsers([...taggedUsers, friend]);
    }

    // Replace the @mention with the username
    const words = content.split(' ');
    words[words.length - 1] = `@${friend.username}`;
    setContent(words.join(' '));
    setShowFriendsDropdown(false);
    setMentionQuery('');
    textInputRef.current?.focus();
  };

  const handleSubmitPost = async () => {
    setLoading(true);
    if (content.trim().length === 0 && media.length === 0) {
      Alert.alert('Error', 'Please add content or media to your post.');
      return;
    }

    try {
      const postData = {
        content: content.trim(),
        media,
        visibility,
        isNSFW,
        taggedUsers: taggedUsers.map(user => user._id), 
      };

      if (locationName.trim()) {
        postData.location = {
          name: locationName.trim(),
        };
      }


      await createPost(postData);

      // Reset form on success
      setContent('');
      setMedia([]);
      setVisibility('public');
      setIsNSFW(false);
      setTaggedUsers([]);
      setLocationName('');
      setShowFriendsDropdown(false);
      textInputRef.current?.clear();

      Alert.alert('Success', 'Post created successfully!');
    } catch (err) {
      console.error('Post Submission Error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create post.';
      if (errorMessage.includes('Media file is too large')) {
        Alert.alert('Error', 'One or more media files exceed the 12MB limit.');
      } else if (errorMessage.includes('Content moderation failed')) {
        Alert.alert('Error', 'Unable to process media due to a network issue. Please try again later.');
      } else if (errorMessage.includes('Unsupported file format')) {
        Alert.alert('Error', 'One or more media files have an unsupported format. Use JPEG, PNG, GIF, MP4, or MOV.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false)
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required!');
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      });
  
      if (!result.canceled) {
        const MAX_SIZE_BYTES = 12 * 1024 * 1024; // 12MB
        const newMedia = [];
  
        for (const asset of result.assets) {
          console.log(`Processing asset: ${asset.uri}, type: ${asset.type}, size: ${asset.fileSize || 'unknown'}`);
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  
          if (!fileInfo.exists) {
            console.warn(`File does not exist: ${asset.uri}`);
            Alert.alert('Error', `File ${asset.uri} is invalid or inaccessible.`);
            continue;
          }
  
          if (fileInfo.size > MAX_SIZE_BYTES) {
            console.warn(`File too large: ${asset.uri}, size: ${fileInfo.size} bytes`);
            Alert.alert('Error', `File ${asset.uri} exceeds 12MB limit.`);
            continue;
          }
  
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
          if (!allowedTypes.includes(asset.mimeType)) {
            console.warn(`Invalid file type: ${asset.uri}, mimeType: ${asset.mimeType}`);
            Alert.alert('Error', `File ${asset.uri} has an unsupported format.`);
            continue;
          }
  
          console.log(`Adding valid file: ${asset.uri}, size: ${fileInfo.size} bytes`);
          newMedia.push({
            uri: asset.uri,
            type: asset.type,
            mimeType: asset.mimeType,
            width: asset.width,
            height: asset.height,
          });
        }
  
        if (newMedia.length === 0 && result.assets.length > 0) {
          Alert.alert('Error', 'No valid files were selected. All files were either too large or invalid.');
        } else {
          setMedia([...media, ...newMedia]);
          console.log(`Total media files: ${[...media, ...newMedia].length}`);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to process media selection.');
    }
  };


  const removeMedia = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const toggleVisibility = () => {
    const options = ['public', 'friends', 'private'];
    const currentIndex = options.indexOf(visibility);
    const nextIndex = (currentIndex + 1) % options.length;
    setVisibility(options[nextIndex]);
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <MaterialIcons name="public" size={hp(2.5)} color={colors.primary} />;
      case 'friends':
        return <MaterialIcons name="people" size={hp(2.5)} color={colors.primary} />;
      case 'private':
        return <MaterialIcons name="lock" size={hp(2.5)} color={colors.primary} />;
      default:
        return <MaterialIcons name="public" size={hp(2.5)} color={colors.primary} />;
    }
  };

  const getVisibilityText = () => {
    switch (visibility) {
      case 'public':
        return 'Everyone';
      case 'friends':
        return 'Friends';
      case 'private':
        return 'Only me';
      default:
        return 'Everyone';
    }
  };

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <PostHeader
        colors={colors}
        navigation={navigation}
        router={router}
        user={user}
        handleSubmitPost={handleSubmitPost}
        disabled={content.trim().length === 0 && media.length === 0 && loading}
      />

      <ScrollView 
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.postContainer, { backgroundColor: colors.background }]}>
          {/* User info */}
          <View style={styles.userInfoContainer}>
            <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
              {user.profilePicture ? (
                <Image
                  source={{ uri: user?.profilePicture || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.initials}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfoText}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
              <TouchableOpacity 
                style={[styles.visibilityButton, { backgroundColor: colors.card }]}
                onPress={toggleVisibility}
              >
                {getVisibilityIcon()}
                <Text style={[styles.visibilityText, { color: colors.primary }]}>
                  {getVisibilityText()}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={hp(2.5)} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Post content */}
          <TextInput
            ref={textInputRef}
            style={[styles.postInput, { color: colors.text }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.placeholder}
            multiline
            value={content}
            onChangeText={handleTextChange}
            textAlignVertical="top"
            autoFocus
          />

          {/* Media preview */}
          {media.length > 0 && (
            <View style={styles.mediaContainer}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.videoContainer, { backgroundColor: colors.card }]}>
                      <MaterialIcons name="videocam" size={hp(5)} color={colors.primary} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.removeMediaButton, { backgroundColor: colors.errorBg }]}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close" size={hp(2)} color={colors.errorText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Tagged users */}
          {taggedUsers.length > 0 && (
            <View style={[styles.taggedUsersContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="people" size={hp(2)} color={colors.primary} />
              <Text style={[styles.taggedUsersText, { color: colors.primary }]}>
                {taggedUsers.map(user => user.name).join(', ')}
              </Text>
            </View>
          )}

          {/* Location */}
          {location && (
            <View style={[styles.locationContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="location-sharp" size={hp(2)} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primary }]}>
                {location.name}
              </Text>
            </View>
          )}

          {/* NSFW warning */}
          {isNSFW && (
            <View style={[styles.nsfwWarning, { backgroundColor: colors.errorBg }]}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={hp(2.5)} 
                color={colors.errorText} 
              />
              <Text style={[styles.nsfwText, { color: colors.errorText }]}>
                Sensitive content
              </Text>
            </View>
          )}

          {/* Post options */}
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.optionsTitle, { color: colors.subText }]}>Add to your post</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={pickImage}
              >
                <Feather name="image" size={hp(3)} color="#45BD62" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton}>
                <Feather name="user-plus" size={hp(3)} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton}
                 onPress={() => setLocationName(locationName ? '' : 'Custom Location')} 
              >
                <FontAwesome name="map-marker" size={hp(3)} color="#F3425F" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => setIsNSFW(!isNSFW)}
              >
                <MaterialCommunityIcons 
                  name={isNSFW ? "eye-off" : "eye"} 
                  size={hp(3)} 
                  color={isNSFW ? colors.errorText : "#F7B928"} 
                />
              </TouchableOpacity>
            </View>
          </View>
          {locationName && (
            <TextInput
              style={[styles.locationInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Enter location name"
              placeholderTextColor={colors.placeholder}
              value={locationName}
              onChangeText={setLocationName}
            />
          )}
          {showFriendsDropdown && (
            <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <ScrollView style={styles.dropdownScroll}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <TouchableOpacity
                      key={friend._id}
                      style={styles.dropdownItem}
                      onPress={() => selectFriend(friend)}
                    >
                      <Text style={[styles.dropdownText, { color: colors.text }]}>
                        {friend.name} (@{friend.username})
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.noResultsText, { color: colors.subText }]}>
                    No friends found
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  postContainer: {
    padding: hp(2),
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  profileImageContainer: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
},
initials: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
},
  profileImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  userInfoText: {
    marginLeft: hp(1.5),
    flex: 1,
  },
  userName: {
    fontSize: hp(2.2),
    fontWeight: '600',
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.5),
    borderRadius: hp(0.5),
    alignSelf: 'flex-start',
  },
  visibilityText: {
    fontSize: hp(1.4),
    marginLeft: hp(0.5),
    marginRight: hp(0.3),
    fontWeight: '500',
  },
  postInput: {
    fontSize: hp(2),
    minHeight: hp(15),
    paddingVertical: hp(1),
    lineHeight: hp(3),
    fontWeight: '400',
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1),
    gap: wp(2),
  },
  mediaItem: {
    width: wp(30),
    height: wp(30),
    borderRadius: hp(1.5),
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: hp(1.5),
  },
  removeMediaButton: {
    position: 'absolute',
    top: hp(0.5),
    right: hp(0.5),
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  taggedUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1),
    borderRadius: hp(1.5),
    marginTop: hp(1),
    alignSelf: 'flex-start',
    gap: wp(1.5),
  },
  taggedUsersText: {
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1),
    borderRadius: hp(1.5),
    marginTop: hp(1),
    alignSelf: 'flex-start',
    gap: wp(1.5),
  },
  locationText: {
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  optionsContainer: {
    padding: hp(2),
    borderRadius: hp(0.5),
    marginTop: hp(2),
  },
  optionsTitle: {
    fontSize: hp(1.8),
    marginBottom: hp(1.5),
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
  },
  optionButton: {
    padding: hp(1.5),
    borderRadius: hp(1),
  },
  nsfwWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    borderRadius: hp(1.5),
    marginTop: hp(1),
    gap: wp(2),
  },
  nsfwText: {
    fontSize: hp(1.8),
    fontWeight: '500',
  },
  locationInput: { 
    fontSize: hp(2), 
    padding: hp(1), 
    borderWidth: 1, 
    borderRadius: hp(1.5), 
    marginTop: hp(1) 
  },
  dropdownContainer: {
    maxHeight: hp(20),
    borderRadius: hp(1.5),
    marginTop: hp(1),
    borderWidth: 1,
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  dropdownItem: {
    padding: hp(1.5),
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: hp(2),
    fontWeight: '500',
  },
  noResultsText: {
    fontSize: hp(1.8),
    padding: hp(1.5),
    textAlign: 'center',
  },
});