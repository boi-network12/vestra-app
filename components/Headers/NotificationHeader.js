import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"

export default function NotificationHeader({ colors, router, user, unreadCount }) {

    const navigateToSetting = () => {
        router.push({
            pathname: 'settings'
        })
    }

    const navigateBack = () => {
        router.back()
    }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => navigateBack()}>
        <Ionicons name='arrow-back-outline' size={hp(3)} color={colors.text} />
      </TouchableOpacity>

      <TouchableOpacity  style={styles.Div}
           onPress={() => navigateToSetting()}
      >
        <Text style={{ color: unreadCount === 0 ? colors.subText : colors.errorText}}>{unreadCount || 0}</Text>
         <Ionicons name='settings-outline' size={hp(3)} color={colors.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container : {
        borderBottomWidth: 1,
        paddingHorizontal: hp(2),
        paddingVertical: hp(2),
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row"
    },
    Div: {
        flexDirection: "row",
        gap: hp(2),
        alignItems: "center"
    }
})