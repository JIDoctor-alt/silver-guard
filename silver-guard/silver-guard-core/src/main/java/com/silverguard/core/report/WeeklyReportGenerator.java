package com.silverguard.core.report;

import com.silverguard.common.util.TraceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklyReportGenerator {

    public String generate(Long communityId, LocalDate startDate, LocalDate endDate) {
        log.info("[weekly-report] 生成周报 communityId={} start={} end={} traceId={}",
                communityId, startDate, endDate, TraceUtil.getTraceId());
        StringBuilder sb = new StringBuilder();
        sb.append("社区周报\n");
        sb.append("社区ID: ").append(communityId).append("\n");
        sb.append("周期: ").append(startDate).append(" ~ ").append(endDate).append("\n");
        sb.append("(本报告为占位内容，后续接入 LLM 生成总结)\n");
        return sb.toString();
    }

    public String generateWithLLM(Long communityId, LocalDate startDate, LocalDate endDate, String rawSummary) {
        log.info("[weekly-report] LLM 总结 communityId={} start={} end={} traceId={}",
                communityId, startDate, endDate, TraceUtil.getTraceId());
        StringBuilder sb = new StringBuilder();
        sb.append("【LLM 总结】社区 ").append(communityId).append(" 周报\n");
        sb.append("周期: ").append(startDate).append(" ~ ").append(endDate).append("\n");
        sb.append(rawSummary == null ? "" : rawSummary).append("\n");
        sb.append("(本报告为占位内容，后续接入真实 LLM 接口)\n");
        return sb.toString();
    }
}
