package com.silverguard.core.user;

import com.silverguard.common.model.CursorPage;

public interface UserService {

    CursorPage<User> page(String role, Long communityId, long cursor, int size);

    User findById(Long id);

    User findByPhone(String phone);

    Long create(User user);

    void updateRole(Long id, String role);

    void delete(Long id);
}
