import { View, Text, Modal, Button, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import validator from 'validator'; // ✅ Add this line


export default function EditProfile({ isVisible, onClose, user, colors, updateProfile }) {
    const [bio, setBio] = useState(user.bio || '');
    const [profilePicture, setProfilePicture] = useState(user.profilePicture || null);
    const [link, setLink] = useState(user.link || '');
    const [uploading, setUploading] = useState(false);
    const [linkError, setLinkError] = useState('');


    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfilePicture(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (link && !validator.isURL(link)) {
            setLinkError('Invalid link');
            return;
        } else {
            setLinkError('');
        }
    
        try {
            setUploading(true);
            await updateProfile({
                bio,
                profilePicture,
                link,
            });
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setUploading(false);
        }
    };
    

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={[styles.saveButton, { color: colors.primary }]}>{uploading ? 'saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Picture Upload */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage}>
                            {profilePicture ? (
                                <Image 
                                    source={{ uri: profilePicture }} 
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.initials}>
                                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
                                <Ionicons name="camera" size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarLabel, { color: colors.text }]}>Change Profile Photo</Text>
                    </View>

                    {linkError ? <Text style={{ color: colors.errorText, marginBottom: 8 }} className='text-sm'>{linkError}</Text> : null}

                    {/* Bio Input */}
                    <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
                    <TextInput
                        style={[styles.input, { 
                            backgroundColor: colors.inputBg, 
                            color: colors.text, 
                            borderColor: colors.border 
                        }]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell about yourself..."
                        placeholderTextColor={colors.placeholder}
                        multiline
                        numberOfLines={4}
                        maxLength={160}
                    />
                    <Text style={[styles.charCount, { color: colors.subText }]}>
                        {bio.length}/160
                    </Text>

                    <Text style={[styles.label, { color: colors.text }]}>Link</Text>
                    <TextInput
                        style={[styles.input, { 
                            backgroundColor: colors.inputBg, 
                            color: colors.text, 
                            borderColor: colors.border 
                        }]}
                        value={link}
                        onChangeText={setLink}
                        placeholder="Tell about yourself..."
                        placeholderTextColor={colors.placeholder}
                        maxLength={160}
                    />
                    <Text style={[styles.charCount, { color: colors.subText }]}>
                        {link.length}/160
                    </Text>

                    <View style={styles.divider} />
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarLabel: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '500',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 5,
        textAlignVertical: 'top',
    },
    charCount: {
        alignSelf: 'flex-end',
        fontSize: 12,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: '#E1E8ED',
        marginVertical: 10,
    },
});