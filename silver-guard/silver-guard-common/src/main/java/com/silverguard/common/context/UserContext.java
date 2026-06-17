package com.silverguard.common.context;

import lombok.Data;

/**
 * 登录用户上下文（线程变量）。
 *
 * <p>在 JWT 过滤器解析 token 后写入 {@link UserContext}，业务 Service 层
 * 可通过 {@link UserContextHolder} 获取。
 */
@Data
public class UserContext {

    private Long userId;
    private String username;
    private String realName;
    private String role;            // 如：GRID_MEMBER
    private Long communityId;       // 所属社区（仅网格员 / 管理员为所属社区）
    private String traceId;
    private long loginAt;
}
