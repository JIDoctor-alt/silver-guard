package com.silverguard.ai;

public interface ElderProfileService {

    ElderProfile getById(Long elderId);

    ElderProfile refresh(Long elderId);
}
