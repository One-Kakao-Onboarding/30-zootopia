package com.katoksai.backend.service;

import com.katoksai.backend.dto.request.LoginRequest;
import com.katoksai.backend.dto.response.LoginResponse;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.entity.UserSettings;
import com.katoksai.backend.exception.ResourceNotFoundException;
import com.katoksai.backend.repository.UserRepository;
import com.katoksai.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    /**
     * Simple login - checks if userId exists, throws error if not
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String userId = request.getUserId().trim();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 사용자입니다: " + userId));

        user.setStatus(User.UserStatus.ONLINE);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", userId);

        return LoginResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .name(user.getName())
                .avatar(user.getAvatar())
                .statusMessage(user.getStatusMessage())
                .token(null)
                .isNewUser(false)
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(User.UserStatus.OFFLINE);
            userRepository.save(user);
            log.info("User logged out: {}", user.getUserId());
        });
    }
}
