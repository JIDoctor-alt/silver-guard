package com.silverguard.core.patrol;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContext;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import org.junit.jupiter.api.AfterEach;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatrolServiceImplTest {

    @Mock
    private PatrolRecordMapper mapper;

    @InjectMocks
    private PatrolServiceImpl service;

    private PatrolRecord sample;

    @BeforeEach
    void setUp() {
        sample = PatrolRecord.builder()
                .id(1L)
                .elderId(11L)
                .userId(22L)
                .taskType("DOOR_CHECK")
                .checkinAt(Instant.now())
                .elderStatus("NORMAL")
                .remark("老人状态良好")
                .followUpFlag(false)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
    }

    @AfterEach
    void clean() {
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("getById_存在_返回记录")
    void getById_existing() {
        when(mapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        PatrolRecord r = service.getById(1L);
        assertEquals(1L, r.getId());
    }

    @Test
    @DisplayName("getById_不存在_抛NOT_FOUND")
    void getById_missing() {
        when(mapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.getById(99L));
        assertEquals(ResultCode.NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("create_无userId_从上下文取")
    void create_fromContext() {
        UserContext ctx = new UserContext();
        ctx.setUserId(123L);
        UserContextHolder.set(ctx);

        PatrolRecord r = new PatrolRecord();
        r.setElderId(11L);
        r.setTaskType("VISIT");
        org.mockito.Mockito.doAnswer(invocation -> {
            PatrolRecord arg = invocation.getArgument(0);
            arg.setId(7L);
            return 1;
        }).when(mapper).insert(any(PatrolRecord.class));

        Long id = service.create(r);
        assertEquals(7L, id);
        ArgumentCaptor<PatrolRecord> captor = ArgumentCaptor.forClass(PatrolRecord.class);
        verify(mapper).insert(captor.capture());
        PatrolRecord saved = captor.getValue();
        assertEquals(123L, saved.getUserId());
        assertNotNull(saved.getCheckinAt());
        assertEquals(false, saved.getFollowUpFlag());
        assertNotNull(saved.getGmtCreate());
    }

    @Test
    @DisplayName("create_显式userId优先")
    void create_explicitUser() {
        PatrolRecord r = PatrolRecord.builder()
                .elderId(11L)
                .userId(777L)
                .taskType("CALL")
                .build();
        org.mockito.Mockito.doAnswer(invocation -> {
            PatrolRecord arg = invocation.getArgument(0);
            arg.setId(8L);
            return 1;
        }).when(mapper).insert(any(PatrolRecord.class));

        service.create(r);
        ArgumentCaptor<PatrolRecord> captor = ArgumentCaptor.forClass(PatrolRecord.class);
        verify(mapper).insert(captor.capture());
        assertEquals(777L, captor.getValue().getUserId());
    }

    @Test
    @DisplayName("page_有more_nextCursor非空")
    void page_hasMore() {
        PatrolRecord a = sample.toBuilder().id(1L).gmtCreate(Instant.ofEpochMilli(3_000_000L)).build();
        PatrolRecord b = sample.toBuilder().id(2L).gmtCreate(Instant.ofEpochMilli(1_000_000L)).build();
        when(mapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(a, b));
        CursorPage<PatrolRecord> page = service.page(11L, null, 0L, 1);
        assertEquals(1, page.getSize());
        assertEquals(3_000_000L, page.getNextCursor());
    }

    @Test
    @DisplayName("page_无more_nextCursor为null")
    void page_noMore() {
        when(mapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        CursorPage<PatrolRecord> page = service.page(null, null, 0L, 10);
        assertFalse(page.isHasMore());
    }
}
