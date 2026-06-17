package com.silverguard.common.enums;

import lombok.Getter;

/**
 * 预警等级。
 *
 * <p>数值越大等级越高：L1 提示 &lt; L2 关注 &lt; L3 严重 &lt; L4 紧急。
 */
@Getter
public enum EventLevel {

    L1(1, "提示", "INFO"),
    L2(2, "关注", "WARN"),
    L3(3, "严重", "ERROR"),
    L4(4, "紧急", "CRITICAL");

    private final int level;
    private final String display;
    private final String severity;

    EventLevel(int level, String display, String severity) {
        this.level = level;
        this.display = display;
        this.severity = severity;
    }

    public static EventLevel of(int level) {
        for (EventLevel l : values()) {
            if (l.level == level) {
                return l;
            }
        }
        return L1;
    }
}
