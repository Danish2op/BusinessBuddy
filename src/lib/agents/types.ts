export type ServiceError = {
  code: string;
  message: string;
  provider?: string;
  status?: number;
  retryable?: boolean;
};

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ServiceError;
    };

export function serviceSuccess<T>(data: T): ServiceResult<T> {
  return {
    ok: true,
    data
  };
}

export function serviceFailure<T = never>(error: ServiceError): ServiceResult<T> {
  return {
    ok: false,
    error
  };
}
