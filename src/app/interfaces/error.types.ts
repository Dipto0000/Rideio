export interface TErrorSources {
  path: string | number;
  message: string;
}

export interface IErrorResponse {
  statusCode: number;
  success: boolean;
  message: string;
  errorSources?: TErrorSources[];
  stack?: string;
}