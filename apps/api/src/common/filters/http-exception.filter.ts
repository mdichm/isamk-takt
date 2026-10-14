import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@takt/db';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code?: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
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

function getStatusTitle(status: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Content',
    423: 'Locked',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return titles[status] || 'Error';
}

function getErrorDetails(exception: unknown, request: Request): ProblemDetails {
  const isHttpExc = isHttpException(exception);
  const isPrismaKnown = isPrismaKnownRequestError(exception);
  const isPrismaVal = isPrismaValidationError(exception);
  const isErr = exception instanceof Error;
  const requestId = (request as any).requestId;

  let status: number;
  let detail: string;
  let title: string;
  let code: string | undefined;
  let errors: ProblemDetails['errors'];

  if (isHttpExc) {
    status = exception.getStatus();
    title = getStatusTitle(status);
    const exceptionResponse = exception.getResponse();
    
    if (typeof exceptionResponse === 'string') {
      detail = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      detail = (resp.detail as string) || (resp.message as string) || exception.message;
      code = resp.errorCode as string | undefined;
      if (resp.validationErrors && Array.isArray(resp.validationErrors)) {
        errors = resp.validationErrors as ProblemDetails['errors'];
      }
    } else {
      detail = exception.message;
    }
  } else if (isPrismaKnown) {
    status = HttpStatus.BAD_REQUEST;
    title = getStatusTitle(status);
    detail = handlePrismaError(exception);
    code = exception.code;
  } else if (isPrismaVal) {
    status = HttpStatus.BAD_REQUEST;
    title = getStatusTitle(status);
    detail = 'Données invalides';
  } else if (isErr) {
    status = HttpStatus.INTERNAL_SERVER_ERROR;
    title = getStatusTitle(status);
    detail = (exception as Error).message;
  } else {
    status = HttpStatus.INTERNAL_SERVER_ERROR;
    title = getStatusTitle(status);
    detail = 'Erreur interne du serveur';
  }

  return {
    type: `https://takt.example.fr/errors/${status}`,
    title,
    status,
    detail,
    instance: request.url,
    code,
    requestId,
    errors,
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
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = getErrorDetails(exception, request);

    this.logger.error(
      `${request.method} ${request.url} - ${problem.status} - ${problem.detail}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(problem.status).json(problem);
  }
}