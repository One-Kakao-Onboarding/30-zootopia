package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.SendMessageRequest;
import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.dto.response.MessageResponse;
import com.katoksai.backend.service.AIService;
import com.katoksai.backend.service.ChatRoomService;
import com.katoksai.backend.service.MessageService;
import com.katoksai.backend.service.WebSocketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/chat-rooms/{chatRoomId}/messages")
@RequiredArgsConstructor
@Tag(name = "Message", description = "메시지 API")
public class MessageController {

    private final MessageService messageService;
    private final ChatRoomService chatRoomService;
    private final WebSocketService webSocketService;
    private final AIService aiService;

    @GetMapping
    @Operation(summary = "메시지 목록 조회", description = "채팅방의 메시지 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<MessageResponse> response = messageService.getMessages(chatRoomId, userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    @Operation(summary = "전체 메시지 조회", description = "채팅방의 모든 메시지를 조회합니다.")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getAllMessages(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId) {
        List<MessageResponse> response = messageService.getAllMessages(chatRoomId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/since")
    @Operation(summary = "특정 시간 이후 메시지 조회", description = "특정 시간 이후의 메시지를 조회합니다.")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessagesSince(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId,
            @RequestParam LocalDateTime since) {
        List<MessageResponse> response = messageService.getMessagesSince(chatRoomId, userId, since);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "메시지 전송", description = "채팅방에 메시지를 전송합니다. WebSocket으로도 실시간 전송됩니다.")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.sendMessage(chatRoomId, userId, request);

        // Send via WebSocket for real-time delivery
        List<Long> memberIds = chatRoomService.getChatRoomMemberIds(chatRoomId);
        webSocketService.sendMessageToRoom(chatRoomId, response, memberIds);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "메시지 삭제", description = "메시지를 삭제합니다.")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId,
            @PathVariable Long messageId) {
        messageService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("메시지가 삭제되었습니다", null));
    }

    @PostMapping("/analyze-event")
    @Operation(summary = "메시지 이벤트 분석", description = "메시지에서 이벤트를 AI로 분석합니다.")
    public ResponseEntity<ApiResponse<AIService.EventDetectionResult>> analyzeMessageEvent(
            @PathVariable Long chatRoomId,
            @RequestParam String message) {
        AIService.EventDetectionResult result = aiService.detectEvent(message);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
