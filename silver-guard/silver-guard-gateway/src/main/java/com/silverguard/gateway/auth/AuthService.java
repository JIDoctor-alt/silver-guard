package com.silverguard.gateway.auth;

import java.io.Serializable;

public interface AuthService {

    LoginResponse loginByCode(String phone, String code);

    LoginResponse loginByPassword(String phone, String password);

    LoginResponse refresh(String refreshToken);

    void logout(String token);

    class LoginResponse implements Serializable {
        public String accessToken;
        public String refreshToken;
        public Long userId;
        public String realName;
        public String role;
    }
}
