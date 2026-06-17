package com.silverguard.core.notify;

import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Table(value = "sg_notification")
public class Notification {

    @Id(keyType = KeyType.Auto)
    private Long id;

    @NotNull
    private Long eventId;

    @NotBlank
    private String channel;

    @NotNull
    private Long receiverId;

    private String receiverType;

    private Instant sentAt;

    private Instant readAt;

    private String ackStatus;

    private String failReason;

    @Builder.Default
    private Integer retryCount = 0;

    private String payloadJson;

    private Instant gmtCreate;

    private Instant gmtModified;
}
