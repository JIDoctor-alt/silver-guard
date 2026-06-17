package com.silverguard.core.elder;

import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Table(value = "sg_elder")
public class Elder {

    @Id(keyType = KeyType.Auto)
    private Long id;

    private String name;

    private String idCardHash;

    private Integer gender;

    private LocalDate birthDate;

    private String phone;

    private Long communityId;

    private String address;

    private Integer riskLevel;

    private String tags;

    private Integer status;

    private Long guardianUserId;

    private Long gridUserId;

    private Boolean consentSigned;

    private Instant consentSignedAt;

    private Instant gmtCreate;

    private Instant gmtModified;

    private Boolean deleted;
}
