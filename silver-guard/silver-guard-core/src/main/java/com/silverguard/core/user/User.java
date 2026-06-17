package com.silverguard.core.user;

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
@Table(value = "sg_user")
public class User {

    @Id(keyType = KeyType.Auto)
    private Long id;

    private String username;

    private String phone;

    private String passwordHash;

    private String realName;

    private String role;

    private Long communityId;

    private Integer gender;

    private Integer status;

    private Instant lastLoginAt;

    private Instant gmtCreate;

    private Instant gmtModified;

    private Boolean deleted;
}
