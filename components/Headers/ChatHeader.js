import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'

export default function ChatHeader({ colors, navigation, searchQuery, setSearchQuery }) {

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

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: wp(4) }}>
          <TextInput
            placeholder="Search Direct Messages"
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: hp(1),
              paddingHorizontal: hp(2),
              borderRadius: hp(2),
              backgroundColor: colors.card,
              color: colors.text,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ position: 'absolute', right: hp(2) }}
            >
              <Ionicons name="close-circle" size={hp(2.5)} color={colors.subText} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={{ fontSize: hp(1.8), fontWeight: '500', color: colors.text, marginLeft: wp(4) }}>
          <Ionicons name='chatbubble-ellipses' color={colors.subText} size={hp(2.8)} />
        </Text>
    </View>
  )
}