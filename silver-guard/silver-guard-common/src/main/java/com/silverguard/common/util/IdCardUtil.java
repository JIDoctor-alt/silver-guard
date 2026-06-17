package com.silverguard.common.util;

import cn.hutool.crypto.SecureUtil;

/**
 * 身份证相关工具。
 *
 * <p>为合规目的，身份证不在数据库中存储明文，仅存储 SHA-256 哈希
 * （加盐），用于判断档案是否重复。不得支持反解密。
 */
public final class IdCardUtil {

    /** 静态盐（Phase 1 快速落地；生产环境请通过配置中心注入）。 */
    private static final String STATIC_SALT = "silver-guard-elder-id-salt-2026";

    private IdCardUtil() {}

    /**
     * 计算加盐后的 SHA-256 哈希。
     */
    public static String hash(String idCard) {
        if (idCard == null || idCard.isBlank()) {
            return null;
        }
        return SecureUtil.sha256(idCard + "|" + STATIC_SALT);
    }

    /**
     * 脱敏展示：前 4 + **** + 后 4。
     * <pre>1101****1234</pre>
     */
    public static String mask(String idCard) {
        if (idCard == null) {
            return null;
        }
        if (idCard.length() <= 8) {
            return "****";
        }
        return idCard.substring(0, 4) + "****" + idCard.substring(idCard.length() - 4);
    }
}
