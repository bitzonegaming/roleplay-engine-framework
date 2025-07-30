import { AccountId } from '../../domains/account/models/account';
import { RPServerEvents } from '../../core/events/events';

type MustHaveAccountId<T extends { accountId: AccountId }> = T;

export const RPS2CAccountEventKeys = ['accountUsernameChanged'] as const;

export type RPS2CAccountEventKeys = (typeof RPS2CAccountEventKeys)[number];

export type RPS2CAccountEvents = {
  [K in RPS2CAccountEventKeys]: MustHaveAccountId<RPServerEvents[K]>;
};
