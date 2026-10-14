import { MockResponse } from '@stencil/core/mock-doc';
import { ResponseError } from '../api/ambulance-wl';
import { apiError } from './api';

describe('apiError', () => {
  it('uses the message from the API error body', async () => {
    const response = new MockResponse(JSON.stringify({ status: 'Bad Request', message: 'Name is required' }), {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(await apiError(new ResponseError(response as any))).toEqual({ status: 400, message: 'Name is required' });
  });

  it('falls back to the status text when the body is not JSON', async () => {
    const response = new MockResponse('<html>', { status: 502, statusText: 'Bad Gateway' });
    expect(await apiError(new ResponseError(response as any))).toEqual({ status: 502, message: 'Bad Gateway' });
  });

  it('reports network failures without a status', async () => {
    const error = Object.assign(new Error('The request failed'), { cause: new TypeError('Failed to fetch') });
    expect(await apiError(error)).toEqual({ message: 'Failed to fetch' });
  });
});
