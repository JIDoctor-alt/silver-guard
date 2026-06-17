package com.silverguard.core.elder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElderDTO {

    private Long id;

    private String name;

    private Integer gender;

    private Integer age;

    private Long communityId;

    private Integer riskLevel;

    private List<String> tags;

    private Integer status;

    private String gridUserName;

    private List<String> guardianPhones;
}
