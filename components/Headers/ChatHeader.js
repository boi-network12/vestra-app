import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'

export default function ChatHeader({ colors, navigation }) {
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

        <TextInput
            placeholder='Search Direct Messages'
            placeholderTextColor="#ccc"
            selectTextOnFocus={false}
            selectionColor={colors.text}
            style={{
                flex: 1,
                marginLeft: wp(4),
                paddingVertical: hp(1),
                paddingHorizontal: hp(2),
                borderRadius: hp(2),
                backgroundColor: colors.card,
                color: colors.text,
            }}
        />

        <Text style={{ fontSize: hp(1.8), fontWeight: '500', color: colors.text, marginLeft: wp(4) }}>
          <Ionicons name='chatbubble-ellipses' color={colors.subText} size={hp(2.8)} />
        </Text>
    </View>
  )
}