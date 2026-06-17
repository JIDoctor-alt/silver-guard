package com.silverguard.core.patrol;

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
@Table(value = "sg_patrol_record")
public class PatrolRecord {

    @Id(keyType = KeyType.Auto)
    private Long id;

    private Long elderId;

    private Long userId;

    private String taskType;

    private Instant checkinAt;

    private String elderStatus;

    private String remark;

    private String photos;

    private Boolean followUpFlag;

    private Instant gmtCreate;

    private Instant gmtModified;
}
