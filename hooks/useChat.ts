import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
    id: string;
    group_id: string;
    sender_id: string;
    text: string;
    image_url?: string;
    created_at: string;
    profiles?: {
        username: string;
    };
    is_sending?: boolean;
}

const CHAT_CACHE_PREFIX = 'chat_cache_';

export function useChat(groupId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) {
            setMessages([]);
            return;
        }

        const loadCachedMessages = async () => {
            try {
                const cached = await AsyncStorage.getItem(`${CHAT_CACHE_PREFIX}${groupId}`);
                if (cached) {
                    setMessages(JSON.parse(cached));
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error loading chat cache:', err);
            }
        };

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*, profiles(username)')
                .eq('group_id', groupId)
                .order('created_at', { ascending: true })
                .limit(50); // Get last 50 for performance
            
            if (data) {
                setMessages(data as any[]);
                // Update Cache
                AsyncStorage.setItem(`${CHAT_CACHE_PREFIX}${groupId}`, JSON.stringify(data));
            }
            setLoading(false);
        };

        loadCachedMessages().then(fetchMessages);

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
                    
                    setMessages((prev) => {
                        const updated = [...prev, { ...newMsg, profiles: profile || undefined }];
                        // Update cache with new list
                        AsyncStorage.setItem(`${CHAT_CACHE_PREFIX}${groupId}`, JSON.stringify(updated.slice(-50)));
                        return updated;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const sendMessage = async (text: string, senderId: string, imageUri?: string) => {
        if (!groupId || (!text.trim() && !imageUri)) return;

        // Optimization: In a professional app, we'd add an optimistic local message here
        let imageUrl = null;

        if (imageUri) {
            try {
                const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
                const ext = imageUri.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
                const filePath = `${groupId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('group-images')
                    .upload(filePath, decode(base64), {
                        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                    });

                if (uploadError) {
                    console.error('Image upload error:', uploadError);
                } else {
                    const { data } = supabase.storage.from('group-images').getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                }
            } catch (err) {
                console.error('Error reading/uploading image:', err);
            }
        }

        await supabase.from('messages').insert([{
            group_id: groupId,
            sender_id: senderId,
            text: text.trim(),
            ...(imageUrl ? { image_url: imageUrl } : {})
        }]);
    };

    return { messages, loading, sendMessage };
}
