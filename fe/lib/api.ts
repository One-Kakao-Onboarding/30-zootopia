// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LoginRequest {
  userId: string;
}

export interface LoginResponse {
  id: number;
  userId: string;
  name: string;
  avatar: string;
  statusMessage: string;
  token: string;
  isNewUser: boolean;
}

export interface UserResponse {
  id: number;
  userId: string;
  name: string;
  avatar: string;
  statusMessage: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

export interface UserSettings {
  replyMode: 'auto' | 'suggest';
  autoReplyThreshold: number;
  defaultTone: 'polite' | 'friendly' | 'formal';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  statusMessage?: string;
}

export interface UpdateSettingsRequest {
  replyMode?: 'AUTO' | 'SUGGEST';
  autoReplyThreshold?: number;
  defaultTone?: 'POLITE' | 'FRIENDLY' | 'FORMAL';
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
}

export interface ChatRoomMember {
  id: number;
  name: string;
  avatar: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface ChatRoomResponse {
  id: number;
  name: string;
  avatar: string;
  type: 'direct' | 'group';
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  intimacyScore: number;
  members: ChatRoomMember[];
}

export interface CreateChatRoomRequest {
  name?: string;
  avatar?: string;
  type?: 'DIRECT' | 'GROUP';
  memberIds: number[];
}

export interface MessageResponse {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  eventType: 'wedding' | 'birthday' | 'funeral' | 'reunion' | 'general' | null;
  eventDetected: boolean;
  aiInsight: string | null;
  isAutoReply: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  isAutoReply?: boolean;
}

export interface FriendResponse {
  id: number;
  name: string;
  avatar: string;
  statusMessage: string;
  intimacyScore: number;
  intimacyTrend: 'up' | 'down' | 'stable';
  badge: 'bestie' | 'close' | 'acquaintance' | 'distant';
  replySpeed: 'fast' | 'normal' | 'slow';
  initiator: 'me' | 'them' | 'equal';
  lastContactAt: string | null;
}

export interface RelationshipStatsResponse {
  bestieCount: number;
  closeCount: number;
  acquaintanceCount: number;
  distantCount: number;
  totalFriends: number;
  ranking: FriendResponse[];
}

export interface AIReplyOption {
  tone: string;
  message: string;
  explanation: string;
}

export interface RelationshipAnalysis {
  relationshipType: string;
  intimacyLevel: string;
  communicationStyle: string;
  summary: string;
}

export interface AIReplyResponse {
  replies: AIReplyOption[];
  recommendedIndex: number;
  aiInsight: string;
  relationshipAnalysis: RelationshipAnalysis;
}

export interface GenerateReplyRequest {
  chatRoomId: number;
  friendId: number;
  eventType: string;
}

export interface AutoReplyResult {
  shouldAutoReply: boolean;
  message: string | null;
  reason: string;
}

export interface EventDetectionResult {
  eventDetected: boolean;
  eventType: string;
  confidence: number;
  reasoning: string;
}

// Store for user session
let currentUserId: number | null = null;  // Numeric ID for API calls
let currentUserIdStr: string | null = null;  // String userId for display
let currentToken: string | null = null;

export function setSession(id: number, userId: string, token: string) {
  currentUserId = id;
  currentUserIdStr = userId;
  currentToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('userNumericId', id.toString());
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);
  }
}

export function getSession() {
  if (typeof window !== 'undefined' && currentUserId === null) {
    const numericId = localStorage.getItem('userNumericId');
    currentUserId = numericId ? parseInt(numericId, 10) : null;
    currentUserIdStr = localStorage.getItem('userId');
    currentToken = localStorage.getItem('token');
  }
  return { userId: currentUserId, userIdStr: currentUserIdStr, token: currentToken };
}

export function clearSession() {
  currentUserId = null;
  currentUserIdStr = null;
  currentToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userNumericId');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
  }
}

