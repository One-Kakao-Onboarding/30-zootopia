package com.katoksai.backend.controller;

import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.dto.response.FriendResponse;
import com.katoksai.backend.dto.response.RelationshipStatsResponse;
import com.katoksai.backend.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
@Tag(name = "Friend", description = "친구 API")
public class FriendController {

    private final FriendService friendService;

    @GetMapping
    @Operation(summary = "친구 목록 조회", description = "현재 사용자의 친구 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(@RequestParam Long userId) {
        List<FriendResponse> response = friendService.getFriends(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/ranking")
    @Operation(summary = "친구 랭킹 조회", description = "친밀도 순으로 정렬된 친구 랭킹을 조회합니다.")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriendsRanking(@RequestParam Long userId) {
        List<FriendResponse> response = friendService.getFriendsRanking(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "관계 통계 조회", description = "친구 관계 통계를 조회합니다.")
    public ResponseEntity<ApiResponse<RelationshipStatsResponse>> getRelationshipStats(@RequestParam Long userId) {
        RelationshipStatsResponse response = friendService.getRelationshipStats(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "친구 검색", description = "이름 또는 상태메시지로 친구를 검색합니다.")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> searchFriends(
            @RequestParam Long userId,
            @RequestParam String query) {
        List<FriendResponse> response = friendService.searchFriends(userId, query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{friendId}")
    @Operation(summary = "친구 추가", description = "새로운 친구를 추가합니다.")
    public ResponseEntity<ApiResponse<FriendResponse>> addFriend(
            @RequestParam Long userId,
            @PathVariable Long friendId) {
        FriendResponse response = friendService.addFriend(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success("친구가 추가되었습니다", response));
    }

    @DeleteMapping("/{friendId}")
    @Operation(summary = "친구 삭제", description = "친구를 삭제합니다.")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @RequestParam Long userId,
            @PathVariable Long friendId) {
        friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success("친구가 삭제되었습니다", null));
    }
}
