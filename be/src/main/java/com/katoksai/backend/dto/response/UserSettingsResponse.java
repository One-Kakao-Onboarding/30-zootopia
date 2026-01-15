package com.katoksai.backend.dto.response;

import com.katoksai.backend.entity.UserSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettingsResponse {

    private String replyMode;
    private Integer autoReplyThreshold;
    private String defaultTone;
    private Boolean notificationsEnabled;
    private Boolean soundEnabled;

    public static UserSettingsResponse from(UserSettings settings) {
        return UserSettingsResponse.builder()
                .replyMode(settings.getReplyMode().name().toLowerCase())
                .autoReplyThreshold(settings.getAutoReplyThreshold())
                .defaultTone(settings.getDefaultTone().name().toLowerCase())
                .notificationsEnabled(settings.getNotificationsEnabled())
                .soundEnabled(settings.getSoundEnabled())
                .build();
    }
}
