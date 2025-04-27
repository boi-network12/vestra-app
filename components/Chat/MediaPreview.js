import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video } from 'expo-av';
import { hp, wp } from '../../utils/responsive';

const MediaPreview = ({ media, onRemove, colors }) => {
  const getMediaType = () => {
    const ext = media.name?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', '3gp'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
    return 'file';
  };

  const renderMedia = () => {
    const type = media.type || getMediaType();
    if (type === 'image') {
      return <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} resizeMode="cover" />;
    } else if (type === 'video') {
      return (
        <View style={styles.videoPreviewContainer}>
          <Video
            source={{ uri: media.uri }}
            style={styles.videoPreview}
            resizeMode="cover"
            shouldPlay={false}
            isMuted={true}
            useNativeControls={false}
          />
          <Ionicons name="play" size={hp(5)} color="white" style={styles.videoPlayIcon} />
        </View>
      );
    } else {
      return (
        <View style={[styles.filePreviewContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="document" size={hp(5)} color={colors.primary} />
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
            {media.name}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.mediaPreviewContainer}>
      {renderMedia()}
      <TouchableOpacity style={styles.removeMediaButton} onPress={() => onRemove(media.id)}>
        <Ionicons name="close-circle" size={hp(3)} color={colors.errorText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mediaPreviewContainer: {
    position: 'relative',
    marginRight: wp(2),
  },
  mediaPreviewImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  videoPreviewContainer: {
    position: 'relative',
  },
  videoPreview: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -wp(4),
    marginTop: -wp(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(6),
    padding: wp(1),
  },
  filePreviewContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(2),
  },
  fileName: {
    fontSize: hp(1.4),
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(5),
    padding: wp(0.5),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default MediaPreview;