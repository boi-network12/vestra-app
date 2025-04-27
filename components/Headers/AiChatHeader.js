import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native'
import React, { useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { Ionicons } from '@expo/vector-icons';

export default function AiChatHeader({ colors, title, navigation, onClearChat }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleClearChat = () => {
    setDropdownVisible(false);
    onClearChat();
  };


  return (
    <View
       style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: hp(3),
            paddingVertical: hp(2),
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        }}
    >
      <TouchableOpacity
         onPress={() => {
            if (navigation.canGoBack()) {
            navigation.goBack();
            } else {
            // Handle the case where there's no screen to go back to
            console.log('No screen to go back to');
            // Optionally navigate to a default screen, e.g., home
            navigation.navigate('/feed'); // Replace 'Home' with your home screen route
            }
        }}
         style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hp(0.5)
        }}
      >
        <Ionicons name='arrow-back' color={colors.text} size={hp(3)} />
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>
               Ai
            </Text>
        </View>
        <Text style={{ color: colors.text }} className='ml-20 text-lg '>{title}</Text>

      </TouchableOpacity>

        <TouchableOpacity onPress={toggleDropdown}>
        <Ionicons name="ellipsis-vertical" color={colors.text} size={hp(2)} />
        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={dropdownVisible}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={[styles.dropdownContainer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleClearChat}
              >
                <Text style={[styles.dropdownText, { color: colors.text }]}>Clear Chat</Text>
              </TouchableOpacity>
              {/* Add more dropdown items here if needed */}
            </View>
          </Pressable>
        </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
   avatarPlaceholder: {
        width: hp(5),
        height: hp(5),
        borderRadius: hp(2.5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: '#fff',
        fontSize: hp(2.2),
        fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    dropdownContainer: {
      marginTop: hp(8), // Adjust based on header height
      marginRight: wp(4),
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    dropdownItem: {
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
    },
    dropdownText: {
      fontSize: hp(2),
    },
})