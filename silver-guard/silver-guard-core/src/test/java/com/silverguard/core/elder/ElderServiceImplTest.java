package com.silverguard.core.elder;

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
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElderServiceImplTest {

    @Mock
    private ElderMapper elderMapper;

    @InjectMocks
    private ElderServiceImpl service;

    private Elder sample;

    @BeforeEach
    void setUp() {
        sample = Elder.builder()
                .id(1L)
                .name("张三")
                .idCardHash("hash-1")
                .gender(1)
                .birthDate(LocalDate.of(1940, 1, 1))
                .phone("13800000001")
                .communityId(10L)
                .address("北京市朝阳区")
                .riskLevel(2)
                .tags("lonely,high-risk")
                .status(1)
                .deleted(false)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
    }

    @Test
    @DisplayName("getEntityById_存在_返回档案")
    void getEntityById_existing() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        Elder elder = service.getEntityById(1L);
        assertEquals(1L, elder.getId());
        assertEquals("张三", elder.getName());
    }

    @Test
    @DisplayName("getEntityById_不存在_抛ELDER_NOT_FOUND")
    void getEntityById_missing() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.getEntityById(99L));
        assertEquals(ResultCode.ELDER_NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("getById_返回DTO_年龄由出生日计算")
    void getById_returnsDtoWithAge() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        ElderDTO dto = service.getById(1L);
        assertNotNull(dto);
        assertEquals("张三", dto.getName());
        assertNotNull(dto.getAge());
        // 出生年 1940，到 2026 应 >= 80
        assertTrue(dto.getAge() >= 80);
        assertEquals(2, dto.getRiskLevel());
    }

    @Test
    @DisplayName("page_未达上限_无nextCursor")
    void page_noMore() {
        when(elderMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        CursorPage<ElderDTO> page = service.page(10L, null, 0L, 10);
        assertEquals(1, page.getSize());
        assertNull(page.getNextCursor());
        assertEquals(false, page.isHasMore());
    }

    @Test
    @DisplayName("page_超过limit_返回nextCursor")
    void page_hasMore() {
        Elder a = sample.toBuilder().id(1L).gmtCreate(Instant.ofEpochMilli(2_000_000L)).build();
        Elder b = sample.toBuilder().id(2L).gmtCreate(Instant.ofEpochMilli(1_000_000L)).build();
        when(elderMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(a, b));
        CursorPage<ElderDTO> page = service.page(null, null, 0L, 1);
        assertEquals(1, page.getSize());
        assertTrue(page.isHasMore());
        assertEquals(2_000_000L, page.getNextCursor());
    }

    @Test
    @DisplayName("create_身份证已存在_抛ELDER_ALREADY_EXISTS")
    void create_duplicateIdCard() {
        when(elderMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        ElderCreateCmd cmd = new ElderCreateCmd();
        cmd.setName("李四");
        cmd.setIdCard("110101199001011234");
        cmd.setCommunityId(10L);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(cmd));
        assertEquals(ResultCode.ELDER_ALREADY_EXISTS, ex.getResultCode());
        verify(elderMapper, never()).insert(any());
    }

    @Test
    @DisplayName("create_默认riskLevel=1_默认consentSigned=false")
    void create_defaults() {
        when(elderMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        ElderCreateCmd cmd = new ElderCreateCmd();
        cmd.setName("王五");
        cmd.setIdCard("110101199001011235");
        cmd.setCommunityId(10L);
        cmd.setGender(1);
        cmd.setBirthDate(LocalDate.of(1950, 5, 5));
        // 反射模拟 insert 后回填 id
        org.mockito.Mockito.doAnswer(invocation -> {
            Elder e = invocation.getArgument(0);
            e.setId(123L);
            return 1;
        }).when(elderMapper).insert(any(Elder.class));

        Long id = service.create(cmd);
        assertEquals(123L, id);
        ArgumentCaptor<Elder> captor = ArgumentCaptor.forClass(Elder.class);
        verify(elderMapper, times(1)).insert(captor.capture());
        Elder saved = captor.getValue();
        assertEquals(1, saved.getRiskLevel());
        assertEquals(false, saved.getConsentSigned());
        assertEquals(false, saved.getDeleted());
        assertNotNull(saved.getGmtCreate());
        assertNotNull(saved.getGmtModified());
    }

    @Test
    @DisplayName("create_tags逗号拼接_consentSigned为true时记录时间")
    void create_tagsAndConsent() {
        when(elderMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        ElderCreateCmd cmd = new ElderCreateCmd();
        cmd.setName("赵六");
        cmd.setIdCard("110101199001011236");
        cmd.setCommunityId(10L);
        cmd.setTags(List.of("lonely", "high-risk"));
        cmd.setConsentSigned(true);
        org.mockito.Mockito.doAnswer(invocation -> {
            Elder e = invocation.getArgument(0);
            e.setId(7L);
            return 1;
        }).when(elderMapper).insert(any(Elder.class));

        service.create(cmd);
        ArgumentCaptor<Elder> captor = ArgumentCaptor.forClass(Elder.class);
        verify(elderMapper).insert(captor.capture());
        Elder saved = captor.getValue();
        assertEquals("lonely,high-risk", saved.getTags());
        assertEquals(true, saved.getConsentSigned());
        assertNotNull(saved.getConsentSignedAt());
    }

    @Test
    @DisplayName("update_部分字段更新_保留未设置字段")
    void update_partialFields() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        ElderCreateCmd cmd = new ElderCreateCmd();
        cmd.setPhone("13900000000");
        cmd.setRiskLevel(3);
        service.update(1L, cmd);
        ArgumentCaptor<Elder> captor = ArgumentCaptor.forClass(Elder.class);
        verify(elderMapper).update(captor.capture());
        Elder updated = captor.getValue();
        assertEquals("13900000000", updated.getPhone());
        assertEquals(3, updated.getRiskLevel());
        assertEquals("张三", updated.getName()); // 未变
    }

    @Test
    @DisplayName("delete_软删除_deleted=true")
    void delete_softDelete() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.delete(1L);
        ArgumentCaptor<Elder> captor = ArgumentCaptor.forClass(Elder.class);
        verify(elderMapper).update(captor.capture());
        assertEquals(true, captor.getValue().getDeleted());
    }

    @Test
    @DisplayName("bindFamily_设置guardianUserId")
    void bindFamily_setsGuardian() {
        when(elderMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.bindFamily(1L, 88L);
        ArgumentCaptor<Elder> captor = ArgumentCaptor.forClass(Elder.class);
        verify(elderMapper).update(captor.capture());
        assertEquals(88L, captor.getValue().getGuardianUserId());
    }

    @Test
    @DisplayName("listByCommunity_communityId为空_返回空列表")
    void listByCommunity_null() {
        List<Elder> result = service.listByCommunity(null);
        assertTrue(result.isEmpty());
        verify(elderMapper, never()).selectListByQuery(any(QueryWrapper.class));
    }
}
