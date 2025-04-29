import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { usePostInteraction } from '../../../contexts/PostInteractionContext';
import { usePost } from '../../../contexts/PostContext';

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
  const parsedMedia = media ? JSON.parse(media) : [];
  const repostData = repost ? JSON.parse(repost) : null;

  // Parse the media and repost data
  


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

      <View style={[styles.quotedPost, { backgroundColor: colors.card }]}>
        <Text style={[styles.quotedUsername, { color: colors.text }]}>@{username}</Text>
        {repostData && repostData.user ? (
          <>
            <Text style={[styles.repostLabel, { color: colors.subText }]}>
              Reposted from @{repostData.user.username}
            </Text>
            <Text style={[styles.quotedContent, { color: colors.text }]}>{repostData.content}</Text>
            {repostData.media && repostData.media.length > 0 && (
              <Image
                source={{ uri: repostData.media[0].url }}
                style={styles.quotedMedia}
              />
            )}
          </>
        ) : (
          <>
            <Text style={[styles.quotedContent, { color: colors.text }]}>{content}</Text>
            {media && (
              <Image source={{ uri: media }} style={styles.quotedMedia} />
            )}
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
    borderWidth: 1,
    borderColor: '#ccc',
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
});