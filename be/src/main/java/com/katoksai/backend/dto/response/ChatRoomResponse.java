package com.katoksai.backend.dto.response;

import com.katoksai.backend.entity.ChatRoom;
import com.katoksai.backend.entity.ChatRoomMember;
import com.katoksai.backend.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomResponse {

    private Long id;
    private String name;
    private String avatar;
    private String type;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;
    private Integer intimacyScore;
    private List<ChatRoomMemberResponse> members;

    public static ChatRoomResponse from(ChatRoom chatRoom, Long currentUserId, Message lastMessage, Integer unreadCount, Integer intimacyScore) {
        String displayName = chatRoom.getName();
        String displayAvatar = chatRoom.getAvatar();

        // For direct chat, show the other user's name and avatar
        if (chatRoom.getType() == ChatRoom.ChatRoomType.DIRECT) {
            for (ChatRoomMember member : chatRoom.getMembers()) {
                if (!member.getUser().getId().equals(currentUserId) && member.getLeftAt() == null) {
                    displayName = member.getUser().getName();
                    displayAvatar = member.getUser().getAvatar();
                    break;
                }
            }
        }

        List<ChatRoomMemberResponse> memberResponses = chatRoom.getMembers().stream()
                .filter(m -> m.getLeftAt() == null)
                .map(m -> ChatRoomMemberResponse.builder()
                        .id(m.getUser().getId())
                        .name(m.getUser().getName())
                        .avatar(m.getUser().getAvatar())
                        .role(m.getRole().name())
                        .build())
                .toList();

        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .name(displayName)
                .avatar(displayAvatar)
                .type(chatRoom.getType().name().toLowerCase())
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : chatRoom.getCreatedAt())
                .unreadCount(unreadCount)
                .intimacyScore(intimacyScore)
                .members(memberResponses)
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRoomMemberResponse {
        private Long id;
        private String name;
        private String avatar;
        private String role;
    }
}
