package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.LoginRequest;
import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.dto.response.LoginResponse;
import com.katoksai.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "로그인", description = "userId로 로그인합니다. 존재하지 않는 사용자는 자동으로 가입됩니다.")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        String message = response.isNewUser() ? "회원가입 및 로그인 성공" : "로그인 성공";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "현재 사용자를 로그아웃합니다.")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestParam Long userId) {
        authService.logout(userId);
        return ResponseEntity.ok(ApiResponse.success("로그아웃 성공", null));
    }
}
