package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.CreateChatRoomRequest;
import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.dto.response.ChatRoomResponse;
import com.katoksai.backend.service.ChatRoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat-rooms")
@RequiredArgsConstructor
@Tag(name = "ChatRoom", description = "채팅방 API")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @GetMapping
    @Operation(summary = "채팅방 목록 조회", description = "현재 사용자의 채팅방 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getChatRooms(@RequestParam Long userId) {
        List<ChatRoomResponse> response = chatRoomService.getChatRooms(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "채팅방 생성", description = "새로운 채팅방을 생성합니다. 1:1 채팅의 경우 기존 채팅방이 있으면 해당 채팅방을 반환합니다.")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createChatRoom(
            @RequestParam Long userId,
            @Valid @RequestBody CreateChatRoomRequest request) {
        ChatRoomResponse response = chatRoomService.createChatRoom(userId, request);
        return ResponseEntity.ok(ApiResponse.success("채팅방이 생성되었습니다", response));
    }

    @GetMapping("/{chatRoomId}")
    @Operation(summary = "채팅방 정보 조회", description = "특정 채팅방의 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getChatRoom(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId) {
        ChatRoomResponse response = chatRoomService.getChatRoom(chatRoomId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{chatRoomId}")
    @Operation(summary = "채팅방 나가기", description = "채팅방에서 나갑니다.")
    public ResponseEntity<ApiResponse<Void>> leaveChatRoom(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId) {
        chatRoomService.leaveChatRoom(chatRoomId, userId);
        return ResponseEntity.ok(ApiResponse.success("채팅방에서 나갔습니다", null));
    }

    @PostMapping("/{chatRoomId}/read")
    @Operation(summary = "읽음 처리", description = "채팅방의 메시지를 읽음 처리합니다.")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @RequestParam Long userId,
            @PathVariable Long chatRoomId) {
        chatRoomService.markAsRead(chatRoomId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/search")
    @Operation(summary = "채팅방 검색", description = "채팅방을 검색합니다.")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> searchChatRooms(
            @RequestParam Long userId,
            @RequestParam String query) {
        List<ChatRoomResponse> response = chatRoomService.searchChatRooms(userId, query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "총 읽지 않은 메시지 수 조회", description = "모든 채팅방의 읽지 않은 메시지 수를 조회합니다.")
    public ResponseEntity<ApiResponse<Integer>> getTotalUnreadCount(@RequestParam Long userId) {
        Integer count = chatRoomService.getTotalUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
