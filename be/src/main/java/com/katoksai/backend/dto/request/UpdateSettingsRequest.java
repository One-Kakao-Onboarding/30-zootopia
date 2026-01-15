package com.katoksai.backend.dto.request;

import com.katoksai.backend.entity.UserSettings.DefaultTone;
import com.katoksai.backend.entity.UserSettings.ReplyMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSettingsRequest {

    private ReplyMode replyMode;
    private Integer autoReplyThreshold;
    private DefaultTone defaultTone;
    private Boolean notificationsEnabled;
    private Boolean soundEnabled;
}
