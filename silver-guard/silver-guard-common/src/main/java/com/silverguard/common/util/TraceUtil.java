package com.silverguard.common.util;

import org.slf4j.MDC;

/**
 * 链路追踪工具。
 *
 * <p>约定每个请求在进入时通过网关生成一个 traceId，写入 Slf4j MDC，
 * 便于在日志、异常信息中追踪。
 */
public final class TraceUtil {

    public static final String TRACE_ID_KEY = "traceId";

    private TraceUtil() {}

    /**
     * 生成并绑定一个新的 traceId。
     */
    public static String newTraceId() {
        String traceId = java.util.UUID.randomUUID().toString().replace("-", "");
        MDC.put(TRACE_ID_KEY, traceId);
        return traceId;
    }

    public static String getTraceId() {
        String id = MDC.get(TRACE_ID_KEY);
        return id == null ? "" : id;
    }

    public static void setTraceId(String traceId) {
        if (traceId == null || traceId.isEmpty()) {
            return;
        }
        MDC.put(TRACE_ID_KEY, traceId);
    }

    public static void clear() {
        MDC.remove(TRACE_ID_KEY);
    }
}
