import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'

export default function ChatScreenHeader({colors, user, recipient, navigation, title, initiateCall}) {
    
    console.log('Recipient:', recipient.name);
    console.log('User:', user.name);
    console.log('title:', title);

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
        <TouchableOpacity onPress={() => {
                    if (navigation.canGoBack()) {
                    navigation.goBack();
                    } else {
                    // Handle the case where there's no screen to go back to
                    console.log('No screen to go back to');
                    // Optionally navigate to a default screen, e.g., home
                    navigation.navigate('Home'); // Replace 'Home' with your home screen route
                    }
                }}
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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => initiateCall('voice')}>
          <Ionicons name="call" size={hp(2.5)} color={colors.subText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => initiateCall('video')}>
          <Ionicons name="videocam" size={hp(2.5)} color={colors.subText} />
        </TouchableOpacity>
      </View>
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
})