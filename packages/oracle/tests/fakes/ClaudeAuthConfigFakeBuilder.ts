import type { ClaudeAuthConfig } from '../../src/lib/auth.js';
import { FakeBuilder } from './FakeBuilder.js';

export class ClaudeAuthConfigFakeBuilder extends FakeBuilder<ClaudeAuthConfig> {
  private authToken = 'sk-ant-api03-test-token-1234567890';
  private baseUrl = 'https://api.anthropic.com';
  private model = 'glm-4.7';

  /**
   * Set the auth token for the configuration
   * @param token - The authentication token
   * @returns This builder for fluent interface
   */
  withAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Set the base URL for the API
   * @param url - The base URL
   * @returns This builder for fluent interface
   */
  withBaseUrl(url: string): this {
    this.baseUrl = url;
    return this;
  }

  /**
   * Set the model for the API
   * @param model - The model name
   * @returns This builder for fluent interface
   */
  withModel(model: string): this {
    this.model = model;
    return this;
  }

  /**
   * Build a ClaudeAuthConfig with current settings
   * @returns A valid ClaudeAuthConfig object
   */
  build(): ClaudeAuthConfig {
    return {
      authToken: this.authToken,
      baseUrl: this.baseUrl,
      model: this.model,
    };
  }

  /**
   * Create a builder with invalid data for negative testing
   * @returns This builder with invalid settings
   */
  withInvalidData(): this {
    // Create a completely invalid configuration
    this.authToken = '';
    this.baseUrl = 'invalid-url';
    this.model = '';
    return this;
  }

  /**
   * Create a builder with an invalid token for testing error scenarios
   * @returns This builder with an invalid token
   */
  withInvalidToken(): this {
    this.authToken = 'invalid-token-format';
    return this;
  }
}