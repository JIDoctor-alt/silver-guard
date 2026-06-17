package com.silverguard.core.report;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    @Override
    public DashboardSummary getSummary(Long communityId) {
        if (communityId == null) {
            communityId = 0L;
        }
        log.info("[dashboard] 加载社区 {} 驾驶舱数据", communityId);
        return DashboardSummary.builder()
                .communityId(communityId)
                .totalElders(0)
                .totalDevices(0)
                .onlineDevices(0)
                .todayEvents(0)
                .todayL3Events(0)
                .todayL4Events(0)
                .avgResponseSeconds(0)
                .falsePositiveRate(BigDecimal.ZERO)
                .build();
    }
}
