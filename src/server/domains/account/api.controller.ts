import {
  AccountAuthRequest,
  ExternalLoginAuthRequest,
  GrantAccessResult,
  RegisterAccountRequest,
} from '@bitzonegaming/roleplay-engine-sdk';
import { ExternalLoginPreAuthRequest } from '@bitzonegaming/roleplay-engine-sdk/account/models/external-login-pre-auth-request';
import { ExternalLoginPreAuthResult } from '@bitzonegaming/roleplay-engine-sdk/account/models/external-login-pre-auth-result';

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

  /**
   * Authenticate with password
   *
   * Authenticates a player using their password. This endpoint is used to log in a player to the game server.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The authentication request containing username and password
   * @param authRequest - The authorized request containing session info
   * @returns Grant access result with authentication token
   * @throws ConflictError when session is already authorized
   */
  @Post('/auth', {
    statusCode: 200,
  })
  @SessionToken(EndpointScope.SERVER)
  public async authWithPassword(
    @Body() request: AccountAuthRequest,
    @Request() authRequest: AuthorizedRequest,
  ): Promise<GrantAccessResult> {
    const sessionId = authRequest.sessionId!;
    const session = this.sessionService.getSession(sessionId);

    if (session?.account) {
      throw new ConflictError('SESSION_HAS_AUTHORIZED', {});
    }

    return this.accountService.authWithPassword(request);
  }

  /**
   * External login pre-authentication
   *
   * Pre-authenticates a player for external login. This endpoint is used to initiate the external login flow.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The external login pre-auth request with provider details
   * @param authRequest - The authorized request containing session info
   * @returns Pre-authentication result with redirect URL or token
   * @throws ConflictError when session is already authorized
   */
  @Post('/external-login/pre-auth', {
    statusCode: 200,
  })
  @SessionToken(EndpointScope.SERVER)
  public async preAuthExternalLogin(
    @Body() request: ExternalLoginPreAuthRequest,
    @Request() authRequest: AuthorizedRequest,
  ): Promise<ExternalLoginPreAuthResult> {
    const sessionId = authRequest.sessionId!;
    const session = this.sessionService.getSession(sessionId);

    if (session?.account) {
      throw new ConflictError('SESSION_HAS_AUTHORIZED', {});
    }

    return this.accountService.preAuthExternalLogin(request);
  }

  /**
   * External login authentication
   *
   * Authenticates a player using external login credentials. This endpoint is used to complete the external login flow.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The external login auth request with provider token
   * @param authRequest - The authorized request containing session info
   * @returns Grant access result with authentication token
   * @throws ConflictError when session is already authorized
   */
  @Post('/external-login/auth', {
    statusCode: 200,
  })
  @SessionToken(EndpointScope.SERVER)
  public async authExternalLogin(
    @Body() request: ExternalLoginAuthRequest,
    @Request() authRequest: AuthorizedRequest,
  ): Promise<GrantAccessResult> {
    const sessionId = authRequest.sessionId!;
    const session = this.sessionService.getSession(sessionId);

    if (session?.account) {
      throw new ConflictError('SESSION_HAS_AUTHORIZED', {});
    }

    return this.accountService.authExternalLogin(request);
  }
}
