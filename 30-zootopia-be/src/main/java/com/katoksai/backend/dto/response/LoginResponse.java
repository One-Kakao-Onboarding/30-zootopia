package com.katoksai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private Long id;
    private String userId;
    private String name;
    private String avatar;
    private String statusMessage;
    private String token;
    private boolean isNewUser;
}
