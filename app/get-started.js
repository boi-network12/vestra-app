import { View, Text, Button, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ImageBg from "../assets/images/HeroBg.png"; 
import { widthPercentageToDP as Wp, heightPercentageToDP as hp} from "react-native-responsive-screen"
 
export default function GetStarted() {
  return (
    <LinearGradient
      colors={['#8A2BE2', '#0000FF']}  // Purple to Blue gradient
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Wp(10) }}
    >
      <StatusBar style="light" />
      
      {/* Image */}
      <View style={{ width: '100%', alignItems: 'center', justifyContent: "center"}}>
        <Image
          source={ImageBg}
          style={{ width: 300, height: 400, resizeMode: 'contain', objectFit: "contain" }}  
        />
      </View>
      
      {/* Text */}
      
      <Text 
         className='text-white font-medium text-2xl text-center w-25 mb-8'
      >
        Ultimate Platform for Seamless Messaging and Connected Conversations!
      </Text>
      
      {/* Button */}
      <TouchableOpacity
         onPress={() => router.push('/(auth)/login')}
         className="text-gray-900 w-full bg-white/90 items-center justify-center h-[3.6rem] rounded-md font-semibold"
      >
        <Text>Get Started</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
