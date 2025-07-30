import { Locale } from '@bitzonegaming/roleplay-engine-sdk';

import { SocketEvent } from './socket-event';

export interface SocketLocaleEnabled extends SocketEvent {
  locale: Locale;
}
