package com.silverguard.core.device;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceServiceImpl implements DeviceService {

    private final DeviceMapper deviceMapper;

    @Override
    public com.mybatisflex.core.paginate.Page<Device> list(int page, int size, java.util.Map<String, Object> params) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_device");
        wrapper.where("deleted = {0}", false);
        wrapper.orderBy("gmt_create desc");
        if (params != null && params.get("elderId") != null) {
            wrapper.where("elder_id = {0}", params.get("elderId"));
        }
        int realPage = Math.max(page, 1);
        int realSize = Math.min(Math.max(size, 1), 100);
        return deviceMapper.paginate(realPage, realSize, wrapper);
    }

    @Override
    public Device getById(Long id) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_device");
        wrapper.where("id = {0}", id);
        wrapper.where("deleted = {0}", false);
        Device device = deviceMapper.selectOneByQuery(wrapper);
        if (device == null) {
            throw new BusinessException(ResultCode.DEVICE_NOT_FOUND);
        }
        return device;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Device create(Device device) {
        device.setId(null);
        if (device.getStatus() == null) device.setStatus(0);
        if (device.getOfflineCount() == null) device.setOfflineCount(0);
        if (device.getDeleted() == null) device.setDeleted(false);
        device.setGmtCreate(Instant.now());
        device.setGmtModified(Instant.now());
        deviceMapper.insert(device);
        return device;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Device update(Long id, Device device) {
        Device exist = getById(id);
        if (device.getDeviceType() != null) exist.setDeviceType(device.getDeviceType());
        if (device.getVendor() != null) exist.setVendor(device.getVendor());
        if (device.getSn() != null) exist.setSn(device.getSn());
        if (device.getName() != null) exist.setName(device.getName());
        if (device.getLocation() != null) exist.setLocation(device.getLocation());
        if (device.getThresholdJson() != null) exist.setThresholdJson(device.getThresholdJson());
        if (device.getStatus() != null) exist.setStatus(device.getStatus());
        exist.setGmtModified(Instant.now());
        deviceMapper.update(exist);
        return exist;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Device exist = getById(id);
        exist.setDeleted(true);
        exist.setGmtModified(Instant.now());
        deviceMapper.update(exist);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Device assignElder(Long deviceId, Long elderId) {
        Device device = getById(deviceId);
        device.setElderId(elderId);
        device.setGmtModified(Instant.now());
        deviceMapper.update(device);
        return device;
    }

    public Device getBySn(String sn) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_device");
        wrapper.where("sn = {0}", sn);
        wrapper.where("deleted = {0}", false);
        List<Device> list = deviceMapper.selectListByQuery(wrapper);
        return list == null || list.isEmpty() ? null : list.get(0);
    }
}