// API Helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { userId } = getSession();

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (userId !== null && !endpoint.includes('userId=')) {
    url.searchParams.append('userId', userId.toString());
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (userId: string): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (response.success && response.data) {
      setSession(response.data.id, response.data.userId, response.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    const { userId } = getSession();
    if (userId !== null) {
      await apiRequest(`/auth/logout?userId=${userId}`, { method: 'POST' });
    }
    clearSession();
  },
};

// User API
export const userApi = {
  getMe: async (): Promise<UserResponse> => {
    const response = await apiRequest<UserResponse>('/users/me');
    return response.data;
  },

  updateMe: async (data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await apiRequest<UserResponse>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  getSettings: async (): Promise<UserSettings> => {
    const response = await apiRequest<UserSettings>('/users/me/settings');
    return response.data;
  },

  updateSettings: async (data: UpdateSettingsRequest): Promise<UserSettings> => {
    const response = await apiRequest<UserSettings>('/users/me/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  searchUsers: async (query: string): Promise<UserResponse[]> => {
    const response = await apiRequest<UserResponse[]>(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Chat Room API
export const chatRoomApi = {
  getAll: async (): Promise<ChatRoomResponse[]> => {
    const response = await apiRequest<ChatRoomResponse[]>('/chat-rooms');
    return response.data;
  },

  getById: async (chatRoomId: number): Promise<ChatRoomResponse> => {
    const response = await apiRequest<ChatRoomResponse>(`/chat-rooms/${chatRoomId}`);
    return response.data;
  },

  create: async (data: CreateChatRoomRequest): Promise<ChatRoomResponse> => {
    const response = await apiRequest<ChatRoomResponse>('/chat-rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  leave: async (chatRoomId: number): Promise<void> => {
    await apiRequest(`/chat-rooms/${chatRoomId}`, { method: 'DELETE' });
  },

  markAsRead: async (chatRoomId: number): Promise<void> => {
    await apiRequest(`/chat-rooms/${chatRoomId}/read`, { method: 'POST' });
  },

  search: async (query: string): Promise<ChatRoomResponse[]> => {
    const response = await apiRequest<ChatRoomResponse[]>(`/chat-rooms/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiRequest<number>('/chat-rooms/unread-count');
    return response.data;
  },
};

// Message API
export const messageApi = {
  getMessages: async (chatRoomId: number, page = 0, size = 50): Promise<MessageResponse[]> => {
    const response = await apiRequest<MessageResponse[]>(
      `/chat-rooms/${chatRoomId}/messages?page=${page}&size=${size}`
    );
    return response.data;
  },

  getAllMessages: async (chatRoomId: number): Promise<MessageResponse[]> => {
    const response = await apiRequest<MessageResponse[]>(`/chat-rooms/${chatRoomId}/messages/all`);
    return response.data;
  },

  getMessagesSince: async (chatRoomId: number, since: string): Promise<MessageResponse[]> => {
    const response = await apiRequest<MessageResponse[]>(
      `/chat-rooms/${chatRoomId}/messages/since?since=${encodeURIComponent(since)}`
    );
    return response.data;
  },

  sendMessage: async (chatRoomId: number, data: SendMessageRequest): Promise<MessageResponse> => {
    const response = await apiRequest<MessageResponse>(`/chat-rooms/${chatRoomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteMessage: async (chatRoomId: number, messageId: number): Promise<void> => {
    await apiRequest(`/chat-rooms/${chatRoomId}/messages/${messageId}`, { method: 'DELETE' });
  },

  analyzeEvent: async (chatRoomId: number, message: string): Promise<EventDetectionResult> => {
    const response = await apiRequest<EventDetectionResult>(
      `/chat-rooms/${chatRoomId}/messages/analyze-event?message=${encodeURIComponent(message)}`
    );
    return response.data;
  },
};

// Friends API
export const friendsApi = {
  getAll: async (): Promise<FriendResponse[]> => {
    const response = await apiRequest<FriendResponse[]>('/friends');
    return response.data;
  },

  getRanking: async (): Promise<FriendResponse[]> => {
    const response = await apiRequest<FriendResponse[]>('/friends/ranking');
    return response.data;
  },

  getStats: async (): Promise<RelationshipStatsResponse> => {
    const response = await apiRequest<RelationshipStatsResponse>('/friends/stats');
    return response.data;
  },

  search: async (query: string): Promise<FriendResponse[]> => {
    const response = await apiRequest<FriendResponse[]>(`/friends/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  addFriend: async (friendId: number): Promise<void> => {
    await apiRequest(`/friends/${friendId}`, { method: 'POST' });
  },

  removeFriend: async (friendId: number): Promise<void> => {
    await apiRequest(`/friends/${friendId}`, { method: 'DELETE' });
  },
};

// AI API
export const aiApi = {
  analyzeRelationship: async (chatRoomId: number, friendId: number): Promise<RelationshipAnalysis> => {
    const response = await apiRequest<RelationshipAnalysis>(
      `/ai/analyze-relationship?chatRoomId=${chatRoomId}&friendId=${friendId}`,
      { method: 'POST' }
    );
    return response.data;
  },

  generateReply: async (data: GenerateReplyRequest): Promise<AIReplyResponse> => {
    const response = await apiRequest<AIReplyResponse>('/ai/generate-reply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  detectEvent: async (message: string): Promise<EventDetectionResult> => {
    const response = await apiRequest<EventDetectionResult>('/ai/detect-event', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.data;
  },

  autoReply: async (data: GenerateReplyRequest): Promise<AutoReplyResult> => {
    const response = await apiRequest<AutoReplyResult>('/ai/auto-reply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },
};

// WebSocket Helper
export function createWebSocketConnection(userId: string) {
  const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080') + '/ws';

  return {
    url: wsUrl,
    userId,
  };
}
