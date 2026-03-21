export interface NotionClientConfig {
  token: string;
}

export function createNotionClient(_config: NotionClientConfig) {
  return {
    provider: "notion" as const
  };
}
