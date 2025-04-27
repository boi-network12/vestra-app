import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { PermissionsAndroid, Platform } from 'react-native';
import { AUDIO_RECORDING_OPTIONS } from '../../constants/audioConfig';


export const checkPermissions = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (result.canceled) {
      console.log('Permission not granted or user canceled');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

export const handleSelectMedia = async (type, setSelectedMedia, setMediaModalVisible) => {
  try {
    let result;
    if (type === 'photo') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
    } else if (type === 'video') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileUri = asset.uri.startsWith('file://') ? asset.uri : `file://${asset.uri}`;

      const mediaItem = {
        id: Date.now().toString(),
        uri: fileUri,
        type: type === 'photo' ? 'image' : 'video',
        name: asset.uri ? asset.uri.split('/').pop() : `media_${Date.now()}`,
        size: asset.fileSize || 0,
      };

      if (type === 'video') {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(mediaItem.uri, { time: 1000 });
          mediaItem.thumbnail = uri;
        } catch (e) {
          console.error('Error generating video thumbnail:', e);
        }
      }

      if (type === 'photo' && asset.fileSize > 2 * 1024 * 1024) {
        const compressedImage = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        mediaItem.uri = compressedImage.uri;
        mediaItem.size = compressedImage.size || asset.fileSize;
      }

      setSelectedMedia(prev => [...prev, mediaItem]);
      setMediaModalVisible(false)
    }
  } catch (error) {
    console.error('Error selecting media:', error);
  }
};

export const handleSelectDocument = async (setSelectedMedia, setMediaModalVisible) => {
  const hasPermission = await checkPermissions();
  if (!hasPermission) return;

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'audio/*',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const document = result.assets[0];
      let fileType = 'file';
      if (document.mimeType?.startsWith('audio/')) {
        fileType = 'audio';
      }

      const fileItem = {
        id: Date.now().toString(),
        uri: document.uri,
        type: fileType,
        name: document.name || `document_${Date.now()}`,
        size: document.size || 0,
        mimeType: document.mimeType || 'application/octet-stream',
      };

      if (fileType === 'audio') {
        try {
          const sound = new Audio.Sound();
          await sound.loadAsync({ uri: document.uri });
          const status = await sound.getStatusAsync();
          fileItem.duration = status.durationMillis / 1000;
          await sound.unloadAsync();
        } catch (audioError) {
          console.error('Error getting audio duration:', audioError);
        }
      }

      setSelectedMedia(prev => [...prev, fileItem]);
      setMediaModalVisible(false)
    }
  } catch (error) {
    console.error('Error selecting document:', error);
  }
};

export const requestAudioPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Check if permission is already granted
      const permissionStatus = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (permissionStatus) {
        return true;
      }

      // Request permission if not granted
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone for voice messages',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Failed to request audio permission:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    // For iOS, check microphone permission using expo-av
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }
  return true;
};

export const handleVoiceNote = async (
  isRecording,
  recordingRef,
  setIsRecording,
  setRecordingStatus,
  setSelectedMedia,
  recordingDurationRef,
  recordingIntervalRef,
  setRecordingDuration
) => {
  if (!recordingRef) {
    console.error('handleVoiceNote: recordingRef is undefined');
    setIsRecording(false);
    setRecordingStatus('idle');
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
    return;
  }

  console.log('handleVoiceNote recordingRef:', recordingRef);
  try {
    if (isRecording) {
      clearInterval(recordingIntervalRef.current);
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        const duration = recordingDurationRef.current;

        const voiceNote = {
          id: Date.now().toString(),
          uri,
          type: 'audio',
          name: `voice_note_${Date.now()}.m4a`,
          size: 0,
          duration,
          mimeType: 'audio/x-m4a',
        };

        setSelectedMedia([voiceNote]);
        recordingRef.current = null;
      }
      setIsRecording(false);
      setRecordingStatus('idle');
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
    } else {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        console.log('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(AUDIO_RECORDING_OPTIONS);

      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordingStatus('recording');

      recordingIntervalRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to handle voice note:', error);
    setIsRecording(false);
    setRecordingStatus('idle');
    clearInterval(recordingIntervalRef.current);
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
  }
};