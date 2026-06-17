package com.silverguard.gateway.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessExpireMinutes;
    private final long refreshExpireHours;

    public JwtTokenProvider(
            @Value("${silverguard.jwt.secret:silverguard-default-secret-key-please-change-me-in-production-env}") String secret,
            @Value("${silverguard.jwt.access-expire-minutes:60}") long accessMinutes,
            @Value("${silverguard.jwt.refresh-expire-hours:24}") long refreshHours) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes.length >= 32 ? keyBytes : pad(keyBytes));
        this.accessExpireMinutes = accessMinutes;
        this.refreshExpireHours = refreshHours;
    }

    private static byte[] pad(byte[] in) {
        byte[] out = new byte[32];
        System.arraycopy(in, 0, out, 0, Math.min(in.length, 32));
        return out;
    }

    public String createAccessToken(Long userId, String role, String realName, Long communityId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("rt", "access");
        if (realName != null) claims.put("name", realName);
        if (communityId != null) claims.put("cid", communityId);
        return build(String.valueOf(userId), claims, accessExpireMinutes * 60);
    }

    public String createRefreshToken(Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rt", "refresh");
        return build(String.valueOf(userId), claims, refreshExpireHours * 3600);
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String build(String subject, Map<String, Object> claims, long ttlSec) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSec)))
                .signWith(key)
                .compact();
    }
}
