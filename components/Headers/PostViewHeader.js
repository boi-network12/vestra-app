import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { useNavigation } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export default function PostViewHeader({ colors, onOptionsPress  }) {
  const navigation = useNavigation();

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border  }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon 
            name="arrow-back" 
            size={wp(6)} 
            color={colors.primary} 
          />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        </View>
        
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={onOptionsPress}
        >
          <Icon 
            name="ellipsis-horizontal" 
            size={wp(5.5)} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: hp(6),
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  backButton: {
    padding: wp(2),
    marginRight: wp(1),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
  },
  actionButton: {
    padding: wp(2),
    marginLeft: wp(1),
  },
});