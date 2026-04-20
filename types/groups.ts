/**
 * Type definitions for the Velox Group System.
 * Covers groups, members, messages, invites, and media gallery.
 */

// ─── Group ────────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  join_code: string;
  member_count: number;
  max_members: number;
  avatar_url: string | null;
  invite_link: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_name: string | null;
  is_riding: boolean;
  latest_message?: LatestMessage | null;
}

export interface LatestMessage {
  text?: string;
  image_url?: string;
  message_type?: MessageType;
  created_at: string;
  profiles?: { username: string };
}

// ─── Group Member ─────────────────────────────────────
export type MemberRole = 'admin' | 'moderator' | 'member';

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  is_riding: boolean;
  role: MemberRole;
  profiles?: {
    username: string;
    avatar_url: string | null;
    bike_model: string | null;
    level: number;
  };
}

// ─── Messages ─────────────────────────────────────────
export type MessageType = 'text' | 'image' | 'system' | 'location';

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  text: string;
  image_url?: string | null;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string | null;
  };
  is_sending?: boolean;
}

// ─── Group Invites ────────────────────────────────────
export interface GroupInvite {
  id: string;
  group_id: string;
  created_by: string;
  invite_code: string;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

// ─── Group Media ──────────────────────────────────────
export interface GroupMedia {
  id: string;
  group_id: string;
  uploaded_by: string;
  message_id: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  caption: string | null;
  created_at: string;
  profiles?: {
    username: string;
  };
}

// ─── Group Info Sheet Data ────────────────────────────
export interface GroupInfoData {
  group: Group;
  members: GroupMember[];
  media: GroupMedia[];
  isAdmin: boolean;
  isModerator: boolean;
}

// ─── Create/Join Params ───────────────────────────────
export interface CreateGroupParams {
  name: string;
  description?: string;
}

export interface JoinGroupParams {
  code: string;
}
