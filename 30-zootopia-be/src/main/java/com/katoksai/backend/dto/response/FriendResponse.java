package com.katoksai.backend.dto.response;

import com.katoksai.backend.entity.Friendship;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendResponse {

    private Long id;
    private String name;
    private String avatar;
    private String statusMessage;
    private Integer intimacyScore;
    private String intimacyTrend;
    private String badge;
    private String replySpeed;
    private String initiator;
    private LocalDateTime lastContactAt;

    public static FriendResponse from(Friendship friendship) {
        return FriendResponse.builder()
                .id(friendship.getFriend().getId())
                .name(friendship.getFriend().getName())
                .avatar(friendship.getFriend().getAvatar())
                .statusMessage(friendship.getFriend().getStatusMessage())
                .intimacyScore(friendship.getIntimacyScore())
                .intimacyTrend(friendship.getIntimacyTrend().name().toLowerCase())
                .badge(friendship.getBadge().name().toLowerCase())
                .replySpeed(friendship.getReplySpeed().name().toLowerCase())
                .initiator(friendship.getInitiator().name().toLowerCase())
                .lastContactAt(friendship.getLastContactAt())
                .build();
    }
}
