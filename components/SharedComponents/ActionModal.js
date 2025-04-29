// components/SharedComponents/ActionModal.js
import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ActionModal({
  isVisible,
  onClose,
  actions,
  colors,
  title
}) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={wp(6)} color={colors.text} />
            </TouchableOpacity>
          </View>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <Icon
                name={action.icon}
                size={wp(5)}
                color={action.danger ? colors.errorText : colors.text}
              />
              <Text
                style={[
                  styles.actionText,
                  {
                    color: action.danger ? colors.errorText : colors.text,
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(80),
    borderRadius: 15,
    padding: wp(4),
    maxHeight: hp(50),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
  },
  actionText: {
    fontSize: wp(4),
    marginLeft: wp(3),
  },
});