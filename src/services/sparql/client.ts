import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { SparqlResults, WikibaseConfig } from '@/types'

/**
 * Error thrown when authentication is required to access the SPARQL endpoint
 */
export class AuthenticationRequiredError extends Error {
  constructor(
    message: string,
    public readonly authUrl: string
  ) {
    super(message)
    this.name = 'AuthenticationRequiredError'
  }
}

export interface SparqlClientOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

const DEFAULT_OPTIONS: Required<SparqlClientOptions> = {
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
}

export class SparqlClient {
  private axiosInstance: AxiosInstance
  private options: Required<SparqlClientOptions>
  private config: WikibaseConfig
  private requestQueue: Array<() => Promise<void>> = []
  private activeRequests = 0
  private maxConcurrent: number

  constructor(
    config: WikibaseConfig,
    options: SparqlClientOptions = {}
  ) {
    this.config = config
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.maxConcurrent = config.rateLimit?.concurrent ?? 5

    this.axiosInstance = axios.create({
      baseURL: config.sparqlEndpoint,
      timeout: this.options.timeout,
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      // Include cookies for cookie-based auth (e.g., Commons wcqsOauth/wcqsSession)
      withCredentials: config.cookieBasedAuth ?? false,
    })
  }

  /**
   * Execute a SPARQL query
   */
  async query(sparql: string): Promise<SparqlResults> {
    // For cookie-based auth, let the request proceed - browser will handle cookies
    // Only block if requiresAuthentication is true AND it's not cookie-based
    if (this.config.requiresAuthentication && !this.config.cookieBasedAuth) {
      const note = this.config.availabilityNote ??
        `${this.config.name} requires authenticated access for SPARQL queries.`
      throw new Error(note)
    }
    return this.executeWithRetry(sparql)
  }

  /**
   * Get the authentication URL for this endpoint (if available)
   */
  getAuthUrl(): string | undefined {
    return this.config.authUrl
  }

  /**
   * Check if this endpoint requires authentication
   */
  requiresAuth(): boolean {
    return this.config.requiresAuthentication ?? false
  }

  /**
   * Check if this endpoint uses cookie-based authentication
   */
  usesCookieAuth(): boolean {
    return this.config.cookieBasedAuth ?? false
  }

  /**
   * Execute query with retry logic
   */
  private async executeWithRetry(
    sparql: string,
    attempt = 0
  ): Promise<SparqlResults> {
    try {
      return await this.executeRequest(sparql)
    } catch (error) {
      const axiosError = error as AxiosError

      // Retry on network errors or 5xx errors
      if (
        attempt < this.options.retries &&
        this.isRetryableError(axiosError)
      ) {
        await this.delay(this.options.retryDelay * (attempt + 1))
        return this.executeWithRetry(sparql, attempt + 1)
      }

      throw this.normalizeError(axiosError)
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(sparql: string): Promise<SparqlResults> {
    // Wait if we're at max concurrent requests
    await this.waitForSlot()

    this.activeRequests++

    try {
      const response = await this.axiosInstance.post<SparqlResults>(
        '',
        new URLSearchParams({ query: sparql }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      return response.data
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }

  /**
   * Wait for an available request slot
   */
  private waitForSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrent) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.requestQueue.push(async () => resolve())
    })
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const next = this.requestQueue.shift()
      next?.()
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      return true // Network error
    }

    const status = error.response.status
    return status >= 500 || status === 429 // Server error or rate limited
  }

  /**
   * Normalize error for consistent handling
   */
  private normalizeError(error: AxiosError): Error {
    if (!error.response) {
      return new Error(`Network error: ${error.message}`)
    }

    const status = error.response.status
    const message =
      (error.response.data as { message?: string })?.message ||
      error.message

    switch (status) {
      case 400:
        return new Error(`Invalid query: ${message}`)
      case 401:
      case 403:
        // Authentication required or failed
        if (this.config.cookieBasedAuth && this.config.authUrl) {
          return new AuthenticationRequiredError(
            `Authentication required. Please login to ${this.config.name}.`,
            this.config.authUrl
          )
        }
        return new Error(`Authentication required for ${this.config.name}.`)
      case 429:
        return new Error('Rate limit exceeded. Please try again later.')
      case 500:
        return new Error('SPARQL endpoint error. Please try again.')
      case 503:
        return new Error('Service temporarily unavailable.')
      default:
        return new Error(`Request failed (${status}): ${message}`)
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Create a SPARQL client for a given configuration
 */
export function createSparqlClient(
  config: WikibaseConfig,
  options?: SparqlClientOptions
): SparqlClient {
  return new SparqlClient(config, options)
}
