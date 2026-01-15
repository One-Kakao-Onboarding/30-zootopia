package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.UpdateSettingsRequest;
import com.katoksai.backend.dto.request.UpdateUserRequest;
import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.dto.response.UserResponse;
import com.katoksai.backend.dto.response.UserSettingsResponse;
import com.katoksai.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "사용자 API")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@RequestParam Long userId) {
        UserResponse response = userService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "내 정보 수정", description = "현재 로그인한 사용자의 정보를 수정합니다.")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @RequestParam Long userId,
            @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("프로필이 수정되었습니다", response));
    }

    @GetMapping("/me/settings")
    @Operation(summary = "내 설정 조회", description = "현재 로그인한 사용자의 설정을 조회합니다.")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getMySettings(@RequestParam Long userId) {
        UserSettingsResponse response = userService.getSettings(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me/settings")
    @Operation(summary = "내 설정 수정", description = "현재 로그인한 사용자의 설정을 수정합니다.")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateMySettings(
            @RequestParam Long userId,
            @RequestBody UpdateSettingsRequest request) {
        UserSettingsResponse response = userService.updateSettings(userId, request);
        return ResponseEntity.ok(ApiResponse.success("설정이 수정되었습니다", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "사용자 정보 조회", description = "특정 사용자의 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        UserResponse response = userService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "사용자 검색", description = "이름 또는 상태메시지로 사용자를 검색합니다.")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(@RequestParam String query) {
        List<UserResponse> response = userService.searchUsers(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
