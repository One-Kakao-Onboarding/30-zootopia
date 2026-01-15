package com.katoksai.backend.dto.request;

import com.katoksai.backend.entity.ChatRoom.ChatRoomType;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatRoomRequest {

    private String name;

    private String avatar;

    private ChatRoomType type = ChatRoomType.DIRECT;

    @NotEmpty(message = "채팅 참여자를 선택해주세요")
    private List<Long> memberIds;
}
