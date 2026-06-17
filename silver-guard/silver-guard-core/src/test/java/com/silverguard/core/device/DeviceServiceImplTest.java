package com.silverguard.core.device;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.exception.BusinessException;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceServiceImplTest {

    @Mock
    private DeviceMapper deviceMapper;

    @InjectMocks
    private DeviceServiceImpl service;

    private Device sample;

    @BeforeEach
    void setUp() {
        sample = Device.builder()
                .id(1L)
                .deviceType("PIR")
                .vendor("HIK")
                .sn("SN-001")
                .name("客厅红外")
                .location("客厅")
                .status(1)
                .offlineCount(0)
                .deleted(false)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
    }

    @Test
    @DisplayName("getById_存在_返回设备")
    void getById_existing() {
        when(deviceMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        Device d = service.getById(1L);
        assertEquals("SN-001", d.getSn());
    }

    @Test
    @DisplayName("getById_不存在_抛DEVICE_NOT_FOUND")
    void getById_missing() {
        when(deviceMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.getById(99L));
        assertEquals(ResultCode.DEVICE_NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("create_设置默认status=0_offlineCount=0_deleted=false")
    void create_defaults() {
        Device d = Device.builder()
                .deviceType("DOOR")
                .sn("SN-002")
                .name("门磁")
                .build();
        org.mockito.Mockito.doAnswer(invocation -> {
            Device e = invocation.getArgument(0);
            e.setId(11L);
            return 1;
        }).when(deviceMapper).insert(any(Device.class));

        Device saved = service.create(d);
        assertEquals(11L, saved.getId());
        assertEquals(0, saved.getStatus());
        assertEquals(0, saved.getOfflineCount());
        assertEquals(false, saved.getDeleted());
        assertNotNull(saved.getGmtCreate());
        assertNotNull(saved.getGmtModified());
    }

    @Test
    @DisplayName("update_部分字段更新")
    void update_partial() {
        when(deviceMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        Device patch = Device.builder()
                .location("厨房")
                .thresholdJson("{\"temp\":80}")
                .build();
        Device updated = service.update(1L, patch);
        assertEquals("厨房", updated.getLocation());
        assertEquals("客厅红外", updated.getName()); // 未变
    }

    @Test
    @DisplayName("delete_软删除")
    void delete_softDelete() {
        when(deviceMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.delete(1L);
        ArgumentCaptor<Device> captor = ArgumentCaptor.forClass(Device.class);
        verify(deviceMapper).update(captor.capture());
        assertEquals(true, captor.getValue().getDeleted());
    }

    @Test
    @DisplayName("assignElder_设置elderId")
    void assignElder() {
        when(deviceMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        Device d = service.assignElder(1L, 99L);
        assertEquals(99L, d.getElderId());
        verify(deviceMapper).update(d);
    }

    @Test
    @DisplayName("getBySn_找到_返回设备")
    void getBySn_found() {
        when(deviceMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(sample));
        Device d = service.getBySn("SN-001");
        assertNotNull(d);
        assertEquals(1L, d.getId());
    }

    @Test
    @DisplayName("getBySn_未找到_返回null")
    void getBySn_notFound() {
        when(deviceMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        assertNull(service.getBySn("NOT-EXIST"));
    }

    @Test
    @DisplayName("list_size>100_被截断到100")
    void list_sizeClamped() {
        com.mybatisflex.core.paginate.Page<Device> page = new com.mybatisflex.core.paginate.Page<>();
        when(deviceMapper.paginate(any(Integer.class), any(Integer.class), any(QueryWrapper.class))).thenReturn(page);
        Map<String, Object> params = new HashMap<>();
        params.put("elderId", 1L);
        service.list(0, 500, params);
        ArgumentCaptor<Integer> sizeCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(deviceMapper).paginate(any(Integer.class), sizeCaptor.capture(), any(QueryWrapper.class));
        assertEquals(100, sizeCaptor.getValue());
    }
}
