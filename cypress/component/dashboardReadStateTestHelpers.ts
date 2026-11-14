import {
    createEventFilterGroup,
    createEventFilterRule,
    EventFilterField,
    EventFilterGroup,
    EventFilterOperator,
} from "../../src/lib/data/oscar/EventFilter";

export {
    buildDashboardAlarmReadStateUrl,
    getDashboardAlarmReadKeys,
    hasRowContentFilter,
    inspectPostWatermarkReadKeys,
    isDashboardAlarmRead,
    MAX_UNREAD_RECONCILIATION_FETCH,
    parseDashboardReadStatePayload,
    UNREAD_COUNT_RECONCILIATION_CAP,
    useDashboardAlarmReadState,
} from "../../src/lib/data/oscar/DashboardAlarmReadState";
export type {DashboardReadStateFetch} from "../../src/lib/data/oscar/DashboardAlarmReadState";

export function createEventFilterWithRuleForTest(
    field: EventFilterField,
    operator: EventFilterOperator,
    value: string | string[],
): EventFilterGroup {
    const group = createEventFilterGroup("and");
    group.children.push({
        ...createEventFilterRule(field),
        operator,
        value,
    });
    return group;
}
