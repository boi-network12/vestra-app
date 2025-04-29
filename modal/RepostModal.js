import { View, Text, TouchableOpacity, Platform } from 'react-native'
import React from 'react'
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { router } from 'expo-router';

const RepostModal = ({ visible, onClose, colors, onRepost, postId  }) => {
    if (!visible) return null;
  
    return (
      <View style={[styles.modalContainer, { backgroundColor: colors.modalBg }]}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.repostModalContent, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.repostOption}
            onPress={() => {
              onRepost();
              onClose();
            }}
          >
            <Icon name="repeat-outline" size={hp(2.8)} color={colors.text} />
            <Text style={[styles.repostOptionText, { color: colors.text }]}>
              Repost
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity
            style={styles.repostOption}
            onPress={() => {
              router.push({
                pathname: 'quote-post',
                params: { id: postId },
              })
              onClose();
            }}
          >
            <Icon name="pencil-outline" size={hp(2.8)} color={colors.text} />
            <Text style={[styles.repostOptionText, { color: colors.text }]}>
              Quote
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    modalContainer: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'flex-end',
      zIndex: 1000,
    },
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    },
    repostModalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: wp(5),
      paddingBottom: Platform.OS === 'ios' ? hp(6) : hp(8),
      maxHeight: hp(50),
      width: '100%',
    },
    repostOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(2),
    },
    repostOptionText: {
      fontSize: wp(4.2),
      fontWeight: '500',
      marginLeft: wp(4),
    }
  });
  

  export default RepostModal;