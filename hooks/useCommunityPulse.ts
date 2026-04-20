import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface PulseItem {
  id: string;
  text: string;
  icon: string;
  time: string;
  color: string;
  created_at: string;
}

export function useCommunityPulse() {
  const [feed, setFeed] = useState<PulseItem[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchPulse();

    const channelName = `community-pulse-rt-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_pulse' },
        (payload) => {
          if (isMountedRef.current && payload.new) {
            const newItem = payload.new as any;
            setFeed((prev) => [formatItem(newItem), ...prev].slice(0, 20)); // keep last 20
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPulse = async () => {
    try {
      const { data, error } = await supabase
        .from('community_pulse')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && isMountedRef.current) {
        setFeed(data.map(formatItem));
      }
    } catch (err) {
      console.warn('[CommunityPulse] Fetch error:', err);
    }
  };

  const formatItem = (item: any): PulseItem => {
    return {
      id: item.id,
      text: item.text,
      icon: item.icon,
      color: item.color,
      created_at: item.created_at,
      time: timeAgo(new Date(item.created_at))
    };
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return { feed };
}
