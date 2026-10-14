import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@takt/db';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error: string;
  errorCode?: string;
}

function isPrismaKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function isPrismaValidationError(error: unknown): error is Prisma.PrismaClientValidationError {
  return error instanceof Prisma.PrismaClientValidationError;
}

function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}

function getErrorDetails(exception: unknown): { message: string; error: string; status: number; errorCode?: string } {
  // Use explicit type checks without relying on control flow narrowing
  const isHttpExc = isHttpException(exception);
  const isPrismaKnown = isPrismaKnownRequestError(exception);
  const isPrismaVal = isPrismaValidationError(exception);
  const isErr = exception instanceof Error;

  if (isHttpExc) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse, error: exception.name, status, errorCode: undefined };
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      return {
        message: (resp.message as string) || exception.message,
        error: (resp.error as string) || exception.name,
        status,
        errorCode: resp.errorCode as string | undefined,
      };
    }
    return { message: exception.message, error: exception.name, status };
  }
  if (isPrismaKnown) {
    return {
      message: handlePrismaError(exception),
      error: 'Bad Request',
      status: HttpStatus.BAD_REQUEST,
      errorCode: exception.code,
    };
  }
  if (isPrismaVal) {
    return {
      message: 'Données invalides',
      error: 'Validation Error',
      status: HttpStatus.BAD_REQUEST,
      errorCode: undefined,
    };
  }
  if (isErr) {
    const err = exception as Error;
    return {
      message: err.message,
      error: err.name,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: undefined,
    };
  }
  return {
    message: 'Erreur interne du serveur',
    error: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: undefined,
  };
}

function handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): string {
  switch (exception.code) {
    case 'P2002': {
      const target = exception.meta?.target as string[] | undefined;
      return `Une entrée avec cette valeur existe déjà${target ? ` (${target.join(', ')})` : ''}`;
    }
    case 'P2025':
      return 'Enregistrement non trouvé';
    case 'P2003':
      return 'Violation de contrainte de clé étrangère';
    default:
      return 'Erreur de base de données';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { message, error, status, errorCode } = getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
      errorCode,
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}