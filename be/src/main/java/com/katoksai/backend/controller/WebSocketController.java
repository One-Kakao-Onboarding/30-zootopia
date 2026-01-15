package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.SendMessageRequest;
import com.katoksai.backend.dto.response.MessageResponse;
import com.katoksai.backend.service.ChatRoomService;
import com.katoksai.backend.service.MessageService;
import com.katoksai.backend.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MessageService messageService;
    private final ChatRoomService chatRoomService;
    private final WebSocketService webSocketService;

    /**
     * Handle incoming chat messages via WebSocket
     * Client sends to: /app/chat/{chatRoomId}/send
     * Server broadcasts to: /topic/chat/{chatRoomId}
     */
    @MessageMapping("/chat/{chatRoomId}/send")
    public void sendMessage(
            @DestinationVariable Long chatRoomId,
            @Payload SendMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        Long userId = extractUserId(headerAccessor);
        if (userId == null) {
            log.warn("Received message without authenticated user");
            return;
        }

        log.debug("WebSocket message from user {} to room {}: {}", userId, chatRoomId, request.getContent());

        // Save message and get response
        MessageResponse response = messageService.sendMessage(chatRoomId, userId, request);

        // Broadcast to all room subscribers
        List<Long> memberIds = chatRoomService.getChatRoomMemberIds(chatRoomId);
        webSocketService.sendMessageToRoom(chatRoomId, response, memberIds);
    }

    /**
     * Handle typing indicator
     * Client sends to: /app/chat/{chatRoomId}/typing
     * Server broadcasts to: /topic/chat/{chatRoomId}/typing
     */
    @MessageMapping("/chat/{chatRoomId}/typing")
    public void handleTyping(
            @DestinationVariable Long chatRoomId,
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor) {

        Long userId = extractUserId(headerAccessor);
        if (userId == null) return;

        String userName = (String) payload.getOrDefault("userName", "Unknown");
        boolean isTyping = (boolean) payload.getOrDefault("isTyping", false);

        webSocketService.sendTypingIndicator(chatRoomId, userId, userName, isTyping);
    }

    /**
     * Handle read receipt
     * Client sends to: /app/chat/{chatRoomId}/read
     * Server broadcasts to: /topic/chat/{chatRoomId}/read
     */
    @MessageMapping("/chat/{chatRoomId}/read")
    public void handleReadReceipt(
            @DestinationVariable Long chatRoomId,
            SimpMessageHeaderAccessor headerAccessor) {

        Long userId = extractUserId(headerAccessor);
        if (userId == null) return;

        chatRoomService.markAsRead(chatRoomId, userId);
        webSocketService.sendReadReceipt(chatRoomId, userId);
    }

    /**
     * Handle entering a chat room (for presence)
     * Client sends to: /app/chat/{chatRoomId}/enter
     */
    @MessageMapping("/chat/{chatRoomId}/enter")
    public void handleEnterRoom(
            @DestinationVariable Long chatRoomId,
            SimpMessageHeaderAccessor headerAccessor) {

        Long userId = extractUserId(headerAccessor);
        String sessionId = headerAccessor.getSessionId();

        if (userId == null || sessionId == null) return;

        webSocketService.subscribeToRoom(sessionId, chatRoomId);
        chatRoomService.markAsRead(chatRoomId, userId);

        log.debug("User {} entered chat room {}", userId, chatRoomId);
    }

    /**
     * Handle leaving a chat room (for presence)
     * Client sends to: /app/chat/{chatRoomId}/leave
     */
    @MessageMapping("/chat/{chatRoomId}/leave")
    public void handleLeaveRoom(
            @DestinationVariable Long chatRoomId,
            SimpMessageHeaderAccessor headerAccessor) {

        String sessionId = headerAccessor.getSessionId();
        if (sessionId == null) return;

        webSocketService.unsubscribeFromRoom(sessionId);

        Long userId = extractUserId(headerAccessor);
        log.debug("User {} left chat room {}", userId, chatRoomId);
    }

    private Long extractUserId(SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            return (Long) auth.getPrincipal();
        }
        return null;
    }
}
