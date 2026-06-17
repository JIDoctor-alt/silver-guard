package com.silverguard.core.report;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummary {

    @NotNull
    private Long communityId;

    @Builder.Default
    private Integer totalElders = 0;

    @Builder.Default
    private Integer totalDevices = 0;

    @Builder.Default
    private Integer onlineDevices = 0;

    @Builder.Default
    private Integer todayEvents = 0;

    @Builder.Default
    private Integer todayL3Events = 0;

    @Builder.Default
    private Integer todayL4Events = 0;

    @Builder.Default
    private Integer avgResponseSeconds = 0;

    @Builder.Default
    private BigDecimal falsePositiveRate = BigDecimal.ZERO;
}
