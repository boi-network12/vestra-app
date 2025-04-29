import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"

export default function PostHeader({ colors, router, user, handleSubmitPost, disabled }) {
  const navigateBack = () => {
    router.back()
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => navigateBack()}>
        <Ionicons name='arrow-back-outline' size={hp(3)} color={colors.text} />
      </TouchableOpacity>

      <TouchableOpacity  
        onPress={handleSubmitPost}
        style={[styles.Div, { 
          backgroundColor: disabled ? colors.border : colors.primary,
          opacity: disabled ? 0.7 : 1
        }]}
        disabled={disabled}
      >
        <Text style={{ color: disabled ? colors.subText : colors.text }}>Post</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
    alignItems: "center",
    justifyContent: 'center',
    height: hp(4),
    width: wp(20),
    borderRadius: hp(3)
  }
})