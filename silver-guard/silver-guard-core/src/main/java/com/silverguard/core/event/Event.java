package com.silverguard.core.event;

import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Table(value = "sg_event")
public class Event {

    @Id(keyType = KeyType.Auto)
    private Long id;

    private Long elderId;

    private Long deviceId;

    private String eventType;

    private Integer eventLevel;

    private Double confidence;

    private String source;

    private String evidenceJson;

    private String aiModelVersion;

    private String aiExplanation;

    private Long aiJudgeMs;

    private Instant firstReportAt;

    private Long assignedUserId;

    private String status;

    private Integer escalationLevel;

    private Long closedBy;

    private Instant closedAt;

    private String closeReason;

    private Long communityId;

    private Instant gmtCreate;

    private Instant gmtModified;
}
