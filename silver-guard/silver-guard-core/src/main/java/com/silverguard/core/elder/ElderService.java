package com.silverguard.core.elder;

import com.silverguard.common.model.CursorPage;

public interface ElderService {

    CursorPage<ElderDTO> page(Long communityId, Integer riskLevel, long cursor, int size);

    ElderDTO getById(Long id);

    Elder getEntityById(Long id);

    Long create(ElderCreateCmd cmd);

    void update(Long id, ElderCreateCmd cmd);

    void delete(Long id);

    void bindFamily(Long elderId, Long guardianUserId);

    java.util.List<Elder> listByCommunity(Long communityId);
}
