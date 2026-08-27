package com.verifyle.app.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String fullName;
    private Long userId;
}
