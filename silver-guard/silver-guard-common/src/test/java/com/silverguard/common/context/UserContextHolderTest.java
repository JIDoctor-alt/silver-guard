package com.silverguard.common.context;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserContextHolderTest {

    @AfterEach
    void clean() {
        UserContextHolder.clear();
    }

    @Test
    void userId_whenUnset_returnsNull() {
        assertNull(UserContextHolder.userId());
        assertNull(UserContextHolder.role());
        assertNull(UserContextHolder.get());
    }

    @Test
    void set_andRead_context() {
        UserContext ctx = new UserContext();
        ctx.setUserId(42L);
        ctx.setRole("GRID_MEMBER");
        ctx.setCommunityId(7L);
        UserContextHolder.set(ctx);

        assertEquals(42L, UserContextHolder.userId());
        assertEquals("GRID_MEMBER", UserContextHolder.role());
        assertEquals(7L, UserContextHolder.get().getCommunityId());
    }

    @Test
    void setNull_clearsHolder() {
        UserContext ctx = new UserContext();
        ctx.setUserId(1L);
        UserContextHolder.set(ctx);
        UserContextHolder.set(null);
        assertNull(UserContextHolder.get());
    }

    @Test
    void clear_removesAll() {
        UserContext ctx = new UserContext();
        ctx.setUserId(99L);
        UserContextHolder.set(ctx);
        UserContextHolder.clear();
        assertNull(UserContextHolder.get());
        assertNull(UserContextHolder.userId());
    }
}
