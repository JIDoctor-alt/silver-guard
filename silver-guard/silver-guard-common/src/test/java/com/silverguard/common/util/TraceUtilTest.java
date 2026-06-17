package com.silverguard.common.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TraceUtilTest {

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void newTraceId_putsValueIntoMdcAndReturnsIt() {
        String id = TraceUtil.newTraceId();
        assertNotNull(id);
        assertEquals(32, id.length());
        assertEquals(id, TraceUtil.getTraceId());
        assertEquals(id, MDC.get(TraceUtil.TRACE_ID_KEY));
    }

    @Test
    void getTraceId_returnsEmptyWhenMdcEmpty() {
        assertEquals("", TraceUtil.getTraceId());
    }

    @Test
    void setTraceId_acceptsValidValue() {
        TraceUtil.setTraceId("abc-123");
        assertEquals("abc-123", TraceUtil.getTraceId());
    }

    @Test
    void setTraceId_ignoresNullOrEmpty() {
        TraceUtil.setTraceId("first");
        TraceUtil.setTraceId(null);
        assertEquals("first", TraceUtil.getTraceId());
        TraceUtil.setTraceId("");
        assertEquals("first", TraceUtil.getTraceId());
    }

    @Test
    void clear_removesMdcKey() {
        TraceUtil.newTraceId();
        TraceUtil.clear();
        assertNull(MDC.get(TraceUtil.TRACE_ID_KEY));
        assertTrue(TraceUtil.getTraceId().isEmpty());
    }
}
