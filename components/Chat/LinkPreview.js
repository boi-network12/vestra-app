import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp } from '../../utils/responsive';

const LinkPreview = ({ preview, onRemove, colors }) => {
  if (!preview) return null;

  return (
    <View style={[styles.linkPreviewContainer, { backgroundColor: colors.card }]}>
      {preview.image && (
        <Image source={{ uri: preview.image }} style={styles.linkPreviewImage} resizeMode="cover" />
      )}
      <View style={styles.linkPreviewTextContainer}>
        <Text style={[styles.linkPreviewTitle, { color: colors.text }]} numberOfLines={1}>
          {preview.title || preview.url}
        </Text>
        {preview.description && (
          <Text style={[styles.linkPreviewDescription, { color: colors.subText }]} numberOfLines={2}>
            {preview.description}
          </Text>
        )}
        <Text style={[styles.linkPreviewUrl, { color: colors.primary }]} numberOfLines={1}>
          {new URL(preview.url).hostname}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeLinkButton} onPress={onRemove}>
        <Ionicons name="close" size={hp(2.5)} color={colors.subText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  linkPreviewContainer: {
    marginHorizontal: wp(3),
    marginBottom: hp(1),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  linkPreviewImage: {
    width: '100%',
    height: hp(15),
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
  },
  linkPreviewTextContainer: {
    padding: wp(2.5),
  },
  linkPreviewTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  linkPreviewDescription: {
    fontSize: hp(1.5),
    marginBottom: hp(0.5),
  },
  linkPreviewUrl: {
    fontSize: hp(1.4),
  },
  removeLinkButton: {
    position: 'absolute',
    top: wp(1.5),
    right: wp(1.5),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: wp(5),
    padding: wp(1),
  },
});

export default LinkPreview;