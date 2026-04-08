import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  join_code?: string;
  destination_lat?: number;
  destination_lng?: number;
  destination_name?: string;
  is_riding?: boolean;
  latest_message?: {
      text?: string;
      image_url?: string;
      created_at: string;
      profiles?: { username: string };
  };
}

const GROUPS_CACHE_KEY = 'groups_list_cache';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    loadCachedGroups();
    fetchGroups();

    const channel = supabase
        .channel('groups_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
            if (isMountedRef.current) fetchGroups();
        })
        .subscribe();
        
    return () => {
        isMountedRef.current = false;
        supabase.removeChannel(channel);
    };
  }, []);

  const loadCachedGroups = async () => {
      try {
          const cached = await AsyncStorage.getItem(GROUPS_CACHE_KEY);
          if (cached && isMountedRef.current) {
              setGroups(JSON.parse(cached));
              setLoading(false);
          }
      } catch (err) {
          console.error('[Groups] Error loading cache:', err);
      }
  };

  const fetchGroups = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            if (isMountedRef.current) setLoading(false);
            return;
        }

        const { data, error } = await supabase
          .from('groups')
          .select('*, group_members!inner(user_id)')
          .eq('group_members.user_id', user.id);

        if (error) {
          console.error('[Groups] Fetch error:', error.message);
          return;
        }
        
        if (data && isMountedRef.current) {
            const myGroups = data;
            
            // Fetch latest message for each group (with error isolation)
            await Promise.allSettled(myGroups.map(async (g: any) => {
                try {
                    const { data: msgs } = await supabase
                        .from('messages')
                        .select('text, image_url, created_at, profiles(username)')
                        .eq('group_id', g.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    if (msgs && msgs.length > 0) {
                        g.latest_message = msgs[0];
                    }
                } catch {
                    // Silently fail for individual message fetch — non-critical
                }
            }));

            const finalGroups = myGroups.map((g: any) => ({
                ...g,
                latest_message: g.latest_message
            }));

            if (isMountedRef.current) {
              setGroups(finalGroups);
              AsyncStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(finalGroups)).catch(console.warn);
            }
        }
    } catch (err) {
        console.error('[Groups] fetchGroups error:', err);
    } finally {
        if (isMountedRef.current) setLoading(false);
    }
  };

  const createGroup = async (name: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to create a group.');

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: group, error } = await supabase.from('groups').insert({
      name,
      description,
      created_by: user.id,
      join_code: joinCode,
    }).select().single();

    if (error) throw error;

    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    });

    if (memberError) {
      console.error('[Groups] Error adding creator as member:', memberError.message);
    }

    fetchGroups();
    return group;
  };

  const joinGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to join a group.');

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    });

    if (error) throw error;
    fetchGroups();
  };

  const joinGroupByCode = async (code: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in.');

      const { data: group, error } = await supabase.from('groups').select('id').eq('join_code', code).single();
      if (error || !group) throw new Error('Invalid join code. Please check and try again.');

      return joinGroup(group.id);
  };

  const updateDestination = async (groupId: string, lat: number, lng: number, name: string) => {
      try {
          const { error } = await supabase.from('groups').update({
              destination_lat: lat,
              destination_lng: lng,
              destination_name: name,
          }).eq('id', groupId);

          if (error) console.error('[Groups] Update destination error:', error.message);
          fetchGroups();
      } catch (err) {
          console.error('[Groups] Update destination error:', err);
      }
  };

  const startGroupRide = async (groupId: string) => {
      try {
          const { error } = await supabase.from('groups').update({ is_riding: true }).eq('id', groupId);
          if (error) console.error('[Groups] Start ride error:', error.message);
          fetchGroups();
      } catch (err) {
          console.error('[Groups] Start ride error:', err);
      }
  };

  const endGroupRide = async (groupId: string) => {
      try {
          const { error } = await supabase.from('groups').update({
              is_riding: false, destination_lat: null, destination_lng: null, destination_name: null,
          }).eq('id', groupId);
          if (error) console.error('[Groups] End ride error:', error.message);
          fetchGroups();
      } catch (err) {
          console.error('[Groups] End ride error:', err);
      }
  };

  return { groups, loading, createGroup, joinGroup, joinGroupByCode, updateDestination, startGroupRide, endGroupRide, refreshGroups: fetchGroups };
}
