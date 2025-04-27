// app/_layout.js
import "react-native-get-random-values";
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import "../global.css";
import { ThemeProvider } from '../contexts/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FollowProvider } from '../contexts/FriendContext';
import { BlockProvider } from "../contexts/BlockContext";


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BlockProvider>
          <FollowProvider>
            <ThemeProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
          </FollowProvider>
        </BlockProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// app/_layout.js