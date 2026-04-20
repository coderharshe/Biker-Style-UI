/**
 * GroupInfoSheet – Modal overlay showing group details, member list,
 * join code/share, media gallery, and admin controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import type { Group, GroupMember, GroupMedia, MemberRole } from '@/types/groups';

interface GroupInfoSheetProps {
  visible: boolean;
  group: Group;
  currentUserId: string;
  onClose: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onRegenerateCode: () => Promise<string>;
  onKickMember: (userId: string) => void;
  onUpdateRole: (userId: string, role: MemberRole) => void;
  fetchMembers: () => Promise<GroupMember[]>;
  fetchMedia: () => Promise<GroupMedia[]>;
}

type InfoTab = 'members' | 'media' | 'settings';

export default function GroupInfoSheet({
  visible,
  group,
  currentUserId,
  onClose,
  onLeave,
  onDelete,
  onRegenerateCode,
  onKickMember,
  onUpdateRole,
  fetchMembers,
  fetchMedia,
}: GroupInfoSheetProps) {
  const [activeTab, setActiveTab] = useState<InfoTab>('members');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [media, setMedia] = useState<GroupMedia[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  const isAdmin = group.created_by === currentUserId;
  const myMembership = members.find((m) => m.user_id === currentUserId);
  const canManage = isAdmin || myMembership?.role === 'moderator';

  // Load members on mount
  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && activeTab === 'media') {
      loadMedia();
    }
  }, [visible, activeTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadMedia = async () => {
    setLoadingMedia(true);
    try {
      const data = await fetchMedia();
      setMedia(data);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(group.join_code);
      } else {
        await ExpoClipboard.setStringAsync(group.join_code);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied!', `Join code "${group.join_code}" copied to clipboard.`);
    } catch {
      Alert.alert('Code', group.join_code);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `🏍️ Join my riding crew "${group.name}" on Velox!\n\nJoin Code: ${group.join_code}\n\nDownload Velox and enter the code to ride with us!`;

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(message);
        Alert.alert('Copied!', 'Invite message copied to clipboard.');
      } catch {
        Alert.alert('Share', message);
      }
    } else {
      try {
        await Share.share({ message });
      } catch (err) {
        console.error('[GroupInfo] Share error:', err);
      }
    }
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Regenerate Code',
      'This will invalidate the current join code. Anyone with the old code won\'t be able to join. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              const newCode = await onRegenerateCode();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('New Code', `Your new join code is: ${newCode}`);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const confirmKick = (member: GroupMember) => {
    const username = member.profiles?.username || 'this member';
    Alert.alert(
      'Remove Member',
      `Remove ${username} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onKickMember(member.user_id);
            setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleRoleChange = (member: GroupMember) => {
    const options = ['Member', 'Moderator'];
    if (member.role === 'member') {
      Alert.alert('Promote', `Promote ${member.profiles?.username || 'this member'} to Moderator?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: () => {
            onUpdateRole(member.user_id, 'moderator');
            setMembers((prev) =>
              prev.map((m) => (m.user_id === member.user_id ? { ...m, role: 'moderator' } : m))
            );
          },
        },
      ]);
    } else if (member.role === 'moderator') {
      Alert.alert('Demote', `Demote ${member.profiles?.username || 'this member'} to Member?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          onPress: () => {
            onUpdateRole(member.user_id, 'member');
            setMembers((prev) =>
              prev.map((m) => (m.user_id === member.user_id ? { ...m, role: 'member' } : m))
            );
          },
        },
      ]);
    }
  };

  const roleColors: Record<MemberRole, string> = {
    admin: Colors.dark.accent,
    moderator: Colors.dark.secondary,
    member: Colors.dark.textTertiary,
  };

  const roleLabels: Record<MemberRole, string> = {
    admin: 'ADMIN',
    moderator: 'MOD',
    member: 'MEMBER',
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={Colors.dark.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Group Info</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Group Identity */}
          <View style={styles.groupIdentity}>
            <Avatar
              initials={group.name.substring(0, 2).toUpperCase()}
              size={64}
              color={Colors.dark.accent}
            />
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description && (
              <Text style={styles.groupDesc}>{group.description}</Text>
            )}
            <Text style={styles.memberCountLabel}>
              {group.member_count} / {group.max_members} riders
            </Text>
          </View>

          {/* Join Code Card */}
          <GlassCard style={styles.codeCard}>
            <View style={styles.codeRow}>
              <View>
                <Text style={styles.codeLabel}>JOIN CODE</Text>
                <Text style={styles.codeValue}>{group.join_code}</Text>
              </View>
              <View style={styles.codeActions}>
                <Pressable style={styles.codeActionBtn} onPress={handleCopyCode}>
                  <Feather name="copy" size={16} color={Colors.dark.accent} />
                </Pressable>
                <Pressable style={styles.codeActionBtn} onPress={handleShare}>
                  <Feather name="share-2" size={16} color={Colors.dark.secondary} />
                </Pressable>
                {isAdmin && (
                  <Pressable style={styles.codeActionBtn} onPress={handleRegenerateCode}>
                    <Feather name="refresh-cw" size={16} color={Colors.dark.warning} />
                  </Pressable>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            {(['members', 'media', 'settings'] as InfoTab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather
                  name={tab === 'members' ? 'users' : tab === 'media' ? 'image' : 'settings'}
                  size={14}
                  color={activeTab === tab ? Colors.dark.text : Colors.dark.textTertiary}
                />
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'members' && (
              <>
                {loadingMembers ? (
                  <ActivityIndicator color={Colors.dark.accent} style={{ marginTop: 20 }} />
                ) : (
                  members.map((member) => {
                    const isMe = member.user_id === currentUserId;
                    const isCreator = member.user_id === group.created_by;
                    const username = member.profiles?.username || 'Rider';
                    const role = member.role as MemberRole;
                    return (
                      <View key={member.user_id} style={styles.memberRow}>
                        <Avatar
                          initials={username.substring(0, 2).toUpperCase()}
                          size={40}
                          color={roleColors[role]}
                        />
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName}>
                              {username}
                              {isMe ? ' (You)' : ''}
                            </Text>
                            <View style={[styles.roleBadge, { borderColor: roleColors[role] }]}>
                              <Text style={[styles.roleText, { color: roleColors[role] }]}>
                                {roleLabels[role]}
                              </Text>
                            </View>
                          </View>
                          {member.profiles?.bike_model && (
                            <Text style={styles.memberBike}>
                              🏍️ {member.profiles.bike_model}
                            </Text>
                          )}
                          {member.profiles?.level && (
                            <Text style={styles.memberLevel}>
                              Level {member.profiles.level}
                            </Text>
                          )}
                        </View>
                        {canManage && !isMe && !isCreator && (
                          <View style={styles.memberActions}>
                            {isAdmin && (
                              <Pressable
                                style={styles.memberActionBtn}
                                onPress={() => handleRoleChange(member)}
                              >
                                <Feather name="shield" size={14} color={Colors.dark.secondary} />
                              </Pressable>
                            )}
                            <Pressable
                              style={styles.memberActionBtn}
                              onPress={() => confirmKick(member)}
                            >
                              <Feather name="user-minus" size={14} color={Colors.dark.sos} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'media' && (
              <>
                {loadingMedia ? (
                  <ActivityIndicator color={Colors.dark.accent} style={{ marginTop: 20 }} />
                ) : media.length === 0 ? (
                  <View style={styles.emptyMedia}>
                    <Feather name="image" size={40} color={Colors.dark.textTertiary} />
                    <Text style={styles.emptyMediaText}>No shared media yet</Text>
                    <Text style={styles.emptyMediaSub}>
                      Photos shared in chat will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mediaGrid}>
                    {media.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.mediaItem}
                        onPress={() => setImageViewerUrl(item.file_url)}
                      >
                        <Image
                          source={{ uri: item.file_url }}
                          style={styles.mediaThumb}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'settings' && (
              <View style={styles.settingsContainer}>
                <GlassCard style={styles.settingItem}>
                  <View style={styles.settingRow}>
                    <Feather name="calendar" size={16} color={Colors.dark.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Created</Text>
                      <Text style={styles.settingValue}>
                        {new Date(group.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                <GlassCard style={styles.settingItem}>
                  <View style={styles.settingRow}>
                    <Feather name="clock" size={16} color={Colors.dark.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Chat Retention</Text>
                      <Text style={styles.settingValue}>15 days</Text>
                    </View>
                  </View>
                </GlassCard>

                <GlassCard style={styles.settingItem}>
                  <View style={styles.settingRow}>
                    <Feather name="database" size={16} color={Colors.dark.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Max Upload Size</Text>
                      <Text style={styles.settingValue}>5 MB per image</Text>
                    </View>
                  </View>
                </GlassCard>

                {!isAdmin && (
                  <Pressable
                    style={styles.dangerBtn}
                    onPress={() => {
                      Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Leave', style: 'destructive', onPress: onLeave },
                      ]);
                    }}
                  >
                    <Feather name="log-out" size={16} color={Colors.dark.sos} />
                    <Text style={styles.dangerBtnText}>Leave Group</Text>
                  </Pressable>
                )}

                {isAdmin && (
                  <Pressable
                    style={[styles.dangerBtn, { borderColor: Colors.dark.sos }]}
                    onPress={() => {
                      Alert.alert(
                        'Delete Group',
                        'This will permanently delete the group and all messages. This cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: onDelete },
                        ]
                      );
                    }}
                  >
                    <Feather name="trash-2" size={16} color={Colors.dark.sos} />
                    <Text style={styles.dangerBtnText}>Delete Group</Text>
                  </Pressable>
                )}

                <View style={{ height: 40 }} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Full-screen Image Viewer */}
      {imageViewerUrl && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setImageViewerUrl(null)}>
          <Pressable style={styles.imageViewerBg} onPress={() => setImageViewerUrl(null)}>
            <Pressable style={styles.imageViewerClose} onPress={() => setImageViewerUrl(null)}>
              <Feather name="x" size={24} color="#FFF" />
            </Pressable>
            <Image
              source={{ uri: imageViewerUrl }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '70%',
    borderTopWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  groupIdentity: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  groupName: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 22,
    color: Colors.dark.text,
    marginTop: 8,
  },
  groupDesc: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  memberCountLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginTop: 4,
  },
  codeCard: {
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  codeValue: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.accent,
    letterSpacing: 6,
    marginTop: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  codeActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.accent,
  },
  tabLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  memberBike: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  memberLevel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  // Media
  emptyMedia: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyMediaText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  emptyMediaSub: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 13,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingBottom: 20,
  },
  mediaItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
  },
  // Settings
  settingsContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  settingItem: {
    padding: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
  },
  settingValue: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
    marginTop: 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.sosDim,
    backgroundColor: Colors.dark.sosDim,
    gap: 8,
    marginTop: 8,
  },
  dangerBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 15,
    color: Colors.dark.sos,
    letterSpacing: 1,
  },
  // Image Viewer
  imageViewerBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImage: {
    width: '90%',
    height: '70%',
  },
});
