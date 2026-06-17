package com.silverguard.gateway.auth;

import com.silverguard.common.result.ApiResult;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthServiceImpl authService;

    @PostMapping("/login")
    public ApiResult<AuthService.LoginResponse> login(@RequestBody LoginRequest req) {
        if (req.code != null && !req.code.isBlank()) {
            return ApiResult.ok(authService.loginByCode(req.phone, req.code));
        }
        return ApiResult.ok(authService.loginByPassword(req.phone, req.password));
    }

    @PostMapping("/sms")
    public ApiResult<String> issueSms(@RequestBody LoginRequest req) {
        return ApiResult.ok(authService.issueSmsCode(req.phone));
    }

    @PostMapping("/refresh")
    public ApiResult<AuthService.LoginResponse> refresh(@RequestBody TokenRequest req) {
        return ApiResult.ok(authService.refresh(req.token));
    }

    @PostMapping("/logout")
    public ApiResult<Void> logout(@RequestBody TokenRequest req) {
        authService.logout(req.token);
        return ApiResult.ok();
    }

    @Data
    public static class LoginRequest implements Serializable {
        private String phone;
        private String code;
        private String password;
    }

    @Data
    public static class TokenRequest implements Serializable {
        private String token;
    }
}
