import { ClaudeAuthConfig } from '../../src/lib/auth.js';
import { FakeBuilder } from './FakeBuilder.js';

export class ClaudeAuthConfigFakeBuilder extends FakeBuilder<ClaudeAuthConfig> {
  private authToken = 'test-token';
  private baseUrl = 'https://api.anthropic.com';
  private model = 'glm-4.7';

  withAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  withBaseUrl(url: string): this {
    this.baseUrl = url;
    return this;
  }

  withModel(model: string): this {
    this.model = model;
    return this;
  }

  withInvalidData(): this {
    // For invalid auth config, use empty values
    this.authToken = '';
    this.baseUrl = '';
    this.model = '';
    return this;
  }

  build(): ClaudeAuthConfig {
    return {
      authToken: this.authToken,
      baseUrl: this.baseUrl,
      model: this.model,
    };
  }
}