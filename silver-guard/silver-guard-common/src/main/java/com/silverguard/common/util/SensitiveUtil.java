package com.silverguard.common.util;

/**
 * 敏感数据脱敏工具。
 *
 * <p>对手机号、姓名、地址等字段做部分脱敏，避免日志 / 展示场景泄露完整 PII。
 */
public final class SensitiveUtil {

    private SensitiveUtil() {}

    /**
     * 手机号脱敏：138****1234
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /**
     * 姓名脱敏：李** / 张*。
     */
    public static String maskName(String name) {
        if (name == null || name.isEmpty()) {
            return name;
        }
        if (name.length() == 1) {
            return "*";
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(name.charAt(0));
        for (int i = 1; i < name.length() - 1; i++) {
            sb.append("*");
        }
        sb.append(name.charAt(name.length() - 1));
        return sb.toString();
    }

    /**
     * 地址脱敏：只保留前 10 个字符，其余打码。
     */
    public static String maskAddress(String address) {
        if (address == null || address.length() <= 10) {
            return address;
        }
        return address.substring(0, 10) + "********";
    }
}
