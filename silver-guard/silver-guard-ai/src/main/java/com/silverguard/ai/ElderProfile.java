package com.silverguard.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElderProfile {

    private Long elderId;
    private Integer riskLevel;
    private Integer age;
    private List<String> tags;
    private Integer recentEventsCount;
    private double avgDailyActivityScore;
}
