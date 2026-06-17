package com.silverguard.gateway.auth;

import com.silverguard.common.context.UserContext;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.util.TraceUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String traceId = req.getHeader("X-Trace-Id");
        if (traceId == null || traceId.isBlank()) {
            TraceUtil.newTraceId();
        } else {
            TraceUtil.setTraceId(traceId);
        }
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                Claims claims = jwtTokenProvider.parse(token);
                if ("access".equals(claims.get("rt"))) {
                    UserContext ctx = new UserContext();
                    ctx.setUserId(Long.parseLong(claims.getSubject()));
                    ctx.setRole(claims.get("role") == null ? null : claims.get("role").toString());
                    Object cid = claims.get("cid");
                    if (cid != null) ctx.setCommunityId(Long.parseLong(cid.toString()));
                    ctx.setTraceId(TraceUtil.getTraceId());
                    UserContextHolder.set(ctx);
                }
            } catch (Exception ex) {
                log.debug("[jwt] invalid token: {}", ex.getMessage());
            }
        }
        try {
            chain.doFilter(req, res);
        } finally {
            UserContextHolder.clear();
            TraceUtil.clear();
        }
    }
}
