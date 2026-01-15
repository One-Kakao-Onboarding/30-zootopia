package com.katoksai.backend.service;

import com.katoksai.backend.entity.User;
import com.katoksai.backend.repository.UserRepository;
import com.katoksai.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    // Store pending notifications for offline users
    private final Map<Long, Queue<NotificationPayload>> pendingNotifications = new ConcurrentHashMap<>();

    /**
     * Send message notification
     */
    public void sendMessageNotification(Long userId, String senderName, String content, Long chatRoomId) {
        // Check if user has notifications enabled
        boolean notificationsEnabled = userSettingsRepository.findByUserId(userId)
                .map(settings -> settings.getNotificationsEnabled())
                .orElse(true);

        if (!notificationsEnabled) {
            log.debug("Notifications disabled for user {}", userId);
            return;
        }

        NotificationPayload notification = NotificationPayload.builder()
                .type(NotificationType.MESSAGE)
                .title(senderName)
                .body(truncateContent(content, 50))
                .chatRoomId(chatRoomId)
                .timestamp(LocalDateTime.now())
                .build();

        sendNotification(userId, notification);
    }

    /**
     * Send event detection notification
     */
    public void sendEventNotification(Long userId, String eventType, String senderName, Long chatRoomId) {
        String title = switch (eventType.toLowerCase()) {
            case "wedding" -> "결혼 소식 감지";
            case "birthday" -> "생일 소식 감지";
            case "funeral" -> "부고 소식 감지";
            case "reunion" -> "모임 소식 감지";
            default -> "이벤트 감지";
        };

        NotificationPayload notification = NotificationPayload.builder()
                .type(NotificationType.EVENT)
                .title(title)
                .body(senderName + "님이 메시지를 보냈습니다")
                .chatRoomId(chatRoomId)
                .timestamp(LocalDateTime.now())
                .build();

        sendNotification(userId, notification);
    }

    /**
     * Send friend request notification
     */
    public void sendFriendRequestNotification(Long userId, String fromUserName) {
        NotificationPayload notification = NotificationPayload.builder()
                .type(NotificationType.FRIEND_REQUEST)
                .title("새 친구 요청")
                .body(fromUserName + "님이 친구 요청을 보냈습니다")
                .timestamp(LocalDateTime.now())
                .build();

        sendNotification(userId, notification);
    }

    /**
     * Send notification to user (via WebSocket or store for later)
     */
    private void sendNotification(Long userId, NotificationPayload notification) {
        try {
            // Try to send via WebSocket
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
            log.debug("Notification sent to user {} via WebSocket", userId);
        } catch (Exception e) {
            // Store for later delivery
            storePendingNotification(userId, notification);
            log.debug("Notification stored for offline user {}", userId);
        }
    }

    /**
     * Store pending notification for offline user
     */
    private void storePendingNotification(Long userId, NotificationPayload notification) {
        pendingNotifications.computeIfAbsent(userId, k -> new ConcurrentLinkedQueue<>())
                .add(notification);

        // Limit pending notifications to prevent memory issues
        Queue<NotificationPayload> queue = pendingNotifications.get(userId);
        while (queue.size() > 100) {
            queue.poll();
        }
    }

    /**
     * Get and clear pending notifications when user comes online
     */
    public Queue<NotificationPayload> getPendingNotifications(Long userId) {
        Queue<NotificationPayload> notifications = pendingNotifications.remove(userId);
        if (notifications != null) {
            log.debug("Delivering {} pending notifications to user {}", notifications.size(), userId);
        }
        return notifications;
    }

    /**
     * Deliver pending notifications when user connects
     */
    public void deliverPendingNotifications(Long userId) {
        Queue<NotificationPayload> pending = getPendingNotifications(userId);
        if (pending != null && !pending.isEmpty()) {
            for (NotificationPayload notification : pending) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            userId.toString(),
                            "/queue/notifications",
                            notification
                    );
                } catch (Exception e) {
                    log.error("Failed to deliver pending notification to user {}", userId, e);
                }
            }
        }
    }

    private String truncateContent(String content, int maxLength) {
        if (content == null) return "";
        if (content.length() <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    }

    // Inner classes
    public enum NotificationType {
        MESSAGE, EVENT, FRIEND_REQUEST, SYSTEM
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NotificationPayload {
        private NotificationType type;
        private String title;
        private String body;
        private Long chatRoomId;
        private LocalDateTime timestamp;
        private Map<String, Object> data;
    }
}
