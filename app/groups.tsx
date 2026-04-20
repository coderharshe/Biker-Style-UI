/**
 * GroupsScreen – Complete group management for Velox riders.
 * Features: group list, chat with images, map view, group info panel,
 * join code sharing, member management, and media gallery.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Modal,
  Share,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { requestImagePickerPermission } from '@/lib/permissions';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import ChatBubble from '@/components/ChatBubble';
import GroupInfoSheet from '@/components/GroupInfoSheet';
import { useGroups } from '@/hooks/useGroups';
import { useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import MapLib, { Marker } from '@/components/MapLib';
import DestinationPicker from '@/components/DestinationPicker';
import { supabase } from '@/lib/supabase';
import type { Group } from '@/types/groups';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const {
    groups,
    loading,
    createGroup,
    joinGroupByCode,
    leaveGroup,
    deleteGroup,
    regenerateJoinCode,
    fetchMembers,
    kickMember,
    updateMemberRole,
    fetchMedia,
    updateDestination,
    startGroupRide,
    endGroupRide,
  } = useGroups();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { messages, loading: chatLoading, sending, sendMessage, sendLocation } = useChat(selectedGroupId);

  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [modalMode, setModalMode] = useState<'join' | 'create' | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [riderLocations, setRiderLocations] = useState<
    Record<string, { lat: number; lng: number; username: string; updated_at: string }>
  >({});

  const chatListRef = useRef<FlatList>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const isAdmin = selectedGroup?.created_by === profile?.id;

  // ─── Real-time rider locations during group ride ──
  useEffect(() => {
    if (activeTab === 'map' && selectedGroupId && selectedGroup?.is_riding) {
      let isMounted = true;

      const channel = supabase
        .channel(`group-ride-${selectedGroupId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_points' }, async (payload) => {
          if (!isMounted) return;
          const point = payload.new as any;

          let username = 'Rider';
          try {
            const { data } = await supabase.from('profiles').select('username').eq('id', point.user_id).single();
            if (data) username = data.username || 'Rider';
          } catch {
            // fallback
          }

          if (!isMounted) return;
          setRiderLocations((prev) => ({
            ...prev,
            [point.user_id]: {
              lat: point.lat,
              lng: point.lng,
              username,
              updated_at: new Date().toISOString(),
            },
          }));
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab, selectedGroupId, selectedGroup?.is_riding]);

  // ─── Auto-scroll chat ─────────────────────────────
  useEffect(() => {
    if (messages.length > 0 && activeTab === 'chat') {
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length, activeTab]);

  // ─── Chat Handlers ────────────────────────────────
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(chatInput, profile.id);
    setChatInput('');
  }, [chatInput, profile?.id, sendMessage]);

  const handlePickImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permResult = await requestImagePickerPermission();
    if (permResult.status !== 'granted') {
      if (permResult.status !== 'permanently_denied') {
        Alert.alert('Permission Required', 'Please grant photo library access to share images.');
      }
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        if (profile?.id) {
          await sendMessage('', profile.id, uri);
        }
      }
    } catch (err) {
      console.error('[Groups] Image pick error:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [profile?.id, sendMessage]);

  const handleShareLocation = useCallback(async () => {
    if (!profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { default: ExpoLocation } = await import('expo-location');
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Enable location to share with your group.');
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
      await sendLocation(profile.id, loc.coords.latitude, loc.coords.longitude, 'My current location');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('[Groups] Location share error:', err);
      Alert.alert('Error', 'Failed to get your location.');
    }
  }, [profile?.id, sendLocation]);

  // ─── Group Actions ────────────────────────────────
  const handleJoinCode = async () => {
    if (!joinCodeInput) return;
    try {
      await joinGroupByCode(joinCodeInput.trim().toUpperCase());
      setModalMode(null);
      setJoinCodeInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome! 🏍️', 'You have joined the group!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const group = await createGroup(newGroupName.trim(), newGroupDesc.trim() || 'A new riding crew');
      setModalMode(null);
      setNewGroupName('');
      setNewGroupDesc('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Group Created! 🔥',
        `Your join code is: ${group.join_code}\n\nShare this code with your riding crew to get them onboard.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroupId) return;
    try {
      await leaveGroup(selectedGroupId);
      setSelectedGroupId(null);
      setShowGroupInfo(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId) return;
    try {
      await deleteGroup(selectedGroupId);
      setSelectedGroupId(null);
      setShowGroupInfo(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShareGroupCode = useCallback(() => {
    if (!selectedGroup) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const message = `🏍️ Join my riding crew "${selectedGroup.name}" on Velox!\n\nJoin Code: ${selectedGroup.join_code}\n\nDownload Velox and enter the code to ride with us!`;

    if (Platform.OS === 'web') {
      try {
        navigator.clipboard.writeText(message);
        Alert.alert('Copied!', 'Invite message copied to clipboard.');
      } catch {
        Alert.alert('Share', message);
      }
    } else {
      Share.share({ message }).catch(console.error);
    }
  }, [selectedGroup]);

  // ─── Chat View (inside selected group) ────────────
  if (selectedGroupId && selectedGroup) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <Pressable
            onPress={() => {
              setSelectedGroupId(null);
              setActiveTab('chat');
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={Colors.dark.text} />
          </Pressable>

          <Pressable style={styles.chatHeaderInfo} onPress={() => setShowGroupInfo(true)}>
            <Avatar
              initials={selectedGroup.name.substring(0, 2).toUpperCase()}
              size={36}
              color={Colors.dark.accent}
            />
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {selectedGroup.name}
              </Text>
              <Text style={styles.chatHeaderSub}>
                {selectedGroup.member_count} riders • Tap for info
              </Text>
            </View>
          </Pressable>

          <Pressable style={styles.headerActionBtn} onPress={handleShareGroupCode}>
            <Feather name="share-2" size={18} color={Colors.dark.accent} />
          </Pressable>
          <Pressable style={styles.headerActionBtn} onPress={() => setShowGroupInfo(true)}>
            <Feather name="more-vertical" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

        {/* Riding Status Banner */}
        {selectedGroup.is_riding && (
          <View style={styles.ridingBanner}>
            <View style={styles.ridingDot} />
            <Text style={styles.ridingBannerText}>GROUP RIDE IN PROGRESS</Text>
          </View>
        )}

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Feather
              name="message-square"
              size={16}
              color={activeTab === 'chat' ? Colors.dark.text : Colors.dark.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>CHAT</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'map' && styles.tabBtnActive]}
            onPress={() => setActiveTab('map')}
          >
            <Feather
              name="map"
              size={16}
              color={activeTab === 'map' ? Colors.dark.text : Colors.dark.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>MAP</Text>
          </Pressable>
        </View>

        {activeTab === 'chat' ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Chat Messages */}
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              inverted={false}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                chatListRef.current?.scrollToEnd({ animated: false });
              }}
              ListEmptyComponent={
                <View style={styles.chatEmpty}>
                  <Feather name="message-circle" size={40} color={Colors.dark.textTertiary} />
                  <Text style={styles.chatEmptyTitle}>No messages yet</Text>
                  <Text style={styles.chatEmptySub}>
                    Start the conversation with your riding crew! 🏍️
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isMe = item.sender_id === profile?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showSender =
                  !isMe &&
                  item.message_type !== 'system' &&
                  (prevMsg?.sender_id !== item.sender_id || prevMsg?.message_type === 'system');

                return <ChatBubble message={item} isMe={isMe} showSender={showSender} />;
              }}
            />

            {/* Chat Input */}
            <View
              style={[
                styles.chatInputRow,
                { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 20 : 0) + 8 },
              ]}
            >
              <Pressable style={styles.attachBtn} onPress={handlePickImage}>
                <Feather name="image" size={20} color={Colors.dark.textTertiary} />
              </Pressable>
              <Pressable style={styles.attachBtn} onPress={handleShareLocation}>
                <Feather name="map-pin" size={18} color={Colors.dark.textTertiary} />
              </Pressable>
              <View style={styles.chatInputWrap}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Message the group..."
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendChat}
                  multiline={false}
                  returnKeyType="send"
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  pressed && { opacity: 0.8 },
                  sending && { opacity: 0.5 },
                ]}
                onPress={handleSendChat}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Feather name="send" size={18} color="#FFF" />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        ) : (
          /* Map View */
          <View style={styles.mapContainer}>
            <View style={styles.mapControls}>
              {selectedGroup.destination_name ? (
                <GlassCard style={styles.destinationBox}>
                  <View>
                    <Text style={styles.destLabel}>DESTINATION</Text>
                    <Text style={styles.destName}>{selectedGroup.destination_name}</Text>
                  </View>
                  {isAdmin && (
                    <Pressable onPress={() => setShowDestPicker(true)}>
                      <Feather name="edit-2" size={16} color={Colors.dark.accent} />
                    </Pressable>
                  )}
                </GlassCard>
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
                  style={[styles.rideBtn, selectedGroup.is_riding ? styles.rideBtnEnd : styles.rideBtnStart]}
                  onPress={() => {
                    if (selectedGroup.is_riding) endGroupRide(selectedGroupId);
                    else startGroupRide(selectedGroupId);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Text style={styles.rideBtnText}>
                    {selectedGroup.is_riding ? '⛔ END RIDE' : '🏁 START GROUP RIDE'}
                  </Text>
                </Pressable>
              )}

              {!isAdmin && selectedGroup.is_riding && (
                <GlassCard style={styles.activeRideBox}>
                  <View style={styles.ridingDot} />
                  <Text style={styles.activeRideText}>A group ride is currently active!</Text>
                </GlassCard>
              )}
            </View>

            <MapLib
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: selectedGroup.destination_lat || 34.1642,
                longitude: selectedGroup.destination_lng || 77.5848,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {selectedGroup.destination_lat && selectedGroup.destination_lng && (
                <Marker
                  coordinate={{
                    latitude: selectedGroup.destination_lat,
                    longitude: selectedGroup.destination_lng,
                  }}
                  title={selectedGroup.destination_name ?? 'Destination'}
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
                  updateDestination(selectedGroupId, dest.latitude, dest.longitude, dest.name);
                  setShowDestPicker(false);
                }}
              />
            )}
          </View>
        )}

        {/* Group Info Bottom Sheet */}
        {selectedGroup && (
          <GroupInfoSheet
            visible={showGroupInfo}
            group={selectedGroup}
            currentUserId={profile?.id || ''}
            onClose={() => setShowGroupInfo(false)}
            onLeave={handleLeaveGroup}
            onDelete={handleDeleteGroup}
            onRegenerateCode={() => regenerateJoinCode(selectedGroupId)}
            onKickMember={(userId) => kickMember(selectedGroupId, userId)}
            onUpdateRole={(userId, role) => updateMemberRole(selectedGroupId, userId, role)}
            fetchMembers={() => fetchMembers(selectedGroupId)}
            fetchMedia={() => fetchMedia(selectedGroupId)}
          />
        )}
      </View>
    );
  }

  // ─── Group List View ──────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Groups</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            onPress={() => {
              setModalMode('join');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather name="log-in" size={16} color="#FFF" />
            <Text style={styles.actionBtnLabel}>JOIN</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.8 }]}
            onPress={() => {
              setModalMode('create');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather name="plus" size={16} color="#FFF" />
            <Text style={styles.actionBtnLabel}>CREATE</Text>
          </Pressable>
        </View>
      </View>

      {/* Loading */}
      {loading && groups.length === 0 && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.dark.accent} size="large" />
          <Text style={styles.loadingText}>Loading your crews...</Text>
        </View>
      )}

      {/* Group List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!loading && groups.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={Colors.dark.textTertiary} />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptySub}>
              Create a riding crew or join one with an invite code!
            </Text>
          </View>
        )}

        {groups.length > 0 && (
          <Text style={styles.sectionTitle}>MY RIDING CREWS</Text>
        )}

        {groups.map((group) => (
          <Pressable
            key={group.id}
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedGroupId(group.id);
            }}
          >
            <GlassCard style={styles.groupCard}>
              <Avatar
                initials={group.name.substring(0, 2).toUpperCase()}
                size={50}
                color={group.is_riding ? Colors.dark.success : Colors.dark.accent}
              />
              <View style={styles.groupCardContent}>
                <View style={styles.groupCardTopRow}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {group.name}
                  </Text>
                  {group.latest_message && (
                    <Text style={styles.groupTime}>
                      {formatRelativeTime(group.latest_message.created_at)}
                    </Text>
                  )}
                </View>

                <View style={styles.groupCardBottomRow}>
                  <Text style={styles.groupPreview} numberOfLines={1}>
                    {group.latest_message
                      ? group.latest_message.message_type === 'system'
                        ? `ℹ️ ${group.latest_message.text}`
                        : group.latest_message.message_type === 'image'
                          ? `📸 ${group.latest_message.profiles?.username || 'User'} shared a photo`
                          : `${group.latest_message.profiles?.username || 'User'}: ${group.latest_message.text || '📸 Photo'}`
                      : 'Tap to start chatting'
                    }
                  </Text>

                  <View style={styles.groupCardBadges}>
                    {group.is_riding ? (
                      <View style={styles.ridingBadge}>
                        <View style={[styles.ridingDotSmall]} />
                        <Text style={styles.ridingBadgeText}>RIDING</Text>
                      </View>
                    ) : (
                      <View style={styles.membersBadge}>
                        <Feather name="users" size={10} color={Colors.dark.textTertiary} />
                        <Text style={styles.membersBadgeText}>{group.member_count}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </ScrollView>

      {/* Create / Join Modal */}
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
                <View style={styles.modalHeader}>
                  <Feather name="log-in" size={24} color={Colors.dark.accent} />
                  <Text style={styles.modalTitle}>Join a Crew</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-character code from your friend
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="A B C 1 2 3"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={joinCodeInput}
                  onChangeText={setJoinCodeInput}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />
                <View style={styles.modalBtns}>
                  <Pressable style={styles.modalCancelBtn} onPress={() => setModalMode(null)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalPrimaryBtn, !joinCodeInput.trim() && { opacity: 0.5 }]}
                    onPress={handleJoinCode}
                    disabled={!joinCodeInput.trim()}
                  >
                    <Feather name="check" size={16} color="#FFF" />
                    <Text style={styles.modalPrimaryText}>Join</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Feather name="plus-circle" size={24} color={Colors.dark.accent} />
                  <Text style={styles.modalTitle}>Create a Crew</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Give your riding group a name and description
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Crew Name"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  maxLength={30}
                  autoFocus
                />
                <TextInput
                  style={[styles.formInput, styles.formInputMulti]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={newGroupDesc}
                  onChangeText={setNewGroupDesc}
                  maxLength={100}
                  multiline
                  numberOfLines={2}
                />
                <View style={styles.modalBtns}>
                  <Pressable style={styles.modalCancelBtn} onPress={() => setModalMode(null)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalPrimaryBtn, !newGroupName.trim() && { opacity: 0.5 }]}
                    onPress={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                  >
                    <Feather name="zap" size={16} color="#FFF" />
                    <Text style={styles.modalPrimaryText}>Create</Text>
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

// ─── Helpers ──────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 24,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  actionBtnLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: '#FFF',
    letterSpacing: 1,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 20,
    color: Colors.dark.textSecondary,
  },
  emptySub: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Group List
  scroll: { paddingHorizontal: 16, gap: 8 },
  sectionTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 4,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  groupCardContent: {
    flex: 1,
    gap: 4,
  },
  groupCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 17,
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  groupTime: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  groupCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupPreview: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  groupCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ridingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.successDim,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.success,
  },
  ridingDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.success,
  },
  ridingBadgeText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    color: Colors.dark.success,
    letterSpacing: 0.5,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersBadgeText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatHeaderText: {
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
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Riding Banner
  ridingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.successDim,
    paddingVertical: 6,
  },
  ridingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.success,
  },
  ridingBannerText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 11,
    color: Colors.dark.success,
    letterSpacing: 2,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.accent,
  },
  tabText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  tabTextActive: { color: Colors.dark.text },

  // Chat
  chatList: { flex: 1 },
  chatListContent: { padding: 16, gap: 4 },
  chatEmpty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  chatEmptyTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.textSecondary,
  },
  chatEmptySub: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Chat Input
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Map View
  mapContainer: { flex: 1 },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 10,
  },
  destinationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  destLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  destName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
    marginTop: 2,
  },
  setDestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    gap: 8,
  },
  setDestText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  rideBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideBtnStart: { backgroundColor: Colors.dark.success },
  rideBtnEnd: { backgroundColor: Colors.dark.sos },
  rideBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 1,
  },
  activeRideBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  activeRideText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
    color: Colors.dark.success,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { padding: 24, gap: 14 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  modalTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 24,
    color: Colors.dark.accent,
    textAlign: 'center',
    letterSpacing: 8,
  },
  formInput: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  formInputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalCancelText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  modalPrimaryBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPrimaryText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
});
