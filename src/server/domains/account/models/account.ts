import { Account } from '@bitzonegaming/roleplay-engine-sdk';

export type AccountId = string;

export interface RPAccount extends Account {
  id: AccountId;
}
