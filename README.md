# Bitzone RolePlay Engine - Gamemode SDK

A TypeScript SDK for building game servers with the Bitzone RolePlay Engine platform.

## Installation

```bash
npm install @bitzonegaming/gamemode-sdk
```

## Quick Start

```typescript
import {RPServer} from '@bitzonegaming/gamemode-sdk';

const server = new RPServer({
    apiKeyId: 'your-api-key-id',
    apiKeySecret: 'your-api-secret',
    serverId: 'your-server-id'
});

// Start the server
await server.start();
```

## Event Handling

```typescript
import {RPServerService, OnServer} from '@bitzonegaming/gamemode-sdk';

export class MyGameService extends RPServerService {
    @OnServer('playerConnecting')
    async onPlayerConnect(event: RPPlayerConnecting) {
        this.logger.info(`Player connecting: ${event.playerId}`);
    }

    @OnServer('sessionStarted')
    async onSessionStart(event: RPSessionStarted) {
        // Initialize game session
    }
}
```

## Testing

```bash
npm test
```

## Development

```bash
npm run build    # Build the project
npm run lint     # Run linting
npm run test     # Run tests
```

## Documentation

For detailed documentation and examples, visit our [documentation site](https://docs.bitzone.com).

## Support

- GitHub Issues: [Report bugs and issues](https://github.com/bitzonegaming/gamemode-sdk/issues)

## License

MIT License - see LICENSE file for details.