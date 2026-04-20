/**
 * useGroups – Production-grade hook for Velox group management.
 * Handles CRUD, membership, invite codes, ride state, and real-time sync.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, GroupMember, GroupMedia, MemberRole, GroupInvite } from '@/types/groups';

const GROUPS_CACHE_KEY = 'groups_list_cache_v2';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // ─── Lifecycle ────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    loadCachedGroups();
    fetchGroups();

    // Real-time: listen to group + member changes
    const groupChannel = supabase
      .channel('groups_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        if (isMountedRef.current) fetchGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        if (isMountedRef.current) fetchGroups();
      })
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(groupChannel);
    };
  }, []);

  // ─── Cache Management ─────────────────────────────
  const loadCachedGroups = async () => {
    try {
      const cached = await AsyncStorage.getItem(GROUPS_CACHE_KEY);
      if (cached && isMountedRef.current) {
        setGroups(JSON.parse(cached));
        setLoading(false);
      }
    } catch (err) {
      console.error('[Groups] Cache load error:', err);
    }
  };

  const persistCache = (data: Group[]) => {
    AsyncStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(data)).catch(console.warn);
  };

  // ─── Fetch Groups ─────────────────────────────────
  const fetchGroups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members!inner(user_id)')
        .eq('group_members.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[Groups] Fetch error:', error.message);
        return;
      }

      if (data && isMountedRef.current) {
        // Fetch latest message for each group in parallel (with error isolation)
        await Promise.allSettled(data.map(async (g: any) => {
          try {
            const { data: msgs } = await supabase
              .from('messages')
              .select('text, image_url, message_type, created_at, profiles(username)')
              .eq('group_id', g.id)
              .order('created_at', { ascending: false })
              .limit(1);
            if (msgs && msgs.length > 0) {
              g.latest_message = msgs[0];
            }
          } catch {
            // Non-critical: silently fail
          }
        }));

        const finalGroups: Group[] = data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          created_by: g.created_by,
          created_at: g.created_at,
          updated_at: g.updated_at,
          join_code: g.join_code,
          member_count: g.member_count ?? 0,
          max_members: g.max_members ?? 50,
          avatar_url: g.avatar_url,
          invite_link: g.invite_link,
          destination_lat: g.destination_lat,
          destination_lng: g.destination_lng,
          destination_name: g.destination_name,
          is_riding: g.is_riding ?? false,
          latest_message: g.latest_message ?? null,
        }));

        if (isMountedRef.current) {
          setGroups(finalGroups);
          persistCache(finalGroups);
        }
      }
    } catch (err) {
      console.error('[Groups] fetchGroups error:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // ─── Create Group ─────────────────────────────────
  const createGroup = async (name: string, description: string): Promise<Group> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to create a group.');

    const joinCode = generateJoinCode();

    const { data: group, error } = await supabase.from('groups').insert({
      name,
      description: description || 'A new riding crew',
      created_by: user.id,
      join_code: joinCode,
      member_count: 1,
    }).select().single();

    if (error) throw error;

    // Auto-add creator as admin
    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    });

    if (memberError) {
      console.error('[Groups] Error adding creator as member:', memberError.message);
    }

    await fetchGroups();
    return group as Group;
  };

  // ─── Join Group By ID ─────────────────────────────
  const joinGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to join a group.');

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) throw new Error('You are already a member of this group.');

    // Check member limit
    const { data: group } = await supabase
      .from('groups')
      .select('member_count, max_members')
      .eq('id', groupId)
      .single();

    if (group && group.member_count >= group.max_members) {
      throw new Error('This group is full.');
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    });

    if (error) throw error;
    await fetchGroups();
  };

  // ─── Join Group By Code ───────────────────────────
  const joinGroupByCode = async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in.');

    const normalizedCode = code.trim().toUpperCase();

    const { data: group, error } = await supabase
      .from('groups')
      .select('id')
      .eq('join_code', normalizedCode)
      .single();

    if (error || !group) throw new Error('Invalid join code. Please check and try again.');

    return joinGroup(group.id);
  };

  // ─── Leave Group ──────────────────────────────────
  const leaveGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in.');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchGroups();
  };

  // ─── Delete Group (Admin only) ────────────────────
  const deleteGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in.');

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('created_by', user.id);

    if (error) throw error;
    await fetchGroups();
  };

  // ─── Update Group Info ────────────────────────────
  const updateGroupInfo = async (groupId: string, updates: { name?: string; description?: string }) => {
    const { error } = await supabase
      .from('groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
    await fetchGroups();
  };

  // ─── Regenerate Join Code ─────────────────────────
  const regenerateJoinCode = async (groupId: string): Promise<string> => {
    const newCode = generateJoinCode();
    const { error } = await supabase
      .from('groups')
      .update({ join_code: newCode, updated_at: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
    await fetchGroups();
    return newCode;
  };

  // ─── Fetch Group Members ──────────────────────────
  const fetchMembers = async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, profiles(username, avatar_url, bike_model, level)')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('[Groups] Fetch members error:', error.message);
      return [];
    }

    return (data ?? []) as GroupMember[];
  };

  // ─── Update Member Role ───────────────────────────
  const updateMemberRole = async (groupId: string, userId: string, role: MemberRole) => {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  };

  // ─── Kick Member (Admin only) ─────────────────────
  const kickMember = async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  };

  // ─── Fetch Group Media Gallery ────────────────────
  const fetchMedia = async (groupId: string, limit = 30): Promise<GroupMedia[]> => {
    const { data, error } = await supabase
      .from('group_media')
      .select('*, profiles(username)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Groups] Fetch media error:', error.message);
      return [];
    }
    return (data ?? []) as GroupMedia[];
  };

  // ─── Destination & Ride Controls ──────────────────
  const updateDestination = async (groupId: string, lat: number, lng: number, name: string) => {
    try {
      const { error } = await supabase.from('groups').update({
        destination_lat: lat,
        destination_lng: lng,
        destination_name: name,
        updated_at: new Date().toISOString(),
      }).eq('id', groupId);

      if (error) console.error('[Groups] Update destination error:', error.message);
      await fetchGroups();
    } catch (err) {
      console.error('[Groups] Update destination error:', err);
    }
  };

  const startGroupRide = async (groupId: string) => {
    try {
      const { error } = await supabase.from('groups').update({
        is_riding: true,
        updated_at: new Date().toISOString(),
      }).eq('id', groupId);
      if (error) console.error('[Groups] Start ride error:', error.message);
      await fetchGroups();
    } catch (err) {
      console.error('[Groups] Start ride error:', err);
    }
  };

  const endGroupRide = async (groupId: string) => {
    try {
      const { error } = await supabase.from('groups').update({
        is_riding: false,
        destination_lat: null,
        destination_lng: null,
        destination_name: null,
        updated_at: new Date().toISOString(),
      }).eq('id', groupId);
      if (error) console.error('[Groups] End ride error:', error.message);
      await fetchGroups();
    } catch (err) {
      console.error('[Groups] End ride error:', err);
    }
  };

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    joinGroupByCode,
    leaveGroup,
    deleteGroup,
    updateGroupInfo,
    regenerateJoinCode,
    fetchMembers,
    updateMemberRole,
    kickMember,
    fetchMedia,
    updateDestination,
    startGroupRide,
    endGroupRide,
    refreshGroups: fetchGroups,
  };
}

// ─── Helpers ──────────────────────────────────────────
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
