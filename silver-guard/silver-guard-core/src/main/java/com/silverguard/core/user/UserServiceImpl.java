package com.silverguard.core.user;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;

    @Override
    public CursorPage<User> page(String role, Long communityId, long cursor, int size) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_user");
        wrapper.where("deleted = {0}", false);
        wrapper.orderBy("gmt_create desc");
        if (role != null && !role.isBlank()) wrapper.where("role = {0}", role);
        if (communityId != null) wrapper.where("community_id = {0}", communityId);
        if (cursor > 0) wrapper.where("gmt_create < {0}", Instant.ofEpochMilli(cursor));
        int limit = Math.min(Math.max(size, 1), 100);
        wrapper.limit(limit + 1);
        List<User> users = userMapper.selectListByQuery(wrapper);
        boolean hasMore = users.size() > limit;
        List<User> page = hasMore ? users.subList(0, limit) : users;
        List<User> out = new ArrayList<>(page);
        for (User u : out) u.setPasswordHash(null);
        Long nextCursor = null;
        if (hasMore && !out.isEmpty()) {
            nextCursor = out.get(out.size() - 1).getGmtCreate().toEpochMilli();
        }
        return CursorPage.of(out, nextCursor, out.size());
    }

    @Override
    public User findById(Long id) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_user");
        wrapper.where("id = {0}", id);
        wrapper.where("deleted = {0}", false);
        User u = userMapper.selectOneByQuery(wrapper);
        if (u == null) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        u.setPasswordHash(null);
        return u;
    }

    @Override
    public User findByPhone(String phone) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_user");
        wrapper.where("phone = {0}", phone);
        wrapper.where("deleted = {0}", false);
        List<User> list = userMapper.selectListByQuery(wrapper);
        if (list == null || list.isEmpty()) throw new BusinessException(ResultCode.USER_NOT_FOUND);
        return list.get(0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(User user) {
        if (user.getPhone() != null) {
            QueryWrapper check = QueryWrapper.create();
            check.from("sg_user");
            check.where("phone = {0}", user.getPhone());
            check.where("deleted = {0}", false);
            List<User> exists = userMapper.selectListByQuery(check);
            if (exists != null && !exists.isEmpty()) {
                throw new BusinessException(ResultCode.USER_NAME_CONFLICT);
            }
        }
        user.setId(null);
        if (user.getPasswordHash() != null) {
            user.setPasswordHash(BCrypt.hashpw(user.getPasswordHash(), BCrypt.gensalt()));
        }
        if (user.getStatus() == null) user.setStatus(1);
        if (user.getDeleted() == null) user.setDeleted(false);
        user.setGmtCreate(Instant.now());
        user.setGmtModified(Instant.now());
        userMapper.insert(user);
        return user.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRole(Long id, String role) {
        User user = findById(id);
        user.setRole(role);
        user.setGmtModified(Instant.now());
        userMapper.update(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        User user = findById(id);
        user.setDeleted(true);
        user.setGmtModified(Instant.now());
        userMapper.update(user);
    }

    @Transactional(rollbackFor = Exception.class)
    public void touchLogin(Long id) {
        User user = findById(id);
        user.setLastLoginAt(Instant.now());
        userMapper.update(user);
    }
}
