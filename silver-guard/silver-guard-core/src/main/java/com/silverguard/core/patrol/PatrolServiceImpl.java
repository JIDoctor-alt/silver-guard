package com.silverguard.core.patrol;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PatrolServiceImpl implements PatrolService {

    private final PatrolRecordMapper mapper;

    @Override
    public CursorPage<PatrolRecord> page(Long elderId, Long userId, long cursor, int size) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_patrol_record");
        wrapper.orderBy("gmt_create desc");
        if (elderId != null) wrapper.where("elder_id = {0}", elderId);
        if (userId != null) wrapper.where("user_id = {0}", userId);
        if (cursor > 0) wrapper.where("gmt_create < {0}", Instant.ofEpochMilli(cursor));
        int limit = Math.min(Math.max(size, 1), 100);
        wrapper.limit(limit + 1);
        List<PatrolRecord> records = mapper.selectListByQuery(wrapper);
        boolean hasMore = records.size() > limit;
        List<PatrolRecord> page = hasMore ? records.subList(0, limit) : records;
        Long nextCursor = null;
        if (hasMore && !page.isEmpty()) {
            nextCursor = page.get(page.size() - 1).getGmtCreate().toEpochMilli();
        }
        return CursorPage.of(new ArrayList<>(page), nextCursor, page.size());
    }

    @Override
    public PatrolRecord getById(Long id) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_patrol_record");
        wrapper.where("id = {0}", id);
        PatrolRecord r = mapper.selectOneByQuery(wrapper);
        if (r == null) throw new BusinessException(ResultCode.NOT_FOUND);
        return r;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(PatrolRecord record) {
        record.setId(null);
        if (record.getUserId() == null) record.setUserId(UserContextHolder.userId());
        if (record.getCheckinAt() == null) record.setCheckinAt(Instant.now());
        if (record.getFollowUpFlag() == null) record.setFollowUpFlag(false);
        record.setGmtCreate(Instant.now());
        record.setGmtModified(Instant.now());
        mapper.insert(record);
        return record.getId();
    }
}
