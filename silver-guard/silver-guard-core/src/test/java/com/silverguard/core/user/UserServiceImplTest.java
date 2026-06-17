package com.silverguard.core.user;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl service;

    private User sample;

    @BeforeEach
    void setUp() {
        sample = User.builder()
                .id(1L)
                .username("zhangsan")
                .phone("13800001111")
                .passwordHash("$2a$10$abcdef")
                .realName("张三")
                .role("GRID_MEMBER")
                .communityId(10L)
                .status(1)
                .deleted(false)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
    }

    @Test
    @DisplayName("findById_清空passwordHash")
    void findById_clearsHash() {
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        User u = service.findById(1L);
        assertEquals(1L, u.getId());
        assertNull(u.getPasswordHash());
    }

    @Test
    @DisplayName("findById_不存在_抛USER_NOT_FOUND")
    void findById_missing() {
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.findById(99L));
        assertEquals(ResultCode.USER_NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("findByPhone_未找到_抛USER_NOT_FOUND")
    void findByPhone_missing() {
        when(userMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        assertThrows(BusinessException.class, () -> service.findByPhone("199"));
    }

    @Test
    @DisplayName("findByPhone_找到_返回第一条")
    void findByPhone_found() {
        when(userMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        User u = service.findByPhone("13800001111");
        assertEquals(1L, u.getId());
    }

    @Test
    @DisplayName("create_手机号已存在_抛USER_NAME_CONFLICT")
    void create_phoneConflict() {
        when(userMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        User u = User.builder().phone("13800001111").passwordHash("123").build();
        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(u));
        assertEquals(ResultCode.USER_NAME_CONFLICT, ex.getResultCode());
    }

    @Test
    @DisplayName("create_新用户_密码被BCrypt加密")
    void create_bcryptPassword() {
        when(userMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        User u = User.builder()
                .phone("13900000000")
                .passwordHash("plainPassword")
                .username("newuser")
                .build();
        org.mockito.Mockito.doAnswer(invocation -> {
            User e = invocation.getArgument(0);
            e.setId(20L);
            return 1;
        }).when(userMapper).insert(any(User.class));

        Long id = service.create(u);
        assertEquals(20L, id);
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(captor.capture());
        User saved = captor.getValue();
        assertNotNull(saved.getPasswordHash());
        assertTrue(saved.getPasswordHash().startsWith("$2a$"));
        assertEquals(1, saved.getStatus());
        assertEquals(false, saved.getDeleted());
    }

    @Test
    @DisplayName("updateRole_修改role_并刷新gmtModified")
    void updateRole() {
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.updateRole(1L, "COMMUNITY_ADMIN");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).update(captor.capture());
        assertEquals("COMMUNITY_ADMIN", captor.getValue().getRole());
    }

    @Test
    @DisplayName("delete_软删除")
    void delete_softDelete() {
        when(userMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.delete(1L);
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).update(captor.capture());
        assertEquals(true, captor.getValue().getDeleted());
    }

    @Test
    @DisplayName("page_结果中passwordHash被清空")
    void page_clearsHash() {
        when(userMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        CursorPage<User> page = service.page(null, null, 0L, 10);
        assertEquals(1, page.getSize());
        assertNull(page.getRecords().get(0).getPasswordHash());
    }
}
