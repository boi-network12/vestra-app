import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';


export default function CallScreen({
  chatId,
  recipient,
  callType,
  callerId,
  isIncoming,
  socket,
  user,
  onEndCall,
  colors,
}) {
  const [videoCall, setVideoCall] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const isInitiator = !isIncoming && callerId === user._id;

  // Agora connection data - you'll need to replace these with your actual values
  const [rtcProps, setRtcProps] = useState({
    appId: 'YOUR_AGORA_APP_ID',
    channel: chatId, // Using chatId as channel name
    token: null, // You can use null for testing, but in production use a token
    uid: user._id, // Using user ID as uid
  });

  // Agora callbacks
  const callbacks = {
    EndCall: () => {
      setVideoCall(false);
      handleEndCall();
    },
  };

  // Request permissions for camera and microphone
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  // End call
  const handleEndCall = () => {
    socket.emit('end-call', { chatId, recipientId: recipient._id });
    onEndCall();
  };

  // Toggle mute - will need to use Agora's methods
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // You'll need to implement Agora's mute functionality here
  };

  // Toggle camera - will need to use Agora's methods
  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    // You'll need to implement Agora's camera toggle functionality here
  };

  // Initialize the call
  useEffect(() => {
    const initializeCall = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.error('Permissions not granted');
        onEndCall();
        return;
      }

      // If you're the initiator, you might want to signal the other user
      // through your socket.io connection to join the Agora channel
      if (isInitiator) {
        socket.emit('agora-call-initiated', { 
          chatId, 
          recipientId: recipient._id,
          channel: chatId,
        });
      }
    };

    initializeCall();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  remoteVideo: {
    width: wp(80),
    height: hp(50),
    borderRadius: wp(2),
  },
  localVideo: {
    width: wp(30),
    height: hp(20),
    position: 'absolute',
    top: hp(10),
    right: wp(5),
    borderRadius: wp(2),
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: wp(80),
    marginTop: hp(2),
  },
  button: {
    padding: wp(3),
    borderRadius: wp(10),
  },
});