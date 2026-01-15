package com.katoksai.backend.config;

import com.katoksai.backend.service.NotificationService;
import com.katoksai.backend.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final WebSocketService webSocketService;
    private final NotificationService notificationService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (headerAccessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            Long userId = (Long) auth.getPrincipal();
            webSocketService.registerUser(userId, sessionId);

            // Deliver any pending notifications
            notificationService.deliverPendingNotifications(userId);

            log.info("User {} connected via WebSocket (session: {})", userId, sessionId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (headerAccessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            Long userId = (Long) auth.getPrincipal();
            webSocketService.unregisterUser(userId, sessionId);
            log.info("User {} disconnected from WebSocket (session: {})", userId, sessionId);
        }
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();

        if (destination != null && destination.startsWith("/topic/chat/")) {
            // Extract chat room ID from destination
            String[] parts = destination.split("/");
            if (parts.length >= 4) {
                try {
                    Long chatRoomId = Long.parseLong(parts[3]);
                    webSocketService.subscribeToRoom(sessionId, chatRoomId);
                    log.debug("Session {} subscribed to chat room {}", sessionId, chatRoomId);
                } catch (NumberFormatException e) {
                    log.warn("Invalid chat room ID in subscription: {}", destination);
                }
            }
        }
    }

    @EventListener
    public void handleUnsubscribeEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        webSocketService.unsubscribeFromRoom(sessionId);
        log.debug("Session {} unsubscribed from chat room", sessionId);
    }
}
