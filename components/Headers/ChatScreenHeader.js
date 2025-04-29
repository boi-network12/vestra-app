import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'

export default function ChatScreenHeader({colors, recipient, navigation, handleBlockAction, isBlockedByTargetUser, isBlocked }) {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false)

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
        }}>
        <TouchableOpacity  onPress={() => navigation.goBack()}
        style={{
            flexDirection: 'row',
            alignItems: 'center',
        }}>
           <Ionicons name='arrow-back' color={colors.text} size={hp(3)} />
           {recipient.profilePicture ? (
                <Image 
                    source={{ uri: recipient.profilePicture }} 
                    style={styles.avatar}
                />
                ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.initials}>
                    {recipient.name ? recipient.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </Text>
                </View>
            )}
            <Text style={{ color: colors.text, marginLeft: hp(1.8), fontSize: hp(2)}}>{recipient.name || "Anonymous"}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
           onPress={toggleDropdown} 
           style={styles.menuButton} 
           disabled={isBlockedByTargetUser}
        >
            <Ionicons name="ellipsis-vertical" size={hp(2.8)} color={colors.text} />
        </TouchableOpacity>

        {isDropdownVisible && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => handleDropdownAction('blockUser')}
                activeOpacity={0.7}
                >
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {isBlocked ? 'Unblock User' : 'Block User'}
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => handleDropdownAction('shareProfile')}
                activeOpacity={0.7}
                >
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                    Share Profile
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => handleDropdownAction('reportUser')}
                activeOpacity={0.7}
                >
                <Text style={[styles.dropdownText, { color: colors.errorText || 'red' }]}>
                    Report User
                </Text>
                </TouchableOpacity>
            </View>
            )}

    </View>
  )
}

const styles = StyleSheet.create({
    avatar: {
        width: hp(5),
        height: hp(5),
        borderRadius: hp(2.5),
        marginLeft: wp(2),
    },
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
    dropdown: {
        position: 'absolute',
        top: hp(8),
        right: hp(3),
        width: wp(45),
        backgroundColor: '#fff',
        borderRadius: hp(0.5),
        paddingVertical: hp(1),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1,
        zIndex: 1000
      },
      
      dropdownItem: {
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        borderBottomWidth: 1,
      },
      
      dropdownText: {
        fontSize: hp(2),
      },
      
})