import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { usePostInteraction } from '../../../contexts/PostInteractionContext';
import { usePost } from '../../../contexts/PostContext';

const VideoPlaceholder = ({ uri }) => (
  <View style={styles.videoContainer}>
    <Text style={styles.videoPlaceholderText}>Video: {uri}</Text>
  </View>
);

export default function QuotePostScreen() {
  const { id, content, username, media, repost } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { quotePost } = usePostInteraction();
  const { addRepost, getPost } = usePost();
  const [quoteContent, setQuoteContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [post, setPost] = useState(null);

  // Parse the media and repost data
  const parsedMedia = media ? JSON.parse(media) : [];
  const repostData = repost ? JSON.parse(repost) : null;

  
  
    // Reuse the media rendering logic from post.js
    const renderMedia = (mediaItems) => {
      if (!mediaItems || mediaItems.length === 0) return null;
    
      const images = mediaItems.filter(item => item.type === 'image' || item.url.match(/\.(jpg|jpeg|png|gif)$/i));
      const videos = mediaItems.filter(item => item.type === 'video' || item.url.match(/\.(mp4|mov)$/i));
    
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
  

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPost(id);
        setPost(postData);
      } catch (err) {
        console.error('Fetch post error:', err);
        Alert.alert('Error', 'Failed to load post');
      }
    };
    fetchPost();
  }, [id]);
  

  const pickMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        setSelectedMedia(result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          width: asset.width,
          height: asset.height,
        })));
      }
    } catch (err) {
      console.error('Error picking media:', err);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handleQuotePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', quoteContent);
      formData.append('visibility', 'public');

      if (selectedMedia.length > 0) {
        selectedMedia.forEach((media, index) => {
          formData.append('media', {
            uri: media.uri,
            name: `media_${index}.${media.type === 'image' ? 'jpg' : 'mp4'}`,
            type: `${media.type}/${media.type === 'image' ? 'jpeg' : 'mp4'}`
          });
        });
      }

      const response = await quotePost(id, formData);
      addRepost(response.data);
      Alert.alert('Success', 'Post quoted successfully');
      router.back();
    } catch (err) {
      console.error('Quote post error:', err);
      Alert.alert('Error', 'Failed to quote post');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="close" size={hp(3)} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postButton, { backgroundColor: colors.primary }]}
          onPress={handleQuotePost}
          disabled={!quoteContent.trim() && selectedMedia.length === 0}
        >
          <Text style={styles.postButtonText}>Quote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Add your comment..."
          placeholderTextColor={colors.placeholder}
          value={quoteContent}
          onChangeText={setQuoteContent}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
        <Icon name="image-outline" size={hp(3)} color={colors.primary} />
        <Text style={[styles.mediaButtonText, { color: colors.primary }]}>Add Media</Text>
      </TouchableOpacity>

      {selectedMedia.length > 0 && (
        <View style={styles.mediaPreview}>
          {selectedMedia.map((media, index) => (
            <Image
              key={index}
              source={{ uri: media.uri }}
              style={styles.mediaPreviewImage}
            />
          ))}
        </View>
      )}

      <View style={[styles.quotedPost, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.quotedUsername, { color: colors.text }]}>@{username}</Text>
        {repostData && repostData.user ? (
          <>
            <Text style={[styles.repostLabel, { color: colors.subText }]}>
              Reposted from @{repostData.user.username}
            </Text>
            <Text style={[styles.quotedContent, { color: colors.text }]}>{repostData.content}</Text>
            {repostData.media && renderMedia(repostData.media)}
          </>
        ) : (
          <>
            <Text style={[styles.quotedContent, { color: colors.text }]}>{content}</Text>
            {parsedMedia.length > 0 && renderMedia(parsedMedia)}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? hp(8) : hp(5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  postButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 20,
  },
  postButtonText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: wp(3),
    fontSize: wp(4),
    minHeight: hp(15),
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    marginVertical: hp(1),
  },
  mediaButtonText: {
    fontSize: wp(4),
    marginLeft: wp(2),
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(4),
  },
  mediaPreviewImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: 10,
    margin: wp(1),
  },
  quotedPost: {
    marginHorizontal: wp(4),
    padding: wp(3),
    borderRadius: 10,
    borderWidth: 1
  },
  quotedUsername: {
    fontSize: wp(4),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  quotedContent: {
    fontSize: wp(3.8),
    marginBottom: hp(1),
  },
  quotedMedia: {
    width: '100%',
    height: hp(20),
    borderRadius: 10,
  },
  repostLabel: {
    fontSize: wp(3.5),
    marginBottom: hp(0.5),
    fontStyle: 'italic',
  },
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
});