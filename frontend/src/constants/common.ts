export const BROKERS = {
    VANTAGE: 'vantage',
    THE_FUNDED_ROOM: 'the_funded_room',
} as const;

export type BrokerType = typeof BROKERS[keyof typeof BROKERS];

export const ACCOUNT_TYPES = {
    ONE_STEP: '1_STEP',
    TWO_STEP: '2_STEP',
    INSTANT: 'INSTANT',
} as const;

export const ACCOUNT_STATUS = {
    PHASE_1: 'PHASE_1',
    PHASE_2: 'PHASE_2',
    FUNDED: 'FUNDED',
    FAILED: 'FAILED',
} as const;
