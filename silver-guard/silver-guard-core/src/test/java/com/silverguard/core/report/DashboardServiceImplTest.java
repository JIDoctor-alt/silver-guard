package com.silverguard.core.report;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class DashboardServiceImplTest {

    private final DashboardServiceImpl service = new DashboardServiceImpl();

    @Test
    @DisplayName("getSummary_无communityId_默认填0")
    void getSummary_nullCommunityDefaultsToZero() {
        DashboardSummary summary = service.getSummary(null);
        assertNotNull(summary);
        assertEquals(0L, summary.getCommunityId());
        assertEquals(0, summary.getTotalElders());
        assertEquals(0, summary.getTodayEvents());
        assertEquals(BigDecimal.ZERO, summary.getFalsePositiveRate());
    }

    @Test
    @DisplayName("getSummary_指定communityId_正常返回")
    void getSummary_withCommunity() {
        DashboardSummary summary = service.getSummary(123L);
        assertEquals(123L, summary.getCommunityId());
        assertEquals(0, summary.getTotalDevices());
        assertEquals(0, summary.getAvgResponseSeconds());
    }
}
