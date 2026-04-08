import { useState, useEffect, useRef } from 'react';
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
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        if (!groupId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const loadCachedMessages = async () => {
            try {
                const cached = await AsyncStorage.getItem(`${CHAT_CACHE_PREFIX}${groupId}`);
                if (cached && isMountedRef.current) {
                    setMessages(JSON.parse(cached));
                    setLoading(false);
                }
            } catch (err) {
                console.error('[Chat] Error loading cache:', err);
            }
        };

        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*, profiles(username)')
                    .eq('group_id', groupId)
                    .order('created_at', { ascending: true })
                    .limit(50);
                
                if (error) {
                    console.error('[Chat] Fetch error:', error.message);
                    return;
                }

                if (data && isMountedRef.current) {
                    setMessages(data as ChatMessage[]);
                    AsyncStorage.setItem(
                        `${CHAT_CACHE_PREFIX}${groupId}`,
                        JSON.stringify(data)
                    ).catch(console.warn);
                }
            } catch (err) {
                console.error('[Chat] Fetch error:', err);
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };

        loadCachedMessages().then(fetchMessages);

        const channelName = `chat-${groupId}-${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
                async (payload) => {
                    if (!isMountedRef.current) return;

                    const newMsg = payload.new as ChatMessage;

                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('username')
                            .eq('id', newMsg.sender_id)
                            .single();
                        
                        if (!isMountedRef.current) return;

                        setMessages((prev) => {
                            // Deduplicate - avoid adding if already present
                            if (prev.some(m => m.id === newMsg.id)) return prev;

                            const updated = [...prev, { ...newMsg, profiles: profile || undefined }];
                            AsyncStorage.setItem(
                                `${CHAT_CACHE_PREFIX}${groupId}`,
                                JSON.stringify(updated.slice(-50))
                            ).catch(console.warn);
                            return updated;
                        });
                    } catch (err) {
                        console.warn('[Chat] Error fetching profile for new message:', err);
                    }
                }
            )
            .subscribe();

        return () => {
            isMountedRef.current = false;
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const sendMessage = async (text: string, senderId: string, imageUri?: string) => {
        if (!groupId || (!text.trim() && !imageUri)) return;

        let imageUrl: string | null = null;

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
                    console.error('[Chat] Image upload error:', uploadError);
                } else {
                    const { data } = supabase.storage.from('group-images').getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                }
            } catch (err) {
                console.error('[Chat] Error reading/uploading image:', err);
            }
        }

        try {
            const { error } = await supabase.from('messages').insert([{
                group_id: groupId,
                sender_id: senderId,
                text: text.trim(),
                ...(imageUrl ? { image_url: imageUrl } : {}),
            }]);

            if (error) {
                console.error('[Chat] Send message error:', error.message);
            }
        } catch (err) {
            console.error('[Chat] Send message error:', err);
        }
    };

    return { messages, loading, sendMessage };
}
