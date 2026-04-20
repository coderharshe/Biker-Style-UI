/**
 * useChat – Production-grade real-time chat hook for Velox groups.
 * Handles text + image messages, real-time sync, optimistic sending,
 * image upload to Supabase Storage, and local message caching.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, MessageType } from '@/types/groups';

const CHAT_CACHE_PREFIX = 'chat_cache_v2_';
const MESSAGE_LIMIT = 100;

export function useChat(groupId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isMountedRef = useRef(true);

  // ─── Lifecycle ────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    loadCachedMessages(groupId);
    fetchMessages(groupId);

    // Real-time subscription
    const channelName = `chat-${groupId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (!isMountedRef.current) return;
          const newMsg = payload.new as ChatMessage;

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            if (!isMountedRef.current) return;

            setMessages((prev) => {
              // Deduplicate
              if (prev.some((m) => m.id === newMsg.id)) return prev;

              // Remove optimistic placeholders for this sender
              const filtered = prev.filter(
                (m) => !(m.is_sending && m.sender_id === newMsg.sender_id && m.text === newMsg.text)
              );

              const updated = [...filtered, { ...newMsg, profiles: profile || undefined }];
              cacheMessages(groupId, updated);
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

  // ─── Cache ────────────────────────────────────────
  const loadCachedMessages = async (gId: string) => {
    try {
      const cached = await AsyncStorage.getItem(`${CHAT_CACHE_PREFIX}${gId}`);
      if (cached && isMountedRef.current) {
        setMessages(JSON.parse(cached));
        setLoading(false);
      }
    } catch (err) {
      console.error('[Chat] Cache load error:', err);
    }
  };

  const cacheMessages = (gId: string, msgs: ChatMessage[]) => {
    AsyncStorage.setItem(
      `${CHAT_CACHE_PREFIX}${gId}`,
      JSON.stringify(msgs.slice(-MESSAGE_LIMIT))
    ).catch(console.warn);
  };

  // ─── Fetch Messages ───────────────────────────────
  const fetchMessages = useCallback(async (gId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url)')
        .eq('group_id', gId)
        .order('created_at', { ascending: true })
        .limit(MESSAGE_LIMIT);

      if (error) {
        console.error('[Chat] Fetch error:', error.message);
        return;
      }

      if (data && isMountedRef.current) {
        const typedData = data as ChatMessage[];
        setMessages(typedData);
        cacheMessages(gId, typedData);
      }
    } catch (err) {
      console.error('[Chat] Fetch error:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // ─── Send Text Message ────────────────────────────
  const sendMessage = async (
    text: string,
    senderId: string,
    imageUri?: string
  ) => {
    if (!groupId || (!text.trim() && !imageUri)) return;

    setSending(true);
    let imageUrl: string | null = null;
    let messageType: MessageType = 'text';

    // Upload image if provided
    if (imageUri) {
      messageType = 'image';
      try {
        imageUrl = await uploadImage(groupId, imageUri);
      } catch (err) {
        console.error('[Chat] Image upload failed:', err);
        setSending(false);
        throw new Error('Failed to upload image. Please try again.');
      }
    }

    // Optimistic local message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      group_id: groupId,
      sender_id: senderId,
      text: text.trim(),
      image_url: imageUrl ?? undefined,
      message_type: messageType,
      metadata: {},
      created_at: new Date().toISOString(),
      is_sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const insertPayload: Record<string, unknown> = {
        group_id: groupId,
        sender_id: senderId,
        text: text.trim(),
        message_type: messageType,
      };

      if (imageUrl) {
        insertPayload.image_url = imageUrl;
      }

      const { data: insertedMsg, error } = await supabase
        .from('messages')
        .insert([insertPayload])
        .select('id')
        .single();

      if (error) {
        console.error('[Chat] Send message error:', error.message);
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        throw error;
      }

      // If image was uploaded, also track it in group_media
      if (imageUrl && insertedMsg) {
        await supabase.from('group_media').insert({
          group_id: groupId,
          uploaded_by: senderId,
          message_id: insertedMsg.id,
          file_url: imageUrl,
          file_type: 'image',
          caption: text.trim() || null,
        }).then(({ error: mediaError }) => {
          if (mediaError) console.warn('[Chat] Media tracking error:', mediaError.message);
        });
      }
    } catch (err) {
      console.error('[Chat] Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  // ─── Send Location Share ──────────────────────────
  const sendLocation = async (
    senderId: string,
    lat: number,
    lng: number,
    label?: string
  ) => {
    if (!groupId) return;

    try {
      const { error } = await supabase.from('messages').insert([{
        group_id: groupId,
        sender_id: senderId,
        text: label || `📍 Shared location`,
        message_type: 'location',
        metadata: { lat, lng, label },
      }]);

      if (error) console.error('[Chat] Send location error:', error.message);
    } catch (err) {
      console.error('[Chat] Send location error:', err);
    }
  };

  return { messages, loading, sending, sendMessage, sendLocation };
}

// ─── Image Upload Helper ────────────────────────────
async function uploadImage(groupId: string, imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64' as const,
  });

  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${groupId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('group-images')
    .upload(filePath, decode(base64), {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('group-images').getPublicUrl(filePath);
  return data.publicUrl;
}
