import { StyleSheet } from 'react-native';
import { hp, wp } from '../utils/responsive';

const styles = StyleSheet.create({
    // Main container styles
    container: {
      flex: 1,
    },
    messagesList: {
      paddingHorizontal: wp(3),
      paddingBottom: hp(1),
      flexGrow: 1,
    },
    chatBackground: {
      flex: 1,
    },
  
    // Date separator
    dateSeparator: {
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: wp(2),
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      marginVertical: hp(1),
    },
    dateSeparatorText: {
      color: '#FFFFFF',
      fontSize: hp(1.6),
      fontWeight: '500',
    },
  
    // Multi-select header
    multiSelectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: wp(3),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
      backgroundColor: '#FFFFFF',
    },
    multiSelectTitle: {
      fontSize: hp(2),
      fontWeight: '600',
    },
  
    // Message wrapper
    messageWrapper: {
      flexDirection: 'row',
      marginVertical: hp(0.5),
    },
    currentUserWrapper: {
      flexDirection: 'row-reverse',
      justifyContent: 'flex-end',
    },
    otherUserWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
  
    // Avatar styles
    avatarContainer: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: wp(1.5),
      backgroundColor: '#E0E0E0',
      marginBottom: hp(1)
    },
    avatarImage: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
    },
    avatarText: {
      fontSize: hp(2),
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  
    // Message bubbles
    messageContainer: {
      maxWidth: wp(65),
      borderRadius: wp(3),
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
      marginVertical: hp(0.8),
    },
    currentUserMessage: {
      borderBottomRightRadius: wp(1),
      marginLeft: wp(30)
    },
    otherUserMessage: {
      borderBottomLeftRadius: wp(1),
      marginRight: wp(30), 
    },
    messageText: {
      fontSize: hp(2),
      lineHeight: hp(2.6),
    },
    currentUserText: {
      color: '#FFFFFF',
    },
    otherUserText: {
      color: '#000000',
    },
  
    // Message footer
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: hp(0.3),
    },
    messageTime: {
      fontSize: hp(1.3),
      color: '#999999',
      marginRight: wp(1),
    },
  
    // Swipe actions
    deleteAction: {
      width: wp(18),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(2),
    },
  
    // Media in messages
    filesContainer: {
      marginTop: hp(0.8),
    },
    fileContainer: {
      marginBottom: hp(0.5),
    },
    mediaInMessage: {
      width: wp(60),
      height: hp(25),
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    videoContainer: {
      position: 'relative',
    },
    videoFallback: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
    },
    videoPlayIconInMessage: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -wp(3),
      marginTop: -wp(3),
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: wp(6),
      padding: wp(1),
    },
    documentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(2.5),
      borderRadius: wp(3),
      backgroundColor: '#F7F7F7',
    },
    documentName: {
      flex: 1,
      marginHorizontal: wp(2),
      fontSize: hp(1.7),
      color: '#333333',
    },
    documentSize: {
      fontSize: hp(1.4),
      color: '#666666',
    },
  
    // Link previews
    linkPreviewInMessage: {
      width: wp(60),
      borderRadius: wp(3),
      overflow: 'hidden',
      marginTop: hp(0.8),
      backgroundColor: '#F7F7F7',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    linkPreviewImageInMessage: {
      width: '100%',
      height: hp(15),
    },
    linkPreviewTextInMessage: {
      padding: wp(2.5),
    },
    linkPreviewTitleInMessage: {
      fontSize: hp(1.8),
      fontWeight: '600',
      color: '#333333',
      marginBottom: hp(0.5),
    },
    linkPreviewDescriptionInMessage: {
      fontSize: hp(1.5),
      color: '#666666',
      marginBottom: hp(0.5),
    },
    linkPreviewUrlInMessage: {
      fontSize: hp(1.4),
      color: '#0084FF',
    },
  
    // Input area
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    textInput: {
      flex: 1,
      minHeight: hp(5),
      maxHeight: hp(12),
      borderRadius: wp(6),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.2),
      fontSize: hp(2),
      backgroundColor: '#F2F2F7',
      color: '#000000',
      marginHorizontal: wp(2),
    },
    mediaButton: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
    },
    sendButton: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0084FF',
    },
  
    // Media preview (before sending)
    mediaPreviewScroll: {
      maxHeight: hp(15),
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    mediaPreviewScrollContent: {
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
    },
    mediaPreviewContainer: {
      position: 'relative',
      marginRight: wp(2),
    },
    mediaPreviewImage: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    videoPreviewContainer: {
      position: 'relative',
    },
    videoPreview: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(3),
    },
    videoPlayIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -wp(4),
      marginTop: -wp(4),
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: wp(6),
      padding: wp(1),
    },
    filePreviewContainer: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      padding: wp(2),
    },
    fileName: {
      fontSize: hp(1.4),
      marginTop: hp(0.5),
      textAlign: 'center',
      color: '#333333',
    },
    removeMediaButton: {
      position: 'absolute',
      top: -wp(1),
      right: -wp(1),
      backgroundColor: '#FFFFFF',
      borderRadius: wp(5),
      padding: wp(0.5),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
  
    // Link preview (before sending)
    linkPreviewContainer: {
      marginHorizontal: wp(3),
      marginBottom: hp(1),
      borderRadius: wp(3),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    linkPreviewImage: {
      width: '100%',
      height: hp(15),
      borderTopLeftRadius: wp(3),
      borderTopRightRadius: wp(3),
    },
    linkPreviewTextContainer: {
      padding: wp(2.5),
    },
    linkPreviewTitle: {
      fontSize: hp(1.8),
      fontWeight: '600',
      color: '#333333',
      marginBottom: hp(0.5),
    },
    linkPreviewDescription: {
      fontSize: hp(1.5),
      color: '#666666',
      marginBottom: hp(0.5),
    },
    linkPreviewUrl: {
      fontSize: hp(1.4),
      color: '#0084FF',
    },
    removeLinkButton: {
      position: 'absolute',
      top: wp(1.5),
      right: wp(1.5),
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: wp(5),
      padding: wp(1),
    },
  
    // Media selection modal
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: wp(5),
      borderTopRightRadius: wp(5),
      padding: wp(4),
      paddingBottom: hp(5),
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    modalTitle: {
      fontSize: hp(2.5),
      fontWeight: '600',
      color: '#333333',
    },
    mediaOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    mediaOption: {
      alignItems: 'center',
      padding: wp(3),
      backgroundColor: '#F2F2F7',
      borderRadius: wp(3),
      width: wp(25),
    },
    mediaOptionText: {
      marginTop: hp(1),
      fontSize: hp(1.7),
      color: '#333333',
    },
  
    // Typing indicator
    typingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(3),
      marginLeft: wp(12),
      borderRadius: wp(4),
      backgroundColor: '#FFFFFF',
      marginVertical: hp(1),
      width: wp(20),
    },
    typingDot: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      backgroundColor: '#999999',
      marginHorizontal: wp(1),
    },
    // Reply action
    replyAction: {
      width: wp(18),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(2),
      backgroundColor: '#0084FF', // Use primary color
    },
  
    // Reply preview
    replyPreviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      backgroundColor: '#F2F2F7',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
      marginBottom: hp(1),
    },
    replyPreviewContent: {
      flex: 1,
    },
    replyPreviewSender: {
      fontSize: hp(1.6),
      fontWeight: '600',
      color: '#333333',
    },
    replyPreviewText: {
      fontSize: hp(1.5),
      color: '#666666',
      marginTop: hp(0.3),
    },
    closeReplyButton: {
      padding: wp(2),
    },
    repliedMessageContainer: {
      borderLeftWidth: wp(1),
      paddingLeft: wp(2),
      paddingVertical: hp(0.5),
      marginBottom: hp(0.8),
      borderRadius: wp(2),
    },
    repliedMessageSender: {
      fontSize: hp(1.6),
      fontWeight: '600',
    },
    repliedMessageText: {
      fontSize: hp(1.5),
      marginTop: hp(0.3),
    },
    audioInfo: {
      flex: 1,
      marginLeft: wp(2),
    },
    audioDuration: {
      fontSize: hp(1.4),
      color: '#666',
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(3),
      justifyContent: 'center',
      backgroundColor: '#FF3B30',
    },
    recordingDot: {
      width: wp(3),
      height: wp(3),
      borderRadius: wp(1.5),
      backgroundColor: '#FFFFFF',
      marginRight: wp(2),
    },
    recordingText: {
      color: '#FFFFFF',
      fontSize: hp(1.8),
      fontWeight: '600',
      marginRight: wp(3),
    },
    stopRecordingButton: {
      position: 'absolute',
      right: wp(3),
    },
    audioInfo: {
      flex: 1,
      marginLeft: wp(2),
    },
    audioDuration: {
      fontSize: hp(1.4),
      color: '#666',
      marginTop: hp(0.5),
    },
  });

export default styles;