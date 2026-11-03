import { google } from 'googleapis';
import { createOAuth2Client, GMAIL_SCOPES } from '../../config/google.js';
import { encryptToken, decryptToken } from '../../shared/utils/crypto.js';

export const gmailOAuth = {
  getAuthorizationUrl(state: string = 'default_user'): string {
    const client = createOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state,
    });
  },

  async exchangeCodeForTokens(code: string) {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info (email address)
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('Unable to retrieve email from Google OAuth profile');
    }

    if (!tokens.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Make sure prompt="consent" is set.'
      );
    }

    const refreshTokenEnc = encryptToken(tokens.refresh_token);

    return {
      email,
      refreshTokenEnc,
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
    };
  },

  getAuthenticatedClient(refreshTokenEnc: string) {
    const plainRefreshToken = decryptToken(refreshTokenEnc);
    const client = createOAuth2Client();
    client.setCredentials({
      refresh_token: plainRefreshToken,
    });
    return client;
  },
};
