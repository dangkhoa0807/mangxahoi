const DISCORD_BASE_URL = "https://discord.com/api/v10";

export class DiscordOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthUrl(scope: string = "identify email") {
    return `${DISCORD_BASE_URL}/oauth2/authorize?client_id=${
      this.clientId
    }&redirect_uri=${encodeURIComponent(
      this.redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }

  async exchangeCodeForToken(code: string) {
    const response = await fetch(`${DISCORD_BASE_URL}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    return await response.json();
  }

  async getUserInfo(accessToken: string) {
    const response = await fetch(`${DISCORD_BASE_URL}/users/@me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.log(await response.json());
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }
}
