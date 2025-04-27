import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp } from '../../utils/responsive';

const MediaUploadModal = ({ visible, onClose, onSelectMedia, onSelectDocument, colors }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalContainer, {
        backgroundColor: colors.card,
      }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Media</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.mediaOptions}>
          {['photo', 'video', 'document'].map(type => (
            <TouchableOpacity
              key={type}
              style={styles.mediaOption}
              onPress={() => (type === 'document' ? onSelectDocument() : onSelectMedia(type))}
            >
              <Ionicons
                name={type === 'photo' ? 'image' : type === 'video' ? 'videocam' : 'document'}
                size={hp(4)}
                color={colors.primary}
              />
              <Text style={[styles.mediaOptionText, { color: colors.text }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    padding: wp(4),
    paddingBottom: hp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: hp(2.5),
    fontWeight: '600',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    alignItems: 'center',
    padding: wp(3),
    backgroundColor: '#F2F2F7',
    borderRadius: wp(3),
    width: wp(25),
  },
  mediaOptionText: {
    marginTop: hp(1),
    fontSize: hp(1.7),
  },
});

export default MediaUploadModal;