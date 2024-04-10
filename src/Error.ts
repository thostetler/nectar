import { logger } from '@/logger';
import { parseAPIError } from '@/utils';

type AppErrorProps = {
  message?: string;
  error?: unknown;
};

class AppError extends Error {
  public originalError?: unknown;
  constructor(props?: AppErrorProps) {
    const message = parseAPIError(props?.error, { defaultMessage: props?.message });
    super(message);
    this.originalError = props.error;
    logger.error({ msg: props.message, error: this, originalError: this.originalError });
  }
}

export class MethodNotAllowedError extends AppError {}
export class InvalidCredentialsError extends AppError {}
export class AccountValidationError extends AppError {}
export class AccountNotVerifiedError extends AppError {}
export class InvalidTokenError extends AppError {}
export class UserNotFoundError extends AppError {}
export class InvalidCSRFError extends AppError {}
