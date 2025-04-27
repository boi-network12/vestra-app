import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp } from '../../utils/responsive';

const ReplyPreview = ({ replyingTo, user, recipient, colors, onClose }) => {
  if (!replyingTo) return null;

  return (
    <View style={[styles.replyPreviewContainer, { backgroundColor: colors.card }]}>
      <View style={styles.replyPreviewContent}>
        <Text style={[styles.replyPreviewSender, { color: colors.text }]}>
          Replying to {replyingTo.sender === user._id ? 'yourself' : recipient.name}
        </Text>
        <Text style={[styles.replyPreviewText, { color: colors.subText }]} numberOfLines={1}>
          {replyingTo.text || 'Media message'}
        </Text>
      </View>
      <TouchableOpacity style={styles.closeReplyButton} onPress={onClose}>
        <Ionicons name="close" size={hp(2.5)} color={colors.subText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginBottom: hp(1),
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  replyPreviewText: {
    fontSize: hp(1.5),
    marginTop: hp(0.3),
  },
  closeReplyButton: {
    padding: wp(2),
  },
});

export default ReplyPreview;