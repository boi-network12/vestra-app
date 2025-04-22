// app/_layout.js
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import "../global.css";
import { ThemeProvider } from '../contexts/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FollowProvider } from '../contexts/FriendContext';


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FollowProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </FollowProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// app/_layout.js