package com.silverguard.common.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CursorPageTest {

    @Test
    void of_withCursor_marksHasMoreTrue() {
        CursorPage<String> p = CursorPage.of(List.of("a", "b"), 100L, 2);
        assertEquals(2, p.getSize());
        assertEquals(100L, p.getNextCursor());
        assertTrue(p.isHasMore());
    }

    @Test
    void of_withoutCursor_marksHasMoreFalse() {
        CursorPage<String> p = CursorPage.of(List.of("a"), null, 1);
        assertFalse(p.isHasMore());
        assertNull(p.getNextCursor());
    }

    @Test
    void empty_returnsZeroSize() {
        CursorPage<String> p = CursorPage.empty();
        assertEquals(0, p.getSize());
        assertFalse(p.isHasMore());
        assertTrue(p.getRecords().isEmpty());
    }
}
