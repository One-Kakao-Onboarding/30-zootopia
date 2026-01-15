package com.katoksai.backend.service;

import com.katoksai.backend.dto.request.UpdateSettingsRequest;
import com.katoksai.backend.dto.request.UpdateUserRequest;
import com.katoksai.backend.dto.response.UserResponse;
import com.katoksai.backend.dto.response.UserSettingsResponse;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.entity.UserSettings;
import com.katoksai.backend.exception.ResourceNotFoundException;
import com.katoksai.backend.repository.UserRepository;
import com.katoksai.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return UserResponse.from(user);
    }

    public UserResponse getUserByUserId(String odexUserId) {
        User user = userRepository.findByUserId(odexUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + odexUserId));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getStatusMessage() != null) {
            user.setStatusMessage(request.getStatusMessage());
        }

        User savedUser = userRepository.save(user);
        log.info("User updated: {}", userId);
        return UserResponse.from(savedUser);
    }

    public UserSettingsResponse getSettings(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Settings for user", userId));
        return UserSettingsResponse.from(settings);
    }

    @Transactional
    public UserSettingsResponse updateSettings(Long userId, UpdateSettingsRequest request) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Settings for user", userId));

        if (request.getReplyMode() != null) {
            settings.setReplyMode(request.getReplyMode());
        }
        if (request.getAutoReplyThreshold() != null) {
            settings.setAutoReplyThreshold(request.getAutoReplyThreshold());
        }
        if (request.getDefaultTone() != null) {
            settings.setDefaultTone(request.getDefaultTone());
        }
        if (request.getNotificationsEnabled() != null) {
            settings.setNotificationsEnabled(request.getNotificationsEnabled());
        }
        if (request.getSoundEnabled() != null) {
            settings.setSoundEnabled(request.getSoundEnabled());
        }

        UserSettings savedSettings = userSettingsRepository.save(settings);
        log.info("Settings updated for user: {}", userId);
        return UserSettingsResponse.from(savedSettings);
    }

    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public boolean isUserOnline(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getStatus() == User.UserStatus.ONLINE)
                .orElse(false);
    }
}
