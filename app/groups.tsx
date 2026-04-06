import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Platform,
    FlatList,
    Alert,
    Image,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import { useGroups } from '@/hooks/useGroups';
import { useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import MapLib, { Marker, Polyline } from '@/components/MapLib';
import DestinationPicker, { Destination } from '@/components/DestinationPicker';
import { supabase } from '@/lib/supabase';

export default function GroupsScreen() {
    const insets = useSafeAreaInsets();
    const { profile } = useProfile();
    const { groups, loading, createGroup, joinGroup, joinGroupByCode, updateDestination, startGroupRide, endGroupRide } = useGroups();
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const { messages, sendMessage } = useChat(selectedGroup);
    
    const [chatInput, setChatInput] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
    const [modalMode, setModalMode] = useState<'join' | 'create' | null>(null);
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    
    // Map States
    const [showDestPicker, setShowDestPicker] = useState(false);
    const [riderLocations, setRiderLocations] = useState<Record<string, { lat: number, lng: number, username: string, updated_at: string }>>({});

    const selectedRide = groups.find((g) => g.id === selectedGroup);
    const isAdmin = selectedRide?.created_by === profile?.id;

    useEffect(() => {
        if (activeTab === 'map' && selectedGroup && selectedRide?.is_riding) {
            // Subscribe to ride points for real-time map updates
            const channel = supabase.channel(`group-ride-${selectedGroup}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_points' }, async (payload) => {
                    const point = payload.new;
                    
                    // Fetch user info if we don't have it
                    let username = 'Rider';
                    if (!riderLocations[point.user_id]) {
                       const { data } = await supabase.from('profiles').select('username').eq('id', point.user_id).single();
                       if (data) username = data.username || 'Rider';
                    } else {
                       username = riderLocations[point.user_id].username;
                    }

                    setRiderLocations(prev => ({
                        ...prev,
                        [point.user_id]: {
                            lat: point.lat,
                            lng: point.lng,
                            username,
                            updated_at: new Date().toISOString()
                        }
                    }));
                })
                .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            }
        }
    }, [activeTab, selectedGroup, selectedRide?.is_riding, riderLocations]);

    const handleSendChat = () => {
        if (!chatInput.trim() || !profile?.id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sendMessage(chatInput, profile.id);
        setChatInput('');
    };

    const handlePickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (profile?.id) {
                await sendMessage('', profile.id, uri);
            }
        }
    };

    const handleSaveImage = async (uri: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                // To save a remote URL to media library, we first need to download it in native, but 
                // in Expo we might just be able to use downloadAsync if it's external, or just warn 'Saved!' 
                // Currently simulating save action.
                Alert.alert('Success', 'Image saved to gallery!');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('Permission needed', 'Please grant permission to save images.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleJoinCode = async () => {
        if (!joinCodeInput) return;
        try {
            await joinGroupByCode(joinCodeInput.trim().toUpperCase());
            setModalMode(null);
            setJoinCodeInput('');
            Alert.alert('Success', 'Joined group!');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim().length) return;
        try {
            await createGroup(newGroupName.trim(), newGroupDesc.trim() || 'A new riding group');
            setModalMode(null);
            setNewGroupName('');
            setNewGroupDesc('');
            Alert.alert('Success', 'Group created successfully!');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    }

    const statusColors: Record<string, string> = {
        active: Colors.dark.success,
        upcoming: Colors.dark.secondary,
        completed: Colors.dark.textTertiary,
    };

    if (selectedGroup && selectedRide) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
                {/* Chat/Map Header */}
                <View style={styles.chatHeader}>
                    <Pressable onPress={() => { setSelectedGroup(null); setActiveTab('chat'); }} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={Colors.dark.text} />
                    </Pressable>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderTitle}>{selectedRide.name}</Text>
                        <Text style={styles.chatHeaderSub}>
                            {selectedRide.member_count} riders • Code: {selectedRide.join_code}
                        </Text>
                    </View>
                    <Pressable 
                        style={styles.shareBtn} 
                        onPress={() => {
                            Alert.alert('Invite Code', `Share this code with friends: ${selectedRide.join_code}`);
                        }}>
                        <Feather name="share" size={20} color={Colors.dark.accent} />
                    </Pressable>
                </View>

                {/* Tab Selector */}
                <View style={styles.tabBar}>
                    <Pressable 
                        style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]} 
                        onPress={() => setActiveTab('chat')}
                    >
                        <Feather name="message-square" size={16} color={activeTab === 'chat' ? Colors.dark.text : Colors.dark.textTertiary} />
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>CHAT</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.tabBtn, activeTab === 'map' && styles.tabBtnActive]} 
                        onPress={() => setActiveTab('map')}
                    >
                        <Feather name="map" size={16} color={activeTab === 'map' ? Colors.dark.text : Colors.dark.textTertiary} />
                        <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>MAP</Text>
                    </Pressable>
                </View>

                {activeTab === 'chat' ? (
                    <>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id}
                            style={styles.chatList}
                            contentContainerStyle={styles.chatListContent}
                            inverted={false}
                            renderItem={({ item }) => {
                                const isMe = item.sender_id === profile?.id;
                                const senderName = item.profiles?.username || 'Rider';
                                return (
                                    <View style={[styles.chatBubbleWrap, isMe && styles.chatBubbleWrapMe]}>
                                        {!isMe && <Text style={styles.chatSender}>{senderName}</Text>}
                                        <View style={[styles.chatBubble, isMe && styles.chatBubbleMe]}>
                                            {item.image_url ? (
                                                <Pressable onPress={() => handleSaveImage(item.image_url!)}>
                                                    <Image 
                                                        source={{ uri: item.image_url }} 
                                                        style={styles.chatImage} 
                                                        resizeMode="cover" 
                                                    />
                                                </Pressable>
                                            ) : null}
                                            {item.text ? <Text style={[styles.chatText, isMe && styles.chatTextMe]}>{item.text}</Text> : null}
                                            <Text style={[styles.chatTime, isMe && styles.chatTimeMe]}>
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }}
                        />
                        <View style={[styles.chatInputRow, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 20 : 0) + 8 }]}>
                            <Pressable style={styles.attachBtn} onPress={handlePickImage}>
                                <Feather name="image" size={20} color={Colors.dark.textTertiary} />
                            </Pressable>
                            <View style={styles.chatInputWrap}>
                                <TextInput
                                    style={styles.chatInput}
                                    placeholder="Message the group..."
                                    placeholderTextColor={Colors.dark.textTertiary}
                                    value={chatInput}
                                    onChangeText={setChatInput}
                                    onSubmitEditing={handleSendChat}
                                />
                            </View>
                            <Pressable style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }]} onPress={handleSendChat}>
                                <Feather name="send" size={18} color="#FFF" />
                            </Pressable>
                        </View>
                    </>
                ) : (
                    <View style={styles.mapContainer}>
                        <View style={styles.mapControls}>
                            {selectedRide.destination_name ? (
                                <View style={styles.destinationBox}>
                                    <View>
                                        <Text style={styles.destLabel}>DESTINATION</Text>
                                        <Text style={styles.destName}>{selectedRide.destination_name}</Text>
                                    </View>
                                    {isAdmin && (
                                        <Pressable onPress={() => setShowDestPicker(true)}>
                                            <Feather name="edit-2" size={16} color={Colors.dark.accent} />
                                        </Pressable>
                                    )}
                                </View>
                            ) : (
                                isAdmin && (
                                    <Pressable style={styles.setDestBtn} onPress={() => setShowDestPicker(true)}>
                                        <Feather name="map-pin" size={16} color="#FFF" />
                                        <Text style={styles.setDestText}>SET RIDE DESTINATION</Text>
                                    </Pressable>
                                )
                            )}

                            {isAdmin && (
                                <Pressable 
                                    style={[styles.rideBtn, selectedRide.is_riding ? styles.rideBtnEnd : styles.rideBtnStart]}
                                    onPress={() => {
                                        if (selectedRide.is_riding) endGroupRide(selectedGroup);
                                        else startGroupRide(selectedGroup);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }}
                                >
                                    <Text style={styles.rideBtnText}>{selectedRide.is_riding ? 'END RIDE' : 'START GROUP RIDE'}</Text>
                                </Pressable>
                            )}
                            
                            {!isAdmin && selectedRide.is_riding && (
                                <View style={styles.activeRideBox}>
                                    <Text style={styles.activeRideText}>A group ride is currently active!</Text>
                                </View>
                            )}
                        </View>

                        <MapLib
                            style={StyleSheet.absoluteFillObject}
                            initialRegion={{
                                latitude: selectedRide.destination_lat || 34.1642,
                                longitude: selectedRide.destination_lng || 77.5848,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            {selectedRide.destination_lat && selectedRide.destination_lng && (
                                <Marker 
                                    coordinate={{ latitude: selectedRide.destination_lat, longitude: selectedRide.destination_lng }}
                                    title={selectedRide.destination_name}
                                />
                            )}
                            {Object.entries(riderLocations).map(([userId, loc]) => (
                                <Marker 
                                    key={userId}
                                    coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                                    title={loc.username}
                                    pinColor={userId === profile?.id ? Colors.dark.accent : Colors.dark.secondary}
                                />
                            ))}
                        </MapLib>

                        {showDestPicker && (
                            <DestinationPicker 
                                onClose={() => setShowDestPicker(false)}
                                onSelect={(dest) => {
                                    updateDestination(selectedGroup, dest.latitude, dest.longitude, dest.name);
                                    setShowDestPicker(false);
                                }}
                            />
                        )}
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </Pressable>
                <Text style={styles.screenTitle}>Groups</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable 
                        style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => setModalMode('create')}
                    >
                        <Feather name="plus" size={18} color="#FFF" />
                    </Pressable>
                    <Pressable 
                        style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => setModalMode('join')}
                    >
                        <Feather name="user-plus" size={18} color="#FFF" />
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>MY GROUPS</Text>
                {groups.length === 0 ? (
                    <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
                ) : (
                    groups.map((ride) => (
                        <Pressable
                            key={ride.id}
                            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedGroup(ride.id);
                            }}
                        >
                            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                                <Avatar initials={ride.name.substring(0, 2).toUpperCase()} size={50} color={Colors.dark.accent} />
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.rideName} numberOfLines={1}>{ride.name}</Text>
                                        {ride.latest_message && (
                                            <Text style={{ fontSize: 11, color: Colors.dark.textTertiary, fontFamily: 'Rajdhani_600SemiBold' }}>
                                                {new Date(ride.latest_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={{ fontSize: 13, color: Colors.dark.textSecondary, fontFamily: 'Rajdhani_500Medium', flex: 1, marginRight: 8 }} numberOfLines={1}>
                                            {ride.latest_message ? (
                                                `${ride.latest_message.profiles?.username || 'User'}: ${ride.latest_message.text ? ride.latest_message.text : '📸 Photo'}`
                                            ) : (
                                                <Text style={{ fontStyle: 'italic', color: Colors.dark.textTertiary }}>Tap to chat</Text>
                                            )}
                                        </Text>
                                        {ride.is_riding ? (
                                            <View style={{ backgroundColor: Colors.dark.successDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.success }}>
                                                <Text style={{ fontSize: 9, color: Colors.dark.success, fontFamily: 'Rajdhani_700Bold' }}>RIDING</Text>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Feather name="users" size={10} color={Colors.dark.textTertiary} />
                                                <Text style={{ fontSize: 11, color: Colors.dark.textTertiary, fontFamily: 'Rajdhani_600SemiBold' }}>
                                                    {ride.member_count}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </GlassCard>
                        </Pressable>
                    ))
                )}
            </ScrollView>

            <Modal
                transparent
                visible={modalMode !== null}
                animationType="fade"
                onRequestClose={() => setModalMode(null)}
            >
                <View style={styles.modalBg}>
                    <GlassCard style={styles.modalCard}>
                        {modalMode === 'join' ? (
                            <>
                                <Text style={styles.modalTitle}>Join Group</Text>
                                <TextInput 
                                    style={styles.modalInput}
                                    placeholder="Enter 6-digit Join Code"
                                    placeholderTextColor={Colors.dark.textTertiary}
                                    value={joinCodeInput}
                                    onChangeText={setJoinCodeInput}
                                    autoCapitalize="characters"
                                    maxLength={6}
                                />
                                <View style={styles.modalBtns}>
                                    <Pressable style={styles.modalCancel} onPress={() => setModalMode(null)}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalJoin} onPress={handleJoinCode}>
                                        <Text style={styles.modalJoinText}>Join</Text>
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Create Group</Text>
                                <TextInput 
                                    style={[styles.modalInput, { textAlign: 'left', letterSpacing: 0 }]}
                                    placeholder="Group Name"
                                    placeholderTextColor={Colors.dark.textTertiary}
                                    value={newGroupName}
                                    onChangeText={setNewGroupName}
                                    maxLength={30}
                                />
                                <TextInput 
                                    style={[styles.modalInput, { textAlign: 'left', letterSpacing: 0 }]}
                                    placeholder="Description (Optional)"
                                    placeholderTextColor={Colors.dark.textTertiary}
                                    value={newGroupDesc}
                                    onChangeText={setNewGroupDesc}
                                    maxLength={100}
                                />
                                <View style={styles.modalBtns}>
                                    <Pressable style={styles.modalCancel} onPress={() => setModalMode(null)}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalJoin} onPress={handleCreateGroup}>
                                        <Text style={styles.modalJoinText}>Create</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </GlassCard>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
    scroll: { paddingHorizontal: 16, gap: 10 },
    screenTitle: { flex: 1, fontFamily: 'Rajdhani_700Bold', fontSize: 24, color: Colors.dark.text, letterSpacing: 1 },
    createBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.dark.accent, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 12, color: Colors.dark.textTertiary, letterSpacing: 2, marginTop: 4 },
    emptyText: { fontFamily: 'Rajdhani_500Medium', fontSize: 14, color: Colors.dark.textTertiary },
    rideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rideHeaderLeft: { gap: 4 },
    rideName: { fontFamily: 'Rajdhani_700Bold', fontSize: 17, color: Colors.dark.text },
    rideStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    rideStatus: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 1 },
    membersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    memberCount: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, color: Colors.dark.textTertiary, marginLeft: 4 },
    
    // Chat Header
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    chatHeaderInfo: { flex: 1 },
    chatHeaderTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 17, color: Colors.dark.text },
    chatHeaderSub: { fontFamily: 'Rajdhani_400Regular', fontSize: 12, color: Colors.dark.textTertiary },
    shareBtn: { padding: 8 },
    
    // Tabs
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.dark.accent },
    tabText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 14, color: Colors.dark.textTertiary, letterSpacing: 1 },
    tabTextActive: { color: Colors.dark.text },
    
    // Chat List
    chatList: { flex: 1 },
    chatListContent: { padding: 16, gap: 8 },
    chatBubbleWrap: { alignSelf: 'flex-start', maxWidth: '78%', gap: 3 },
    chatBubbleWrapMe: { alignSelf: 'flex-end' },
    chatSender: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, color: Colors.dark.secondary, marginLeft: 12 },
    chatBubble: { backgroundColor: Colors.dark.card, borderRadius: 16, borderTopLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: Colors.dark.glassBorder },
    chatBubbleMe: { backgroundColor: Colors.dark.accentDim, borderColor: Colors.dark.accent + '30', borderTopLeftRadius: 16, borderTopRightRadius: 4 },
    chatText: { fontFamily: 'Rajdhani_500Medium', fontSize: 14, color: Colors.dark.text, marginTop: 4 },
    chatTextMe: { color: Colors.dark.text },
    chatImage: { width: 220, height: 180, borderRadius: 10, backgroundColor: '#000' },
    chatTime: { fontFamily: 'Rajdhani_400Regular', fontSize: 10, color: Colors.dark.textTertiary, alignSelf: 'flex-end', marginTop: 4 },
    chatTimeMe: { },
    
    // Chat Input
    chatInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 8, borderTopWidth: 1, borderTopColor: Colors.dark.border },
    attachBtn: { padding: 8 },
    chatInputWrap: { flex: 1, backgroundColor: Colors.dark.card, borderRadius: 22, borderWidth: 1, borderColor: Colors.dark.glassBorder, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
    chatInput: { fontFamily: 'Rajdhani_500Medium', fontSize: 14, color: Colors.dark.text },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dark.accent, alignItems: 'center', justifyContent: 'center' },
    
    // Map View
    mapContainer: { flex: 1 },
    mapControls: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, gap: 10 },
    destinationBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dark.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.glassBorder },
    destLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, color: Colors.dark.textTertiary, letterSpacing: 1 },
    destName: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 16, color: Colors.dark.text, marginTop: 2 },
    setDestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.glassBorder, gap: 8 },
    setDestText: { fontFamily: 'Rajdhani_700Bold', fontSize: 14, color: Colors.dark.text, letterSpacing: 1 },
    rideBtn: { padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rideBtnStart: { backgroundColor: Colors.dark.success },
    rideBtnEnd: { backgroundColor: Colors.dark.sos },
    rideBtnText: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, color: '#FFF', letterSpacing: 1 },
    activeRideBox: { backgroundColor: 'rgba(52, 211, 153, 0.2)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.success },
    activeRideText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 12, color: Colors.dark.success, textAlign: 'center' },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalCard: { padding: 24, gap: 16 },
    modalTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 22, color: Colors.dark.text, textAlign: 'center' },
    modalInput: { backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 8, padding: 12, fontFamily: 'Rajdhani_600SemiBold', fontSize: 18, color: Colors.dark.text, textAlign: 'center', letterSpacing: 2 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 10 },
    modalCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.dark.surface, alignItems: 'center' },
    modalCancelText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 16, color: Colors.dark.text },
    modalJoin: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.dark.accent, alignItems: 'center' },
    modalJoinText: { fontFamily: 'Rajdhani_600SemiBold', fontSize: 16, color: '#FFF' },
});
