import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
    id: string;
    group_id: string;
    sender_id: string;
    text: string;
    created_at: string;
    profiles?: {
        username: string;
    };
}

export function useChat(groupId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, profiles(username)')
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });
            
            if (data) setMessages(data as any[]);
            setLoading(false);
        };

        fetchMessages();

        const channelName = `chat-${groupId}-${Math.random()}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
                async (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', newMsg.sender_id)
                        .single();
                    
                    setMessages((prev) => [...prev, { ...newMsg, profiles: profile || undefined }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const sendMessage = async (text: string, senderId: string) => {
        if (!groupId || !text.trim()) return;
        await supabase.from('messages').insert([{
            group_id: groupId,
            sender_id: senderId,
            text: text.trim()
        }]);
    };

    return { messages, loading, sendMessage };
}
