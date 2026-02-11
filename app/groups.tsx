import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Platform,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import { groupRides, chatMessages, currentUser } from '@/data/mockData';

export default function GroupsScreen() {
    const insets = useSafeAreaInsets();
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState(chatMessages);

    const selectedRide = groupRides.find((g) => g.id === selectedGroup);

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newMsg = {
            id: Date.now().toString(),
            sender: currentUser.name,
            text: chatInput.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setChatInput('');
    };

    const statusColors: Record<string, string> = {
        active: Colors.dark.success,
        upcoming: Colors.dark.secondary,
        completed: Colors.dark.textTertiary,
    };

    if (selectedGroup && selectedRide) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
                <View style={styles.chatHeader}>
                    <Pressable onPress={() => setSelectedGroup(null)} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={Colors.dark.text} />
                    </Pressable>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderTitle}>{selectedRide.name}</Text>
                        <Text style={styles.chatHeaderSub}>{selectedRide.members.length} riders</Text>
                    </View>
                    <View style={styles.memberAvatarRow}>
                        {selectedRide.members.slice(0, 3).map((m) => (
                            <Avatar key={m.id} initials={m.avatar} size={28} color={Colors.dark.secondary} style={{ marginLeft: -6 }} />
                        ))}
                    </View>
                </View>

                <View style={styles.chatMapStrip}>
                    <View style={styles.chatMapPlaceholder}>
                        <View style={styles.mapGrid}>
                            {[...Array(10)].map((_, i) => (
                                <View key={i} style={[styles.mapGridLine, { left: `${(i + 1) * 10}%` }]} />
                            ))}
                        </View>
                        <View style={styles.chatMapLabel}>
                            <Feather name="map" size={12} color={Colors.dark.textTertiary} />
                            <Text style={styles.chatMapLabelText}>Group Route</Text>
                        </View>
                    </View>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    style={styles.chatList}
                    contentContainerStyle={styles.chatListContent}
                    renderItem={({ item }) => {
                        const isMe = item.sender === currentUser.name;
                        return (
                            <View style={[styles.chatBubbleWrap, isMe && styles.chatBubbleWrapMe]}>
                                {!isMe && <Text style={styles.chatSender}>{item.sender}</Text>}
                                <View style={[styles.chatBubble, isMe && styles.chatBubbleMe]}>
                                    <Text style={[styles.chatText, isMe && styles.chatTextMe]}>{item.text}</Text>
                                </View>
                                <Text style={[styles.chatTime, isMe && styles.chatTimeMe]}>{item.time}</Text>
                            </View>
                        );
                    }}
                />

                <View style={[styles.chatInputRow, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 20 : 0) + 8 }]}>
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
                    <Pressable
                        style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }]}
                        onPress={handleSendChat}
                    >
                        <Feather name="send" size={18} color="#FFF" />
                    </Pressable>
                </View>
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
                <Pressable style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}>
                    <Feather name="plus" size={18} color="#FFF" />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>ACTIVE & UPCOMING</Text>
                {groupRides
                    .filter((g) => g.status !== 'completed')
                    .map((ride) => (
                        <Pressable
                            key={ride.id}
                            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedGroup(ride.id);
                            }}
                        >
                            <GlassCard>
                                <View style={styles.rideHeader}>
                                    <View style={styles.rideHeaderLeft}>
                                        <Text style={styles.rideName}>{ride.name}</Text>
                                        <View style={styles.rideStatusRow}>
                                            <View style={[styles.statusDot, { backgroundColor: statusColors[ride.status] }]} />
                                            <Text style={[styles.rideStatus, { color: statusColors[ride.status] }]}>
                                                {ride.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={Colors.dark.textTertiary} />
                                </View>

                                <View style={styles.rideDetails}>
                                    <View style={styles.rideDetail}>
                                        <Feather name="user" size={13} color={Colors.dark.textTertiary} />
                                        <Text style={styles.rideDetailText}>{ride.leader}</Text>
                                    </View>
                                    <View style={styles.rideDetail}>
                                        <Feather name="navigation" size={13} color={Colors.dark.textTertiary} />
                                        <Text style={styles.rideDetailText}>{ride.distance}</Text>
                                    </View>
                                    <View style={styles.rideDetail}>
                                        <Feather name="clock" size={13} color={Colors.dark.textTertiary} />
                                        <Text style={styles.rideDetailText}>{ride.startTime}</Text>
                                    </View>
                                </View>

                                <View style={styles.membersRow}>
                                    {ride.members.map((m) => (
                                        <Avatar key={m.id} initials={m.avatar} size={30} color={Colors.dark.secondary} style={{ marginRight: -4 }} />
                                    ))}
                                    <Text style={styles.memberCount}>{ride.members.length} riders</Text>
                                </View>
                            </GlassCard>
                        </Pressable>
                    ))}

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>PAST RIDES</Text>
                {groupRides
                    .filter((g) => g.status === 'completed')
                    .map((ride) => (
                        <GlassCard key={ride.id} style={{ opacity: 0.6 }}>
                            <View style={styles.rideHeader}>
                                <View style={styles.rideHeaderLeft}>
                                    <Text style={styles.rideName}>{ride.name}</Text>
                                    <View style={styles.rideStatusRow}>
                                        <Feather name="check-circle" size={12} color={Colors.dark.textTertiary} />
                                        <Text style={[styles.rideStatus, { color: Colors.dark.textTertiary }]}>COMPLETED</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.rideDetails}>
                                <View style={styles.rideDetail}>
                                    <Feather name="navigation" size={13} color={Colors.dark.textTertiary} />
                                    <Text style={styles.rideDetailText}>{ride.distance}</Text>
                                </View>
                                <View style={styles.rideDetail}>
                                    <Feather name="map-pin" size={13} color={Colors.dark.textTertiary} />
                                    <Text style={styles.rideDetailText}>{ride.route}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
    },
    scroll: {
        paddingHorizontal: 16,
        gap: 10,
    },
    screenTitle: {
        flex: 1,
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 24,
        color: Colors.dark.text,
        letterSpacing: 1,
    },
    createBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.dark.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 12,
        color: Colors.dark.textTertiary,
        letterSpacing: 2,
        marginTop: 4,
    },
    rideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rideHeaderLeft: {
        gap: 4,
    },
    rideName: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 17,
        color: Colors.dark.text,
    },
    rideStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    rideStatus: {
        fontFamily: 'Rajdhani_600SemiBold',
        fontSize: 10,
        letterSpacing: 1,
    },
    rideDetails: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    rideDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rideDetailText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    membersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    memberCount: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 12,
        color: Colors.dark.textTertiary,
        marginLeft: 4,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatHeaderInfo: {
        flex: 1,
    },
    chatHeaderTitle: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 17,
        color: Colors.dark.text,
    },
    chatHeaderSub: {
        fontFamily: 'Rajdhani_400Regular',
        fontSize: 12,
        color: Colors.dark.textTertiary,
    },
    memberAvatarRow: {
        flexDirection: 'row',
    },
    chatMapStrip: {
        height: 80,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    chatMapPlaceholder: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        position: 'relative',
    },
    mapGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    mapGridLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: Colors.dark.glassBorder,
    },
    chatMapLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    chatMapLabelText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 11,
        color: Colors.dark.textTertiary,
    },
    chatList: {
        flex: 1,
    },
    chatListContent: {
        padding: 16,
        gap: 8,
    },
    chatBubbleWrap: {
        alignSelf: 'flex-start',
        maxWidth: '78%',
        gap: 3,
    },
    chatBubbleWrapMe: {
        alignSelf: 'flex-end',
    },
    chatSender: {
        fontFamily: 'Rajdhani_600SemiBold',
        fontSize: 11,
        color: Colors.dark.secondary,
        marginLeft: 12,
    },
    chatBubble: {
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.dark.glassBorder,
    },
    chatBubbleMe: {
        backgroundColor: Colors.dark.accentDim,
        borderColor: Colors.dark.accent + '30',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 4,
    },
    chatText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 14,
        color: Colors.dark.text,
    },
    chatTextMe: {
        color: Colors.dark.text,
    },
    chatTime: {
        fontFamily: 'Rajdhani_400Regular',
        fontSize: 10,
        color: Colors.dark.textTertiary,
        marginLeft: 12,
    },
    chatTimeMe: {
        textAlign: 'right',
        marginRight: 12,
        marginLeft: 0,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    chatInputWrap: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.dark.glassBorder,
        paddingHorizontal: 16,
        height: 44,
        justifyContent: 'center',
    },
    chatInput: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 14,
        color: Colors.dark.text,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
