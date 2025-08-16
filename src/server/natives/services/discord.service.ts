import { SessionId } from '../../domains/session/models/session';
import { RPServerService } from '../../core/server-service';

export abstract class DiscordService extends RPServerService {
  abstract getDiscordUserId(sessionId: SessionId): string | undefined;
}
