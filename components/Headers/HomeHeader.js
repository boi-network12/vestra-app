import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { Image } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

export default function HomeHeader({ colors, user, navigation, router }) {

    const navigateToNotification = () => {
        if (user) {
            router.push({
                pathname: 'notifications',
            })
        }
    }

    const navigateToPosts = () => {
        if (user) {
            router.push({
                pathname: 'posts',
            })
        }
    }

  return (
    <View className='w-full' style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
            onPress={() => navigation.openDrawer()}
        >
            {user.profilePicture ? (
                <Image 
                    source={{ uri: user.profilePicture }} 
                    style={styles.avatar}
                />
                ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.initials}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>


        <View className='flex-row' style={[styles.routeContainer]}>
            <TouchableOpacity
                onPress={() => navigateToNotification()}
            >
                <Ionicons name='notifications-outline' size={hp(3)} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigateToPosts()}
            >
                <MaterialCommunityIcons name='plus-box-outline' size={hp(3)} color={colors.text} />
            </TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: hp(2),
        paddingVertical: hp(1),
        paddingTop: hp(3),
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between"
    },
    routeContainer: {
        gap: hp(2)
    },
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