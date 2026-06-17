package com.silverguard.gateway.auth;

import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import com.silverguard.core.user.User;
import com.silverguard.core.user.UserServiceImpl;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserServiceImpl userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedissonClient redissonClient;

    @Override
    public LoginResponse loginByCode(String phone, String code) {
        String cached = smsCodeMap().get(phone);
        if (cached == null || !cached.equals(code)) {
            throw new BusinessException(ResultCode.USER_SMS_CODE_INVALID);
        }
        User user = userService.findByPhone(phone);
        smsCodeMap().remove(phone);
        userService.touchLogin(user.getId());
        return buildResponse(user);
    }

    @Override
    public LoginResponse loginByPassword(String phone, String password) {
        User user = userService.findByPhone(phone);
        if (user.getPasswordHash() == null) {
            throw new BusinessException(ResultCode.USER_PASSWORD_INVALID);
        }
        if (!BCrypt.checkpw(password, user.getPasswordHash())) {
            throw new BusinessException(ResultCode.USER_PASSWORD_INVALID);
        }
        userService.touchLogin(user.getId());
        return buildResponse(user);
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        Claims claims = jwtTokenProvider.parse(refreshToken);
        if (!"refresh".equals(claims.get("rt"))) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        Long uid = Long.parseLong(claims.getSubject());
        User user = userService.findById(uid);
        return buildResponse(user);
    }

    @Override
    public void logout(String token) {
        if (token == null) return;
        try {
            Claims c = jwtTokenProvider.parse(token);
            long expireAt = c.getExpiration().getTime() - System.currentTimeMillis();
            if (expireAt > 0) {
                blacklistMap().fastPut(token, "1", expireAt, TimeUnit.MILLISECONDS);
            }
        } catch (Exception ignored) {
        }
    }

    private RMapCache<String, String> smsCodeMap() {
        return redissonClient.getMapCache("silverguard:sms:code");
    }

    private RMapCache<String, String> blacklistMap() {
        return redissonClient.getMapCache("silverguard:jwt:blacklist");
    }

    private LoginResponse buildResponse(User user) {
        LoginResponse r = new LoginResponse();
        r.userId = user.getId();
        r.realName = user.getRealName();
        r.role = user.getRole();
        r.accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole(),
                user.getRealName(), user.getCommunityId());
        r.refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        return r;
    }

    public String issueSmsCode(String phone) {
        String code = String.format("%06d", (int) (Math.random() * 1_000_000));
        smsCodeMap().fastPut(phone, code, 5, TimeUnit.MINUTES);
        log.info("[sms.issue] phone={} code={}", phone, code);
        return code;
    }
}
