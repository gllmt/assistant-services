export interface GmailClientConfig {
  accessToken: string;
}

export function createGmailClient(_config: GmailClientConfig) {
  return {
    provider: "gmail" as const
  };
}
