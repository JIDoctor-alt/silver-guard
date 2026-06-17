package com.silverguard.core.device;

import com.mybatisflex.core.paginate.Page;

import java.util.Map;

public interface DeviceService {

    Page<Device> list(int page, int size, Map<String, Object> params);

    Device getById(Long id);

    Device create(Device device);

    Device update(Long id, Device device);

    void delete(Long id);

    Device assignElder(Long deviceId, Long elderId);
}
