import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getThemeColors } from '../../utils/theme';

const GifModal = ({ visible, onClose, onSelectGif, colors }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query = 'trending') => {
    setLoading(true);
    try {
      const apiKey = '70hUNeAEJp1DIW1qxPJV63CNSD9l1Gvz'; // Replace with your GIPHY API key
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20`;
      const response = await fetch(url);
      const data = await response.json();
      setGifs(data.data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchGifs(); // Load trending GIFs when modal opens
    }
  }, [visible]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchGifs(searchQuery);
    }
  };

  const renderGifItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        onSelectGif({
          id: item.id,
          uri: item.images.fixed_height.url,
          type: 'gif',
        });
        onClose();
      }}
    >
      <Image
        source={{ uri: item.images.fixed_height.url }}
        style={{ width: wp(30), height: wp(30), margin: wp(1), borderRadius: wp(2) }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          marginTop: hp(10),
          borderTopLeftRadius: wp(5),
          borderTopRightRadius: wp(5),
          padding: wp(4),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp(2) }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderRadius: wp(2),
              padding: wp(2),
            }}
            placeholder="Search GIFs..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={onClose} style={{ marginLeft: wp(2) }}>
            <Ionicons name="close" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={gifs}
            renderItem={renderGifItem}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={{ paddingBottom: hp(2) }}
          />
        )}
      </View>
    </Modal>
  );
};

export default GifModal;