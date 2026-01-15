package com.katoksai.backend.service;

import com.katoksai.backend.dto.response.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    // Track connected users: userId -> Set of sessionIds
    private final Map<Long, Set<String>> connectedUsers = new ConcurrentHashMap<>();

    // Track which chat rooms users are currently viewing
    private final Map<String, Long> sessionToChatRoom = new ConcurrentHashMap<>();

    public void registerUser(Long userId, String sessionId) {
        connectedUsers.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        log.info("User {} connected with session {}", userId, sessionId);
    }

    public void unregisterUser(Long userId, String sessionId) {
        Set<String> sessions = connectedUsers.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                connectedUsers.remove(userId);
            }
        }
        sessionToChatRoom.remove(sessionId);
        log.info("User {} disconnected session {}", userId, sessionId);
    }

    public void subscribeToRoom(String sessionId, Long chatRoomId) {
        sessionToChatRoom.put(sessionId, chatRoomId);
        log.debug("Session {} subscribed to room {}", sessionId, chatRoomId);
    }

    public void unsubscribeFromRoom(String sessionId) {
        sessionToChatRoom.remove(sessionId);
        log.debug("Session {} unsubscribed from room", sessionId);
    }

    public boolean isUserOnline(Long userId) {
        Set<String> sessions = connectedUsers.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public boolean isUserInChatRoom(Long userId, Long chatRoomId) {
        Set<String> sessions = connectedUsers.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return false;
        }

        return sessions.stream()
                .anyMatch(sessionId -> chatRoomId.equals(sessionToChatRoom.get(sessionId)));
    }

    /**
     * Send message to chat room via WebSocket
     * Also sends push notification to offline users
     */
    public void sendMessageToRoom(Long chatRoomId, MessageResponse message, List<Long> memberIds) {
        // Send to WebSocket subscribers
        messagingTemplate.convertAndSend(
                "/topic/chat/" + chatRoomId,
                message
        );
        log.debug("Message sent to room {} via WebSocket", chatRoomId);

        // Send notifications to offline users or users not viewing this chat
        for (Long memberId : memberIds) {
            if (!memberId.equals(message.getSenderId())) {
                if (!isUserInChatRoom(memberId, chatRoomId)) {
                    // User is offline or not viewing this chat - send notification
                    notificationService.sendMessageNotification(
                            memberId,
                            message.getSenderName(),
                            message.getContent(),
                            chatRoomId
                    );
                }
            }
        }
    }

    /**
     * Send typing indicator to room
     */
    public void sendTypingIndicator(Long chatRoomId, Long userId, String userName, boolean isTyping) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "userName", userName,
                "isTyping", isTyping
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/" + chatRoomId + "/typing",
                payload
        );
    }

    /**
     * Send read receipt to room
     */
    public void sendReadReceipt(Long chatRoomId, Long userId) {
        Map<String, Object> payload = Map.of(
                "userId", userId,
                "chatRoomId", chatRoomId
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/" + chatRoomId + "/read",
                payload
        );
    }

    /**
     * Send notification to specific user
     */
    public void sendToUser(Long userId, String destination, Object payload) {
        if (isUserOnline(userId)) {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    destination,
                    payload
            );
        }
    }

    /**
     * Broadcast to all online users
     */
    public void broadcast(String destination, Object payload) {
        messagingTemplate.convertAndSend(destination, payload);
    }

    public int getOnlineUserCount() {
        return connectedUsers.size();
    }

    public Set<Long> getOnlineUsers() {
        return connectedUsers.keySet();
    }
}
