package com.silverguard.core.elder;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import com.silverguard.common.util.IdCardUtil;
import com.silverguard.common.util.TraceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElderServiceImpl implements ElderService {

    private final ElderMapper elderMapper;

    @Override
    public CursorPage<ElderDTO> page(Long communityId, Integer riskLevel, long cursor, int size) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_elder");
        wrapper.where("deleted = {0}", false);
        wrapper.orderBy("gmt_create desc");
        if (communityId != null) {
            wrapper.where("community_id = {0}", communityId);
        }
        if (riskLevel != null) {
            wrapper.where("risk_level = {0}", riskLevel);
        }
        if (cursor > 0) {
            wrapper.where("gmt_create < {0}", Instant.ofEpochMilli(cursor));
        }
        int limit = Math.min(Math.max(size, 1), 100);
        wrapper.limit(limit + 1);
        List<Elder> elders = elderMapper.selectListByQuery(wrapper);
        boolean hasMore = elders.size() > limit;
        List<Elder> records = hasMore ? elders.subList(0, limit) : elders;
        List<ElderDTO> dtos = new ArrayList<>();
        for (Elder e : records) {
            dtos.add(toDTO(e));
        }
        Long nextCursor = null;
        if (hasMore && !dtos.isEmpty()) {
            nextCursor = records.get(records.size() - 1).getGmtCreate().toEpochMilli();
        }
        return CursorPage.of(dtos, nextCursor, dtos.size());
    }

    @Override
    public ElderDTO getById(Long id) {
        Elder elder = getEntityById(id);
        return toDTO(elder);
    }

    @Override
    public Elder getEntityById(Long id) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_elder");
        wrapper.where("id = {0}", id);
        wrapper.where("deleted = {0}", false);
        Elder elder = elderMapper.selectOneByQuery(wrapper);
        if (elder == null) {
            throw new BusinessException(ResultCode.ELDER_NOT_FOUND);
        }
        return elder;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(ElderCreateCmd cmd) {
        String hash = IdCardUtil.hash(cmd.getIdCard());
        QueryWrapper check = QueryWrapper.create();
        check.from("sg_elder");
        check.where("id_card_hash = {0}", hash);
        check.where("deleted = {0}", false);
        List<Elder> exists = elderMapper.selectListByQuery(check);
        if (exists != null && !exists.isEmpty()) {
            throw new BusinessException(ResultCode.ELDER_ALREADY_EXISTS);
        }
        Elder elder = Elder.builder()
                .name(cmd.getName())
                .idCardHash(hash)
                .gender(cmd.getGender())
                .birthDate(cmd.getBirthDate())
                .phone(cmd.getPhone())
                .communityId(cmd.getCommunityId())
                .address(cmd.getAddress())
                .riskLevel(cmd.getRiskLevel() == null ? 1 : cmd.getRiskLevel())
                .tags(cmd.getTags() != null && !cmd.getTags().isEmpty() ? String.join(",", cmd.getTags()) : null)
                .status(1)
                .gridUserId(cmd.getGridUserId())
                .guardianUserId(cmd.getGuardianUserId())
                .consentSigned(cmd.getConsentSigned() == null ? false : cmd.getConsentSigned())
                .consentSignedAt(cmd.getConsentSigned() != null && cmd.getConsentSigned() ? Instant.now() : null)
                .deleted(false)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
        elderMapper.insert(elder);
        log.info("[elder.create] userId={} elderId={} traceId={}",
                UserContextHolder.userId(), elder.getId(), TraceUtil.getTraceId());
        return elder.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, ElderCreateCmd cmd) {
        Elder elder = getEntityById(id);
        if (cmd.getName() != null) elder.setName(cmd.getName());
        if (cmd.getGender() != null) elder.setGender(cmd.getGender());
        if (cmd.getBirthDate() != null) elder.setBirthDate(cmd.getBirthDate());
        if (cmd.getPhone() != null) elder.setPhone(cmd.getPhone());
        if (cmd.getCommunityId() != null) elder.setCommunityId(cmd.getCommunityId());
        if (cmd.getAddress() != null) elder.setAddress(cmd.getAddress());
        if (cmd.getRiskLevel() != null) elder.setRiskLevel(cmd.getRiskLevel());
        if (cmd.getTags() != null) elder.setTags(cmd.getTags().isEmpty() ? null : String.join(",", cmd.getTags()));
        if (cmd.getGridUserId() != null) elder.setGridUserId(cmd.getGridUserId());
        if (cmd.getGuardianUserId() != null) elder.setGuardianUserId(cmd.getGuardianUserId());
        if (cmd.getConsentSigned() != null) {
            elder.setConsentSigned(cmd.getConsentSigned());
            if (cmd.getConsentSigned()) elder.setConsentSignedAt(Instant.now());
        }
        elder.setGmtModified(Instant.now());
        elderMapper.update(elder);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Elder elder = getEntityById(id);
        elder.setDeleted(true);
        elder.setGmtModified(Instant.now());
        elderMapper.update(elder);
    }

    @Override
    public void bindFamily(Long elderId, Long guardianUserId) {
        Elder elder = getEntityById(elderId);
        elder.setGuardianUserId(guardianUserId);
        elder.setGmtModified(Instant.now());
        elderMapper.update(elder);
    }

    @Override
    public List<Elder> listByCommunity(Long communityId) {
        if (communityId == null) {
            return Collections.emptyList();
        }
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_elder");
        wrapper.where("community_id = {0}", communityId);
        wrapper.where("deleted = {0}", false);
        return elderMapper.selectListByQuery(wrapper);
    }

    private ElderDTO toDTO(Elder e) {
        ElderDTO dto = new ElderDTO();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setGender(e.getGender());
        if (e.getBirthDate() != null) {
            dto.setAge(Period.between(e.getBirthDate(), LocalDate.now()).getYears());
        }
        dto.setCommunityId(e.getCommunityId());
        dto.setRiskLevel(e.getRiskLevel());
        if (e.getTags() != null && !e.getTags().isBlank()) {
            dto.setTags(List.of(e.getTags().split(",")));
        }
        dto.setStatus(e.getStatus());
        return dto;
    }
}
