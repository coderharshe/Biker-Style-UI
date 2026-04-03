import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(count)');
    
    if (data) {
      setGroups(data.map(g => ({
        ...g,
        member_count: g.group_members?.[0]?.count || 0
      })));
    }
    setLoading(false);
  };

  const createGroup = async (name: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: group, error } = await supabase.from('groups').insert({
      name,
      description,
      created_by: user.id
    }).select().single();

    if (error) throw error;

    // Automatically join the group as an admin/member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    });

    fetchGroups();
    return group;
  };

  const joinGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member'
    });

    if (error) throw error;
    fetchGroups();
  };

  return { groups, loading, createGroup, joinGroup, refreshGroups: fetchGroups };
}
