package com.katoksai.backend.dto.response;

import com.katoksai.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String userId;
    private String name;
    private String avatar;
    private String statusMessage;
    private String status;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .name(user.getName())
                .avatar(user.getAvatar())
                .statusMessage(user.getStatusMessage())
                .status(user.getStatus().name())
                .build();
    }
}
