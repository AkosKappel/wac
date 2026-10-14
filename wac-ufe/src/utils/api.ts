import {
  AmbulanceDepartmentsApi,
  AmbulanceDeviceListApi,
  AmbulanceDeviceLogListApi,
  Configuration,
  ResponseError,
} from '../api/ambulance-wl';
import { t } from './i18n';

/** The generated API clients for a base path such as "/api". */
export function apiClients(basePath: string) {
  const configuration = new Configuration({ basePath });
  return {
    devices: new AmbulanceDeviceListApi(configuration),
    logs: new AmbulanceDeviceLogListApi(configuration),
    departments: new AmbulanceDepartmentsApi(configuration),
  };
}

export interface ApiError {
  /** HTTP status; undefined when the server was not reached */
  status?: number;
  message: string;
}

/** The status and message of a failed call; the API answers errors with { status, message }. */
export async function apiError(err: any): Promise<ApiError> {
  if (err instanceof ResponseError) {
    const body = await err.response.json().catch(() => undefined);
    return { status: err.response.status, message: body?.message || err.response.statusText };
  }
  // fetch failures (offline, DNS) come wrapped with the original error as the cause
  return { message: err?.cause?.message || err?.message || t().common.unknownError };
}
