package com.silverguard.gateway.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private static final String SECRET = "silver-guard-test-secret-key-1234567890abcdef";
    private final JwtTokenProvider provider = new JwtTokenProvider(SECRET, 60, 24);

    @Test
    @DisplayName("createAccessToken_解析后subject和claim一致")
    void createAndParseAccess() {
        String token = provider.createAccessToken(1001L, "GRID_MEMBER", "张三", 7L);
        assertNotNull(token);

        Claims claims = provider.parse(token);
        assertEquals("1001", claims.getSubject());
        assertEquals("access", claims.get("rt"));
        assertEquals("GRID_MEMBER", claims.get("role"));
        assertEquals("张三", claims.get("name"));
        assertEquals(7, claims.get("cid"));
    }

    @Test
    @DisplayName("createRefreshToken_解析后subject一致_rt=refresh")
    void createAndParseRefresh() {
        String token = provider.createRefreshToken(2002L);
        Claims claims = provider.parse(token);
        assertEquals("2002", claims.getSubject());
        assertEquals("refresh", claims.get("rt"));
    }

    @Test
    @DisplayName("密钥短于32字节_自动padding_仍可正常生成解析")
    void shortSecretPadded() {
        JwtTokenProvider shortProvider = new JwtTokenProvider("short", 60, 24);
        String token = shortProvider.createAccessToken(1L, "ADMIN", null, null);
        assertNotNull(token);
        Claims claims = shortProvider.parse(token);
        assertEquals("1", claims.getSubject());
    }

    @Test
    @DisplayName("篡改token_解析抛异常")
    void tamperedToken() {
        String token = provider.createAccessToken(1L, "ADMIN", null, null);
        String tampered = token.substring(0, token.length() - 3) + "abc";
        assertThrows(Exception.class, () -> provider.parse(tampered));
    }

    @Test
    @DisplayName("过期token_解析抛ExpiredJwtException")
    void expiredToken() {
        JwtTokenProvider expired = new JwtTokenProvider(SECRET, -1, -1);
        String token = expired.createAccessToken(1L, "ADMIN", null, null);
        // 触发延迟后再解析
        try { Thread.sleep(50); } catch (InterruptedException ignored) {}
        assertThrows(ExpiredJwtException.class, () -> expired.parse(token));
    }

    @Test
    @DisplayName("过期时间在token中正确设置")
    void expirationDateSet() {
        String token = provider.createAccessToken(1L, "ADMIN", null, null);
        Claims claims = provider.parse(token);
        assertNotNull(claims.getExpiration());
        assertTrue(claims.getExpiration().after(claims.getIssuedAt()));
    }
}
