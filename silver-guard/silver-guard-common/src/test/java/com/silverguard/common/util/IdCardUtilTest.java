package com.silverguard.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class IdCardUtilTest {

    @Test
    void hash_sameInput_returnsSameHash() {
        String a = IdCardUtil.hash("110101199001011234");
        String b = IdCardUtil.hash("110101199001011234");
        assertNotNull(a);
        assertEquals(a, b);
    }

    @Test
    void hash_differentInput_returnsDifferentHash() {
        String a = IdCardUtil.hash("110101199001011234");
        String b = IdCardUtil.hash("110101199001011235");
        assertNotEquals(a, b);
    }

    @Test
    void hash_saltApplied_keepsHashStableAcrossRuns() {
        // 静态盐：相同明文多次调用结果一致
        String a = IdCardUtil.hash("X");
        String b = IdCardUtil.hash("X");
        assertEquals(a, b);
    }

    @Test
    void hash_nullOrBlank_returnsNull() {
        assertNull(IdCardUtil.hash(null));
        assertNull(IdCardUtil.hash(""));
        assertNull(IdCardUtil.hash("   "));
    }

    @Test
    void mask_normal_returnsHead4AsteriskTail4() {
        assertEquals("1101****1234", IdCardUtil.mask("110101199001011234"));
    }

    @Test
    void mask_shortInput_returnsAsterisk() {
        assertEquals("****", IdCardUtil.mask("12345678"));
    }

    @Test
    void mask_null_returnsNull() {
        assertNull(IdCardUtil.mask(null));
    }
}
