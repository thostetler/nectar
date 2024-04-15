import { logger } from '@/logger';
import { parseAPIError } from '@/utils';

class AppError<T = unknown> extends Error {
  public originalError?: T;
  constructor(originalError?: T) {
    const message = parseAPIError(originalError);
    super(message);
    this.originalError = originalError;
    logger.error({ msg: message, error: this });
  }
  get name() {
    return this.constructor.name;
  }
}

export class MethodNotAllowed extends AppError {}
export class InvalidCredentials extends AppError {}
export class UnableToValidateAccount extends AppError {}
export class AccountNotVerified extends AppError {}
export class InvalidTokenError extends AppError {}
export class UserNotFound extends AppError {}
export class InvalidCSRF extends AppError {}
export class NoSession extends AppError {}
