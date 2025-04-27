import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import * as Linking from 'expo-linking';
import { hp, wp } from '../../utils/responsive';

const MediaPreview = ({ file, colors, isCurrentUser }) => {
  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';
  const isGif = file.type === 'gif' || (file.url && file.url.endsWith('.gif'));
  const isDocument = file.type === 'file' || file.type === 'audio';

  // Request permissions for downloading
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download files.'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Download the media file
  const handleDownload = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const fileName = file.name || file.url.split('/').pop();
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(file.url, downloadPath);

      // Save to media library (for images, videos, GIFs)
      if (isImage || isVideo || isGif) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', `${fileName} has been downloaded to your gallery.`);
      } else {
        // For documents, notify user of download location
        Alert.alert(
          'Success',
          `${fileName} has been downloaded to your device storage.`
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download the file.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format audio duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render media preview based on type
  const renderMedia = () => {
    if (isImage || isGif) {
      return (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: file.url }}
            style={styles.media}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Ionicons name="download" size={hp(2.5)} color={colors.background} />
          </TouchableOpacity>
        </View>
      );
    }

    if (isVideo) {
      return (
        <TouchableOpacity
          style={styles.mediaContainer}
          onPress={() => Linking.openURL(file.url)}
        >
          {file.thumbnail ? (
            <Image
              source={{ uri: file.thumbnail }}
              style={styles.media}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.media, styles.videoFallback, { backgroundColor: colors.card }]}
            >
              <Ionicons name="play" size={hp(5)} color={colors.text} />
            </View>
          )}
          <Ionicons
            name="play"
            size={hp(4)}
            color={colors.background}
            style={styles.videoPlayIcon}
          />
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Ionicons name="download" size={hp(2.5)} color={colors.background} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (isDocument) {
      const isAudio = file.type === 'audio';
      return (
        <TouchableOpacity
          style={[
            styles.documentContainer,
            isCurrentUser ? styles.currentUserDocument : styles.otherUserDocument,
            { backgroundColor: isCurrentUser ? colors.card : colors.background },
          ]}
          onPress={async () => {
            if (isAudio) {
              try {
                const soundObject = new Audio.Sound();
                await soundObject.loadAsync({ uri: file.url });
                Alert.alert(
                  'Voice Message',
                  `Duration: ${formatDuration(file.duration || 0)}`,
                  [
                    {
                      text: 'Play',
                      onPress: async () => await soundObject.playAsync(),
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: async () => await soundObject.unloadAsync(),
                    },
                  ]
                );
              } catch (error) {
                Alert.alert('Error', 'Could not play audio message');
              }
            } else {
              Linking.openURL(file.url);
            }
          }}
        >
          <Ionicons
            name={isAudio ? 'musical-notes' : 'document'}
            size={hp(4)}
            color={isCurrentUser ? colors.background : colors.primary}
          />
          <View style={styles.documentInfo}>
            <Text
              style={[
                styles.documentName,
                { color: isCurrentUser ? colors.background : colors.text },
              ]}
              numberOfLines={1}
            >
              {isAudio ? 'Voice Message' : file.name}
            </Text>
            {isAudio ? (
              <Text
                style={[
                  styles.documentSize,
                  { color: isCurrentUser ? colors.subText : colors.subText },
                ]}
              >
                {formatDuration(file.duration || 0)}
              </Text>
            ) : (
              <Text
                style={[
                  styles.documentSize,
                  { color: isCurrentUser ? colors.subText : colors.subText },
                ]}
              >
                {formatFileSize(file.size)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Ionicons name="download" size={hp(2.5)} color={colors.background} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return <View style={styles.container}>{renderMedia()}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(0.5),
  },
  mediaContainer: {
    position: 'relative',
    width: wp(60),
    height: hp(25),
    borderRadius: wp(3),
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  videoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -wp(3),
    marginTop: -wp(3),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(6),
    padding: wp(1),
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2.5),
    borderRadius: wp(3),
  },
  currentUserDocument: {
    justifyContent: 'flex-end',
  },
  otherUserDocument: {
    justifyContent: 'flex-start',
  },
  documentInfo: {
    flex: 1,
    marginHorizontal: wp(2),
  },
  documentName: {
    fontSize: hp(1.7),
    fontWeight: '500',
  },
  documentSize: {
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
  downloadButton: {
    position: 'absolute',
    top: hp(1),
    right: wp(1),
    padding: wp(1.5),
    borderRadius: wp(5),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default MediaPreview;