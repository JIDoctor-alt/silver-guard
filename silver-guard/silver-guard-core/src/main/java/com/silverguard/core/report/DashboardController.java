package com.silverguard.core.report;

import com.silverguard.common.result.ApiResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResult<DashboardSummary> getSummary(@RequestParam(required = false) Long communityId) {
        return ApiResult.ok(dashboardService.getSummary(communityId));
    }
}
