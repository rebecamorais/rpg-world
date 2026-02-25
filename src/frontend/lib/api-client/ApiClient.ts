export type AnyObject = Record<string, unknown>;

export type RequestOptions<B = unknown> = Omit<RequestInit, 'body'> & {
  body?: B;
};

export class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ApiClient {
  constructor(private basePath: string = '') {}

  private async fetchWrapper<T, B = unknown>(
    url: string,
    options: RequestOptions<B> = {},
  ): Promise<T> {
    const { body, headers, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const fullUrl = `${this.basePath}${url}`;
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorData: AnyObject;
      try {
        errorData = (await response.json()) as AnyObject;
      } catch {
        errorData = {};
      }

      const errorMessage =
        typeof errorData.error === 'string'
          ? errorData.error
          : typeof errorData.message === 'string'
            ? errorData.message
            : 'An error occurred';

      throw new APIError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  public get<T = unknown>(
    url: string,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) {
    return this.fetchWrapper<T>(url, { ...options, method: 'GET' });
  }

  public post<T = unknown, B = unknown>(
    url: string,
    body?: B,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) {
    return this.fetchWrapper<T, B>(url, { ...options, method: 'POST', body });
  }

  public put<T = unknown, B = unknown>(
    url: string,
    body?: B,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) {
    return this.fetchWrapper<T, B>(url, { ...options, method: 'PUT', body });
  }

  public patch<T = unknown, B = unknown>(
    url: string,
    body?: B,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) {
    return this.fetchWrapper<T, B>(url, { ...options, method: 'PATCH', body });
  }

  public delete<T = unknown>(
    url: string,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) {
    return this.fetchWrapper<T>(url, { ...options, method: 'DELETE' });
  }
}
