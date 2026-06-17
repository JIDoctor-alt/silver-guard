package com.silverguard.core.patrol;

import com.silverguard.common.model.CursorPage;

public interface PatrolService {

    CursorPage<PatrolRecord> page(Long elderId, Long userId, long cursor, int size);

    PatrolRecord getById(Long id);

    Long create(PatrolRecord record);
}
