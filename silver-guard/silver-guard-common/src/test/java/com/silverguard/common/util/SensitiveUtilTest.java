package com.silverguard.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SensitiveUtilTest {

    @Test
    void maskPhone_standardLength() {
        assertEquals("138****1234", SensitiveUtil.maskPhone("13800001234"));
    }

    @Test
    void maskPhone_nullOrTooShort_returnsInput() {
        assertNull(SensitiveUtil.maskPhone(null));
        assertEquals("12345", SensitiveUtil.maskPhone("12345"));
    }

    @Test
    void maskName_oneChar_returnsAsterisk() {
        assertEquals("*", SensitiveUtil.maskName("张"));
    }

    @Test
    void maskName_twoChars_keepsHeadAndMasksTail() {
        assertEquals("张*", SensitiveUtil.maskName("张三"));
    }

    @Test
    void maskName_threeChars_keepsHeadAndTail() {
        assertEquals("张*三", SensitiveUtil.maskName("张三三"));
    }

    @Test
    void maskName_longName_keepsHeadAndTail() {
        assertEquals("司********明", SensitiveUtil.maskName("司马相如光明"));
    }

    @Test
    void maskName_nullOrEmpty_returnsInput() {
        assertNull(SensitiveUtil.maskName(null));
        assertEquals("", SensitiveUtil.maskName(""));
    }

    @Test
    void maskAddress_long_returnsHead10PlusAsterisk() {
        assertEquals("北京市朝阳区********", SensitiveUtil.maskAddress("北京市朝阳区某某街道某号院"));
    }

    @Test
    void maskAddress_shortOrNull_returnsInput() {
        assertNull(SensitiveUtil.maskAddress(null));
        assertEquals("short addr", SensitiveUtil.maskAddress("short addr"));
    }
}
