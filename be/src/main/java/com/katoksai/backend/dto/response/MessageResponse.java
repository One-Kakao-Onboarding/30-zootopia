package com.katoksai.backend.dto.response;

import com.katoksai.backend.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Long id;
    private Long chatRoomId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;
    private String eventType;
    private Boolean eventDetected;
    private String aiInsight;
    private Boolean isAutoReply;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoom().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .senderAvatar(message.getSender().getAvatar())
                .content(message.getContent())
                .type(message.getType().name().toLowerCase())
                .eventType(message.getEventType() != null ? message.getEventType().name().toLowerCase() : null)
                .eventDetected(message.getEventDetected())
                .aiInsight(message.getAiInsight())
                .isAutoReply(message.getIsAutoReply())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
