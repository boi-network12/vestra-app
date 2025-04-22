import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'

export default function UsersHeader({ colors, navigation }) {
  return (
    <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: hp(3),
            paddingVertical: hp(2.8),
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        }}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name='menu' color={colors.text} size={hp(3)} />
      </TouchableOpacity>

        <Text style={{ fontSize: hp(1.8), fontWeight: '500', color: colors.text, marginLeft: wp(2) }}>Friends</Text>
    </View>
  )
}