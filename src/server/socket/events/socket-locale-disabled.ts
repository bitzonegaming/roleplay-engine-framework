import { Locale } from '@bitzonegaming/roleplay-engine-sdk';

import { SocketEvent } from './socket-event';

export interface SocketLocaleDisabled extends SocketEvent {
  locale: Locale;
}
