/**
 * ChatBubble – Renders individual chat messages with support for
 * text, images, system messages, and location shares.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import type { ChatMessage } from '@/types/groups';

interface ChatBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  showSender: boolean;
}

export default function ChatBubble({ message, isMe, showSender }: ChatBubbleProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  const senderName = message.profiles?.username || 'Rider';
  const timeString = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // System messages render differently
  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMsgWrap}>
        <View style={styles.systemMsgBubble}>
          <Feather name="info" size={12} color={Colors.dark.textTertiary} />
          <Text style={styles.systemMsgText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Location shares
  if (message.message_type === 'location') {
    const metadata = message.metadata as { lat?: number; lng?: number; label?: string };
    return (
      <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
        {showSender && !isMe && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Feather name="map-pin" size={18} color={Colors.dark.accent} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>
                {metadata?.label || 'Shared Location'}
              </Text>
              {metadata?.lat && metadata?.lng && (
                <Text style={styles.locationCoords}>
                  {metadata.lat.toFixed(4)}, {metadata.lng.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
          <Text style={[styles.time, isMe && styles.timeMe]}>{timeString}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
        {showSender && !isMe && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.bubble, isMe && styles.bubbleMe, message.is_sending && styles.bubbleSending]}>
          {/* Image */}
          {message.image_url ? (
            <Pressable onPress={() => setImageViewerUrl(message.image_url!)}>
              <View style={styles.imageContainer}>
                {imageLoading && (
                  <ActivityIndicator
                    color={Colors.dark.accent}
                    style={styles.imageLoader}
                  />
                )}
                <Image
                  source={{ uri: message.image_url }}
                  style={styles.chatImage}
                  resizeMode="cover"
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            </Pressable>
          ) : null}

          {/* Text content */}
          {message.text ? (
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {message.text}
            </Text>
          ) : null}

          {/* Time + sending indicator */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, isMe && styles.timeMe]}>{timeString}</Text>
            {message.is_sending && (
              <Feather name="clock" size={10} color={Colors.dark.textTertiary} />
            )}
          </View>
        </View>
      </View>

      {/* Full-screen Image Viewer */}
      {imageViewerUrl && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setImageViewerUrl(null)}>
          <Pressable style={styles.viewerBg} onPress={() => setImageViewerUrl(null)}>
            <Pressable style={styles.viewerClose} onPress={() => setImageViewerUrl(null)}>
              <Feather name="x" size={24} color="#FFF" />
            </Pressable>
            <Image
              source={{ uri: imageViewerUrl }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Bubble layout
  bubbleWrap: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    gap: 3,
    marginBottom: 4,
  },
  bubbleWrapMe: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 11,
    color: Colors.dark.secondary,
    marginLeft: 12,
  },
  bubble: {
    backgroundColor: Colors.dark.card,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  bubbleMe: {
    backgroundColor: Colors.dark.accentDim,
    borderColor: Colors.dark.accent + '30',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
  },
  bubbleSending: {
    opacity: 0.7,
  },

  // Text
  messageText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  messageTextMe: {
    color: Colors.dark.text,
  },

  // Image
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: Colors.dark.surface,
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    zIndex: 2,
  },
  chatImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: Colors.dark.text,
  },
  locationCoords: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 10,
    color: Colors.dark.textTertiary,
  },
  timeMe: {},

  // System messages
  systemMsgWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  systemMsgBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  systemMsgText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },

  // Image Viewer
  viewerBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
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
  viewerImage: {
    width: '92%',
    height: '72%',
  },
});
