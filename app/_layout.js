// app/_layout.js
import "react-native-get-random-values";
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import "../global.css";
import { ThemeProvider } from '../contexts/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FollowProvider } from '../contexts/FriendContext';
import { BlockProvider } from "../contexts/BlockContext";
import { SocketProvider } from "../contexts/SocketContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { PostProvider } from "../contexts/PostContext";
import { PostInteractionProvider } from "../contexts/PostInteractionContext";
import { ScrollProvider } from "../contexts/ScrollContext";

const AppContent = () => {
  const { user } = useAuth();

  return (
    <SocketProvider userId={user?._id}>
      <NotificationProvider>
        <PostProvider>
          <PostInteractionProvider>
            <BottomSheetModalProvider>
               <ScrollProvider>
                 <Stack screenOptions={{ headerShown: false }} />
               </ScrollProvider>
            </BottomSheetModalProvider>
          </PostInteractionProvider>
        </PostProvider>
      </NotificationProvider>
    </SocketProvider>
  )
}


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <BlockProvider>
        <FollowProvider>
          <ThemeProvider>
             <AppContent />
          </ThemeProvider>
        </FollowProvider>
      </BlockProvider>
    </AuthProvider>
  </GestureHandlerRootView>
  );
}

// app/_layout.js