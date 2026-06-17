package com.silverguard.common.context;

/**
 * {@link UserContext} 的线程变量持有者。
 */
public final class UserContextHolder {

    private static final ThreadLocal<UserContext> HOLDER = new ThreadLocal<>();

    private UserContextHolder() {}

    public static void set(UserContext ctx) {
        if (ctx == null) {
            HOLDER.remove();
            return;
        }
        HOLDER.set(ctx);
    }

    public static UserContext get() {
        return HOLDER.get();
    }

    public static Long userId() {
        UserContext ctx = HOLDER.get();
        return ctx == null ? null : ctx.getUserId();
    }

    public static String role() {
        UserContext ctx = HOLDER.get();
        return ctx == null ? null : ctx.getRole();
    }

    public static void clear() {
        HOLDER.remove();
    }
}
