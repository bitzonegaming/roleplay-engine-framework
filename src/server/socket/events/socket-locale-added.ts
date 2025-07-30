import { Locale } from '@bitzonegaming/roleplay-engine-sdk';

import { SocketEvent } from './socket-event';

export interface SocketLocaleAdded extends SocketEvent {
  locale: Locale;
}
