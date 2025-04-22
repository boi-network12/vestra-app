import { Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Drawer } from "expo-router/drawer"
import CustomDrawerContent from '../../components/Drawer/CustomDrawerContent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { widthPercentageToDP as Wp, heightPercentageToDP as hp } from "react-native-responsive-screen"



export default function ProtectedLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/get-started" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerType: 'front',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          drawerStyle: {
            width: hp(35), 
            backgroundColor: '#ffffff',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            overflow: 'visible', 
            shadowColor: '#000',
            shadowOffset: {
              width: 5, // push shadow to the right
              height: 0,
            },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 5, 
          },
          headerShown: false,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      />
    </GestureHandlerRootView>
  );
}


// app/(protected)/_layout.js