export interface TwitterClientConfig {
  token: string;
}

export function createTwitterClient(_config: TwitterClientConfig) {
  return {
    provider: "twitter" as const
  };
}
