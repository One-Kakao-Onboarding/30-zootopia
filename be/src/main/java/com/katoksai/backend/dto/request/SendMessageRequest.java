package com.katoksai.backend.dto.request;

import com.katoksai.backend.entity.Message.MessageType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "메시지 내용을 입력해주세요")
    private String content;

    private MessageType type = MessageType.TEXT;

    private Boolean isAutoReply = false;
}
