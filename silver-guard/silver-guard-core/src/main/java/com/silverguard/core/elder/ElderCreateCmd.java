package com.silverguard.core.elder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ElderCreateCmd {

    @NotBlank(message = "姓名不能为空")
    @Size(max = 64, message = "姓名最多64个字符")
    private String name;

    @NotBlank(message = "身份证号不能为空")
    @Size(max = 32, message = "身份证号最多32个字符")
    private String idCard;

    private Integer gender;

    private LocalDate birthDate;

    @Size(max = 32)
    private String phone;

    @NotNull(message = "所属社区不能为空")
    private Long communityId;

    @Size(max = 255)
    private String address;

    private Integer riskLevel;

    private List<String> tags;

    private Long gridUserId;

    private Long guardianUserId;

    private Boolean consentSigned;
}
