package com.silverguard.core.device;

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
@Table(value = "sg_device")
public class Device {

    @Id(keyType = KeyType.Auto)
    private Long id;

    private Long elderId;

    @NotBlank
    private String deviceType;

    private String vendor;

    @NotBlank
    private String sn;

    @NotBlank
    private String name;

    private String location;

    @NotNull
    @Builder.Default
    private Integer status = 0;

    private String thresholdJson;

    private Instant onlineAt;

    @Builder.Default
    private Integer offlineCount = 0;

    private Instant gmtCreate;

    private Instant gmtModified;

    @Builder.Default
    private Boolean deleted = false;
}
