import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp } from '../../utils/responsive';

const RecordingIndicator = ({ recordingStatus, recordingDuration, colors, onStop }) => {
  if (recordingStatus !== 'recording') return null;

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]}>
      <View style={styles.recordingDot} />
      <Text style={[styles.recordingText, { color: colors.background }]}>
        Recording: {formatDuration(recordingDuration)}
      </Text>
      <TouchableOpacity onPress={onStop} style={styles.stopRecordingButton}>
        <Ionicons name="stop" size={hp(3)} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    justifyContent: 'center',
  },
  recordingDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: '#FFFFFF',
    marginRight: wp(2),
  },
  recordingText: {
    fontSize: hp(1.8),
    fontWeight: '600',
    marginRight: wp(3),
  },
  stopRecordingButton: {
    position: 'absolute',
    right: wp(3),
  },
});

export default RecordingIndicator;