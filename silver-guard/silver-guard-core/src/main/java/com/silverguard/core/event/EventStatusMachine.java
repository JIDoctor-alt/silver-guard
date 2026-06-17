package com.silverguard.core.event;

public final class EventStatusMachine {

    public static final String OPEN = "OPEN";
    public static final String ASSIGNED = "ASSIGNED";
    public static final String CLOSED = "CLOSED";
    public static final String FALSE_ALARM = "FALSE_ALARM";

    private EventStatusMachine() {}

    public static boolean isValid(String from, String to) {
        if (to == null) return false;
        if (from == null || from.equals(OPEN)) {
            return to.equals(ASSIGNED) || to.equals(CLOSED) || to.equals(FALSE_ALARM);
        }
        if (from.equals(ASSIGNED)) {
            return to.equals(CLOSED) || to.equals(FALSE_ALARM);
        }
        return false;
    }

    public static boolean isTerminal(String status) {
        return CLOSED.equals(status) || FALSE_ALARM.equals(status);
    }
}
