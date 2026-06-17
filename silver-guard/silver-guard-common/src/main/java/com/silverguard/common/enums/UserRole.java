package com.silverguard.common.enums;

import lombok.Getter;

/**
 * 用户角色（RBAC 五级）。
 */
@Getter
public enum UserRole {

    SUPER_ADMIN("超级管理员", 0),
    REGION_ADMIN("街道管理员", 1),
    COMMUNITY_ADMIN("社区管理员", 2),
    GRID_MEMBER("网格员", 3),
    FAMILY("家属", 4);

    private final String display;
    private final int level;

    UserRole(String display, int level) {
        this.display = display;
        this.level = level;
    }

    public static UserRole fromCode(String code) {
        try {
            return UserRole.valueOf(code);
        } catch (Exception ex) {
            return FAMILY;
        }
    }
}
