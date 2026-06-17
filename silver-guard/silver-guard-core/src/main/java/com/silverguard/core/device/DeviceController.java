package com.silverguard.core.device;

import com.mybatisflex.core.paginate.Page;
import com.silverguard.common.result.ApiResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping
    public ApiResult<Page<Device>> list(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(required = false) Map<String, Object> params) {
        return ApiResult.ok(deviceService.list(page, size, params));
    }

    @GetMapping("/{id}")
    public ApiResult<Device> detail(@PathVariable Long id) {
        return ApiResult.ok(deviceService.getById(id));
    }

    @PostMapping
    public ApiResult<Device> create(@RequestBody @Valid Device device) {
        return ApiResult.ok(deviceService.create(device));
    }

    @PutMapping("/{id}")
    public ApiResult<Device> update(@PathVariable Long id, @RequestBody @Valid Device device) {
        return ApiResult.ok(deviceService.update(id, device));
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> delete(@PathVariable Long id) {
        deviceService.delete(id);
        return ApiResult.ok();
    }

    @PostMapping("/{id}/assign")
    public ApiResult<Device> assignElder(@PathVariable Long id,
                                         @RequestBody @Valid AssignRequest request) {
        return ApiResult.ok(deviceService.assignElder(id, request.getElderId()));
    }

    @Data
    public static class AssignRequest implements Serializable {
        @NotNull
        private Long elderId;
    }
}
