import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { PermissionsAndroid, Platform } from 'react-native';
import { AUDIO_RECORDING_OPTIONS } from '../../constants/audioConfig';
import { Alert } from 'react-native';
import { Linking } from 'react-native';


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


const requestAudioPermission = async () => {
  console.log('Requesting audio permissions...');
  try {
    if (Platform.OS === 'android') {
      const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
      let status = await PermissionsAndroid.check(permission);
      console.log('Android RECORD_AUDIO permission status:', status);

      if (!status) {
        const granted = await PermissionsAndroid.request(permission, {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record voice messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        console.log('Android permission request result:', granted);
        status = granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      if (!status) {
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Denied',
            'Microphone access is required. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      }

      // Explicitly request expo-av permission
      const avPermission = await Audio.requestPermissionsAsync();
      console.log('expo-av permission status:', avPermission.status);
      return avPermission.status === 'granted';
    } else if (Platform.OS === 'ios') {
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      console.log('iOS microphone permission status:', status);

      if (status === 'granted') {
        return true;
      }

      if (!canAskAgain) {
        Alert.alert(
          'Permission Denied',
          'Microphone access is required. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return false;
    }
    console.warn('Unsupported platform:', Platform.OS);
    return false;
  } catch (error) {
    console.error('Failed to request audio permission:', error);
    return false;
  }
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
  console.log('handleVoiceNote called, isRecording:', isRecording, 'recordingRef.current:', recordingRef?.current);
  
  try {
    if (isRecording) {
      // Stop recording logic
      console.log('Stopping recording...');
      clearInterval(recordingIntervalRef.current);
      
      if (!recordingRef?.current) {
        console.warn('No active recording to stop. Resetting state.');
        setIsRecording(false);
        setRecordingStatus('idle');
        recordingDurationRef.current = 0;
        setRecordingDuration(0);
        return;
      }

      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        console.log('Recording stopped, URI:', uri);
        
        if (!uri) {
          throw new Error('Failed to retrieve recorded audio URI');
        }

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Recorded file does not exist');
        }

        const newUri = `${FileSystem.cacheDirectory}voice_note_${Date.now()}.m4a`;
        await FileSystem.copyAsync({ from: uri, to: newUri });
        const newFileInfo = await FileSystem.getInfoAsync(newUri);

        const duration = recordingDurationRef.current;

        const voiceNote = {
          id: Date.now().toString(),
          uri: newUri,
          type: 'audio',
          name: `voice_note_${Date.now()}.m4a`,
          size: newFileInfo.size || 0, 
          duration: recordingDurationRef.current,
          mimeType: 'audio/x-m4a',
        };

        console.log('Adding voice note to selectedMedia:', voiceNote);
        setSelectedMedia(prev => [...prev, voiceNote]);
      } finally {
        // Cleanup regardless of success/failure
        recordingRef.current = null;
        setIsRecording(false);
        setRecordingStatus('idle');
        recordingDurationRef.current = 0;
        setRecordingDuration(0);
      }
    } else {
      // Start recording logic
      console.log('Starting recording...');
      
      // Request permissions
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      
      if (status !== 'granted') {
        if (!canAskAgain) {
          Alert.alert(
            'Permission Required',
            'Microphone access is required. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and configure new recording
      const recording = new Audio.Recording();
      recordingRef.current = recording;

      try {
        console.log('Preparing recording with options:', AUDIO_RECORDING_OPTIONS);
        await recording.prepareToRecordAsync(AUDIO_RECORDING_OPTIONS);
        console.log('Starting recording...');
        await recording.startAsync();
        
        // Update state
        setIsRecording(true);
        setRecordingStatus('recording');
        recordingDurationRef.current = 0;
        setRecordingDuration(0);
        
        // Start duration counter
        recordingIntervalRef.current = setInterval(() => {
          recordingDurationRef.current += 1;
          setRecordingDuration(recordingDurationRef.current);
          console.log('Recording duration:', recordingDurationRef.current);
        }, 1000);
        
      } catch (startError) {
        console.error('Failed to start recording:', startError);
        recordingRef.current = null;
        throw new Error('Unable to start recording: ' + startError.message);
      }
    }
  } catch (error) {
    console.error('Voice note error:', error);
    Alert.alert('Error', 'Failed to process voice note: ' + error.message);
    
    // Reset state on error
    setIsRecording(false);
    setRecordingStatus('idle');
    clearInterval(recordingIntervalRef.current);
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
    
    // Cleanup recording if it exists
    if (recordingRef?.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      recordingRef.current = null;
    }
  }
};