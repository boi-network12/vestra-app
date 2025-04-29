import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import PostViewHeader from '../../../../components/Headers/PostViewHeader';
import { usePostInteraction } from '../../../../contexts/PostInteractionContext';
import { usePost } from '../../../../contexts/PostContext';
import { Alert } from 'react-native';
import ActionModal from '../../../../components/SharedComponents/ActionModal';

const VideoPlaceholder = ({ uri }) => (
  <View style={styles.videoContainer}>
    <Text style={styles.videoPlaceholderText}>Video: {uri}</Text>
  </View>
);

export default function PostView() {
  const {
    id,
    content,
    username,
    profilePicture,
    location,
    media,
    likeCount,
    commentCount,
    shareCount,
    repostCount,
    viewCount,
    isLiked,
    createdAt,
    repost,
  } = useLocalSearchParams();
  
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { likePost, unlikePost, addComment, fetchComments, sharePost, repostPost, incrementViewCount, comments, bookmarkPost, removeBookmark } = usePostInteraction() || {};
  const { selectedPost, getPost, updatePostLikeStatus, addRepost, setPosts, updatePostBookmark, deletePost, posts  } = usePost();
  const colors = getThemeColors(isDark);
  const [commentText, setCommentText] = useState('');
  const [currentCommentCount, setCurrentCommentCount] = useState(parseInt(commentCount, 10) || 0);
  const [currentShareCount, setCurrentShareCount] = useState(parseInt(shareCount, 10) || 0);
  const [currentRepostCount, setCurrentRepostCount] = useState(parseInt(repostCount, 10) || 0);
  const [currentViewCount, setCurrentViewCount] = useState(parseInt(viewCount, 10) || 0);
  const repostData = repost ? JSON.parse(repost) : null;
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  

  const parsedMedia = media ? (typeof media === 'string' ? [{ url: media, type: 'image' }] : JSON.parse(media)) : []

  const post = selectedPost && selectedPost._id === id
    ? selectedPost
    : {
        _id: id,
        content,
        user: { username, profilePicture, _id: "" },
        location: { name: location },
        media: parsedMedia,
        likeCount: parseInt(likeCount, 10) || 0,
        commentCount: parseInt(commentCount, 10) || 0,
        shareCount: parseInt(shareCount, 10) || 0,
        repostCount: parseInt(repostCount, 10) || 0,
        viewCount: parseInt(viewCount, 10) || 0,
        isLiked: false, 
        createdAt,
        repost: repostData,
        bookmarks: [],
      };
      
      const [isPostLiked, setIsPostLiked] = useState(post.isLiked);
      const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount);

     useEffect(() => {
      if (id) {
        getPost(id);
        fetchComments(id);
        incrementViewCount(id)
          .then(() => updatePostLikeStatus(id, post.isLiked, post.likeCount))
          .catch(err => console.error('Failed to increment view count:', err));
      }
    }, [id]);
  
    // Update isPostLiked when selectedPost changes
    useEffect(() => {
      if (selectedPost && selectedPost._id === id) {
        setIsPostLiked(selectedPost.isLiked);
        setCurrentLikeCount(selectedPost.likeCount);
      }
    }, [selectedPost, id]);

    const handleBookmark = async () => {
      if (!post?._id || !post?.user?._id) return;
      try {
        const isBookmarked = post.bookmarks?.includes(user._id);
        if (isBookmarked) {
          await removeBookmark(post._id);
          updatePostBookmark(post._id, false);
        } else {
          await bookmarkPost(post._id);
          updatePostBookmark(post._id, true);
        }
      } catch (err) {
        console.error('Bookmark error:', err);
        Alert.alert('Error', 'Failed to update bookmark status');
      }
    };
  
    const handleDelete = async () => {
      try {
        await deletePost(post._id);
        Alert.alert('Success', 'Post deleted successfully');
        router.back();
      } catch (err) {
        console.error('Delete error:', err);
        Alert.alert('Error', 'Failed to delete post');
      }
    };
  
    const postActions = [
      ...(post.user._id === user._id
        ? [{
            label: 'Delete Post',
            icon: 'trash-outline',
            onPress: handleDelete,
            danger: true,
          }]
        : []),
      {
        label: posts.some(p => p.repost?._id === post._id && p.user._id === user._id) ? 'Unrepost' : 'Repost',
        icon: 'repeat-outline',
        onPress: posts.some(p => p.repost?._id === post._id && p.user._id === user._id) ? handleUnrepost : handleRepost,
      },
    ];
    
    const handleUnrepost = async () => {
      try {
        await unrepostPost(post._id);
        setCurrentRepostCount(prev => Math.max(0, prev - 1));
        setPosts(prevPosts => prevPosts.filter(
          p => !(p.repost?._id === post._id && p.user._id === user._id)
        ));
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p._id === post._id ? { ...p, repostCount: Math.max(0, (p.repostCount || 0) - 1) } : p
          )
        );
        Alert.alert('Success', 'Repost removed successfully');
      } catch (err) {
        Alert.alert('Error', 'Failed to unrepost');
      }
    };
  
    const shareActions = [
      {
        label: 'Share Now',
        icon: 'share-outline',
        onPress: handleShare,
      },
      {
        label: 'Repost',
        icon: 'repeat-outline',
        onPress: handleRepost,
      },
    ];

      const handleLike = async () => {
        try {
          const wasLiked = post.isLiked;
          // Optimistically update UI
          updatePostLikeStatus(post._id, !wasLiked, post.likeCount + (wasLiked ? -1 : 1));
    
          let response;
          if (wasLiked) {
            response = await unlikePost(post._id);
          } else {
            response = await likePost(post._id);
          }
    
          // Update state with server response
          updatePostLikeStatus(post._id, response.isLiked, response.likeCount);
        } catch (err) {
          // Revert UI on error
          updatePostLikeStatus(post._id, wasLiked, post.likeCount);
          Alert.alert('Error', err.response?.data?.message || 'Failed to update like status');
        }
      };


      const handleAddComment = async () => {
        if (!commentText.trim()) return;
        try {
          await addComment(post._id, { content: commentText });
          setCommentText('');
          updatePostLikeStatus(post._id, post.isLiked, post.likeCount); // Update comment count in context
          await fetchComments(post._id);
        } catch (err) {
          Alert.alert('Error', 'Failed to add comment');
        }
      };
    

      const handleShare = async () => {
        try {
          const shareData = { content: '', visibility: 'public' };
          await sharePost(post._id, shareData);
          updatePostLikeStatus(post._id, post.isLiked, post.likeCount); // Update share count in context
          Alert.alert('Success', 'Post shared successfully');
        } catch (err) {
          Alert.alert('Error', 'Failed to share post');
        }
      };

      const handleRepost = async () => {
        try {
          const repostData = { content: '', visibility: 'public' };
          const response = await repostPost(post._id, repostData);
          addRepost(response.data);
          setCurrentRepostCount(prev => prev + 1);
          setPosts(prevPosts =>
            prevPosts.map(p =>
              p._id === post._id ? { ...p, repostCount: (p.repostCount || 0) + 1 } : p
            )
          );
          Alert.alert('Success', 'Post reposted successfully');
        } catch (err) {
          Alert.alert('Error', 'Failed to repost');
        }
      };


  const renderComment = ({ item }) => (
    <View style={[styles.commentContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.commentHeader}>
        {item.user.profilePicture ? (
          <Image source={{ uri: item.user.profilePicture }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.commentInitials}>
              {item.user.name ? item.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.commentUserInfo}>
          <Text style={[styles.commentName, { color: colors.text }]}>{item.user.name || item.user.username}</Text>
          <Text style={[styles.commentTime, { color: colors.subText }]}>
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
      </View>
      <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
    </View>
  );

  const renderMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;
  
    const images = mediaItems.filter(item => item.type === 'image' || item.url.match(/\.(jpg|jpeg|png|gif)$/i));
    const videos = mediaItems.filter(item => item.type === 'video' || item.url.match(/\.(mp4|mov)$/i));
  
    // Twitter-like image grid logic
    const renderImageGrid = () => {
      if (images.length === 1) {
        return (
          <Image
            source={{ uri: images[0].url }}
            style={[styles.singleImage, { aspectRatio: 16/9 }]}
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? hp(6) : 0}
    >
      <PostViewHeader 
        colors={colors} 
        onOptionsPress={() => setModalVisible(true)}
      />

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item._id}
        ListHeaderComponent={
          <>
            <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
              <View style={styles.postHeader}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.initials}>
                      {username ? username[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: colors.text }]}>{username || 'Unknown User'}</Text>
                  <Text style={[styles.location, { color: colors.subText }]}>{location || 'Unknown Location'}</Text>
                </View>
                <Text style={[styles.timeAgo, { color: colors.subText }]}>
                  {moment(createdAt).fromNow()}
                </Text>
              </View>

              {post.quote && post.quote.user ? (
                <View style={[styles.quoteContainer, { borderLeftColor: colors.primary }]}>
                  <Text style={[styles.quoteLabel, { color: colors.subText }]}>
                    Quoted from @{post.quote.user.username}
                  </Text>
                  <Text style={[styles.content, { color: colors.text }]}>{post.quote.content}</Text>
                  {renderMedia(post.quote.media)}
                </View>
              ) : repostData && repostData.user ? (
                <View style={[styles.repostContainer, { borderLeftColor: colors.primary }]}>
                  <Text style={[styles.repostLabel, { color: colors.subText }]}>
                    Reposted from @{repostData.user.username}
                  </Text>
                  <Text style={[styles.content, { color: colors.text }]}>{repostData.content}</Text>
                  {renderMedia(repostData.media)}
                </View>
              ) : (
                <>
                  <Text style={[styles.content, { color: colors.text }]}>{content}</Text>
                  {renderMedia(post.media)}
                </>
              )}

              <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.statText, { color: colors.subText }]}>
                  {currentLikeCount} likes · {currentCommentCount} comments · {currentShareCount} shares ·{' '}
                  {currentRepostCount} reposts · {currentViewCount} views
                </Text>
              </View>

              <View style={[styles.actionBar, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  <Icon
                    name={isPostLiked ? 'heart' : 'heart-outline'}
                    size={wp(5.5)}
                    color={isPostLiked ? colors.errorText : colors.subText}
                  />
                  <Text style={[styles.actionText, { color: colors.subText }]}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="chatbubble-outline" size={wp(5)} color={colors.subText} />
                  <Text style={[styles.actionText, { color: colors.subText }]}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
                  <Icon name="repeat-outline" size={wp(5)} color={colors.subText} />
                  <Text style={[styles.actionText, { color: colors.subText }]}>Repost</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Icon name="share-outline" size={wp(5)} color={colors.subText} />
                  <Text style={[styles.actionText, { color: colors.subText }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.commentsHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments ({comments.length})</Text>
            </View>
          </>
        }
        style={styles.commentsList}
      />

      <View style={[styles.commentInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {user?.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.commentInputAvatar} />
        ) : (
          <View style={[styles.commentInputAvatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.commentInputInitials}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Write a comment..."
          placeholderTextColor={colors.placeholder}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
          <Icon name="send" size={wp(5)} color={commentText.trim() ? colors.primary : colors.subText} />
        </TouchableOpacity>
      </View>
      <ActionModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        actions={postActions}
        colors={colors}
        title="Post Options"
      />
      <ActionModal
        isVisible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        actions={shareActions}
        colors={colors}
        title="Share Options"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postContainer: {
    padding: wp(4),
    marginBottom: hp(1),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
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
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: wp(3),
  },
  avatarPlaceholder: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: wp(4),
    fontWeight: '600',
  },
  location: {
    fontSize: wp(3.2),
    marginTop: hp(0.2),
  },
  timeAgo: {
    fontSize: wp(3),
  },
  content: {
    fontSize: wp(4),
    lineHeight: hp(2.8),
    marginBottom: hp(2),
  },
  mediaContainer: {
    marginBottom: hp(2),
  },
  imageGrid: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: "center"
  },
  media: {
    borderRadius: 8,
  },
  videoScroll: {
    marginTop: hp(1),
  },
  videoContainer: {
    width: wp(90),
    height: hp(35),
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: wp(4),
  },
  statsContainer: {
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
  },
  statText: {
    fontSize: wp(3.5),
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: hp(1),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
  },
  actionText: {
    fontSize: wp(3.8),
    marginLeft: wp(1.5),
  },
  commentsHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  commentsTitle: {
    fontSize: wp(4),
    fontWeight: '600',
  },
  commentsList: {
    flex: 1,
  },
  commentContainer: {
    padding: wp(4),
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: hp(1),
  },
  commentAvatar: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    marginRight: wp(3),
  },
  commentAvatarPlaceholder: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInitials: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentName: {
    fontSize: wp(3.8),
    fontWeight: '600',
  },
  commentTime: {
    fontSize: wp(3),
    marginTop: hp(0.2),
  },
  commentText: {
    fontSize: wp(3.8),
    lineHeight: hp(2.5),
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    borderTopWidth: 1,
  },
  commentInputAvatar: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    marginRight: wp(3),
  },
  commentInputAvatarPlaceholder: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputInitials: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
    fontSize: wp(3.8),
    borderWidth: 1,
    marginRight: wp(3),
    maxHeight: hp(15),
  },
  repostContainer: {
    paddingLeft: wp(3),
    borderLeftWidth: 2,
    marginTop: hp(1),
    marginBottom: hp(1.5),
  },
  repostLabel: {
    fontSize: wp(3.5),
    marginBottom: hp(0.5),
    fontStyle: 'italic',
  },
  singleImage: {
    width: '100%',
    borderRadius: 8,
    marginBottom: hp(1),
  },
  twoImageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  twoImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  threeImageContainer: {
    flexDirection: 'row',
    height: hp(25),
    marginBottom: hp(1),
  },
  threeImageLeft: {
    width: '60%',
    height: '100%',
    borderRadius: 8,
    marginRight: wp(1),
  },
  threeImageRightContainer: {
    width: '38%',
    height: '100%',
    justifyContent: 'space-between',
  },
  threeImageRight: {
    width: '100%',
    height: '48%',
    borderRadius: 8,
  },
  fourImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  fourImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: hp(1),
  },
});