package com.silverguard.core.event;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EventStatusMachineTest {

    @Test
    @DisplayName("from_OPEN_can_to_ASSIGNED/CLOSED/FALSE_ALARM")
    void fromOpen() {
        assertTrue(EventStatusMachine.isValid(EventStatusMachine.OPEN, EventStatusMachine.ASSIGNED));
        assertTrue(EventStatusMachine.isValid(EventStatusMachine.OPEN, EventStatusMachine.CLOSED));
        assertTrue(EventStatusMachine.isValid(EventStatusMachine.OPEN, EventStatusMachine.FALSE_ALARM));
    }

    @Test
    @DisplayName("from_ASSIGNED_can_to_CLOSED/FALSE_ALARM_cannot_to_OPEN")
    void fromAssigned() {
        assertTrue(EventStatusMachine.isValid(EventStatusMachine.ASSIGNED, EventStatusMachine.CLOSED));
        assertTrue(EventStatusMachine.isValid(EventStatusMachine.ASSIGNED, EventStatusMachine.FALSE_ALARM));
        assertFalse(EventStatusMachine.isValid(EventStatusMachine.ASSIGNED, EventStatusMachine.OPEN));
    }

    @Test
    @DisplayName("from_CLOSED_to_anything_is_invalid")
    void fromClosed() {
        assertFalse(EventStatusMachine.isValid(EventStatusMachine.CLOSED, EventStatusMachine.OPEN));
        assertFalse(EventStatusMachine.isValid(EventStatusMachine.CLOSED, EventStatusMachine.ASSIGNED));
    }

    @Test
    @DisplayName("from_null_treated_as_OPEN")
    void fromNull() {
        assertTrue(EventStatusMachine.isValid(null, EventStatusMachine.ASSIGNED));
        assertTrue(EventStatusMachine.isValid(null, EventStatusMachine.CLOSED));
    }

    @Test
    @DisplayName("isTerminal_CLOSED_FALSE_ALARM")
    void isTerminal() {
        assertTrue(EventStatusMachine.isTerminal(EventStatusMachine.CLOSED));
        assertTrue(EventStatusMachine.isTerminal(EventStatusMachine.FALSE_ALARM));
        assertFalse(EventStatusMachine.isTerminal(EventStatusMachine.OPEN));
        assertFalse(EventStatusMachine.isTerminal(EventStatusMachine.ASSIGNED));
    }
}
