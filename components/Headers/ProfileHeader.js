import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function ProfileHeader({ onBackPress, handleBlockAction, colors, isBlockedByTargetUser, isBlocked }) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleDropdownAction = (action) => {
    switch (action) {
      case 'shareProfile':
        console.log('Share Profile clicked');
        break;
      case 'blockUser':
        handleBlockAction(); 
        break;
      case 'reportUser':
        console.log('Report User clicked');
        break;
      case 'copyProfileLink':
        console.log('Copy Profile Link clicked');
        break;
      default:
        console.log('Unknown action');
    }
    setIsDropdownVisible(false);
  };


  return (
    <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        paddingHorizontal: hp(2.4),
        paddingVertical: 12,
        backgroundColor: colors.backgroundColor,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    }}>
        {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={{ marginRight: 10 }}>
            <Ionicons name='arrow-back' size={hp(2.8)} color={colors.text} />
        </TouchableOpacity>
        )}
        
        

        {isBlocked ? null :  isBlockedByTargetUser ? null : (
            <TouchableOpacity onPress={toggleDropdown} style={styles.menuButton} disabled={isBlockedByTargetUser}>
            <Ionicons name="ellipsis-vertical" size={hp(2.8)} color={colors.text} />
          </TouchableOpacity>
        )}

        {isDropdownVisible && (
        <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => handleDropdownAction('shareProfile')}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => handleDropdownAction('blockUser')}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>Block User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => handleDropdownAction('reportUser')}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>Report User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
            onPress={() => handleDropdownAction('copyProfileLink')}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>Copy Profile Link</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: hp(0.5),
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: hp(23),
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: hp(2),
    paddingHorizontal: hp(2),
    borderBottomWidth: 1
  },
  dropdownText: {
    fontSize: 16,
  },
});