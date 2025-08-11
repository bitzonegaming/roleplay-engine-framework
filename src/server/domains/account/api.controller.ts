import { RegisterAccountRequest } from '@bitzonegaming/roleplay-engine-sdk';

import {
  ApiController,
  AuthorizedRequest,
  Body,
  Controller,
  EndpointScope,
  Post,
  Request,
  SessionToken,
} from '../../api';
import { ConflictError } from '../../core/errors';
import { SessionService } from '../session/service';

import { AccountService } from './service';
import { RPAccount } from './models/account';

/**
 * Account API Controller
 */
@Controller('/accounts')
export class AccountController extends ApiController {
  private get accountService(): AccountService {
    return this.context.getService(AccountService);
  }

  private get sessionService(): SessionService {
    return this.context.getService(SessionService);
  }

  /**
   * Register a new account
   *
   * Creates a new player account with the provided credentials.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The registration request details
   * @param authRequest - The authorized request containing session info
   * @returns The created account details
   * @throws ConflictError when session is already authorized
   */
  @Post('/', {
    statusCode: 201,
  })
  @SessionToken(EndpointScope.SERVER)
  public async register(
    @Body() request: RegisterAccountRequest,
    @Request() authRequest: AuthorizedRequest,
  ): Promise<RPAccount> {
    const sessionId = authRequest.sessionId!;
    const session = this.sessionService.getSession(sessionId);

    if (session?.account) {
      throw new ConflictError('SESSION_HAS_AUTHORIZED', {});
    }

    return this.accountService.registerAccount(request);
  }
}
