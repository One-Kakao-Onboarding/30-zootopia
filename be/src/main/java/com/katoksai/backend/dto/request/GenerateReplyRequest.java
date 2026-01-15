package com.katoksai.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateReplyRequest {

    private Long chatRoomId;
    private Long friendId;
    private String eventType;
}
