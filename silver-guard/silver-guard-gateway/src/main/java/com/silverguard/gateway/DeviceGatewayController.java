package com.silverguard.gateway;

import com.silverguard.ai.AiJudgeService;
import com.silverguard.ai.EventJudgeResult;
import com.silverguard.ai.SenseInput;
import com.silverguard.common.annotation.AgentExecution;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ApiResult;
import com.silverguard.common.result.ResultCode;
import com.silverguard.core.device.Device;
import com.silverguard.core.device.DeviceServiceImpl;
import com.silverguard.core.event.Event;
import com.silverguard.core.event.EventServiceImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/devices")
public class DeviceGatewayController {

    private final DeviceSignatureValidator signatureValidator;
    private final DeviceServiceImpl deviceService;
    private final AiJudgeService aiJudgeService;
    private final EventServiceImpl eventService;

    @PostMapping("/report")
    @AgentExecution(node = "sense", logInput = true)
    public ApiResult<Long> report(@RequestBody DeviceReportRequest req) {
        Device device = deviceService.getBySn(req.getDeviceSn());
        if (device == null) {
            throw new BusinessException(ResultCode.DEVICE_NOT_FOUND);
        }
        if (!signatureValidator.validate(req.getDeviceSn(), req.getPayload(), req.getSignature())) {
            throw new BusinessException(ResultCode.DEVICE_SIGNATURE_INVALID);
        }
        SenseInput input = new SenseInput();
        input.setElderId(device.getElderId());
        input.setDeviceType(device.getDeviceType());
        input.setEventType(req.getEventType());
        input.setSignalJson(req.getPayload());
        input.setConfidence(0.85);
        EventJudgeResult judge = aiJudgeService.judge(input);
        Event event = Event.builder()
                .elderId(device.getElderId())
                .deviceId(device.getId())
                .eventType(req.getEventType())
                .eventLevel(judge.getEventLevel())
                .confidence(judge.getConfidence())
                .source("gateway-rest")
                .evidenceJson(req.getPayload())
                .aiModelVersion(judge.getAiModelVersion())
                .aiExplanation(judge.getAiExplanation())
                .aiJudgeMs(judge.getJudgeLatencyMs())
                .status("OPEN")
                .build();
        Long eventId = eventService.create(event);
        log.info("[device.report] sn={} eventId={} level={}",
                req.getDeviceSn(), eventId, judge.getEventLevel());
        return ApiResult.ok(eventId);
    }

    @Data
    public static class DeviceReportRequest implements Serializable {
        private String deviceSn;
        private String eventType;
        private String payload;
        private String signature;
    }
}
