import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const IncomingCallModal = ({ visible, caller, chatId, callType, onAccept, onReject, colors }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Incoming {callType === 'voice' ? 'Voice' : 'Video'} Call
          </Text>
          <Text style={[styles.caller, { color: colors.text }]}>
            {caller?.name || 'Unknown'}
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={hp(3)} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.error }]}
              onPress={onReject}
            >
              <Ionicons name="close" size={hp(3)} color={colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: wp(80),
    padding: wp(5),
    borderRadius: wp(3),
    alignItems: 'center',
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  caller: {
    fontSize: hp(2),
    marginBottom: hp(3),
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  button: {
    padding: wp(3),
    borderRadius: wp(10),
  },
});

export default IncomingCallModal;