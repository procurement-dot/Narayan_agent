import { google } from 'googleapis';
import { createOAuth2Client, GMAIL_SCOPES } from '../../config/google.js';
import { encryptToken, decryptToken } from '../../shared/utils/crypto.js';

export const gmailOAuth = {
  getAuthorizationUrl(state: string = 'default_user', redirectUri?: string): string {
    const client = createOAuth2Client(redirectUri);
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: GMAIL_SCOPES,
      state,
      redirect_uri: redirectUri,
    });
  },

  async exchangeCodeForTokens(code: string, redirectUri?: string) {
    const candidates = Array.from(
      new Set(
        [
          'https://narayan-agent.onrender.com/api/email/oauth/callback',
          redirectUri,
          'http://localhost:4000/api/email/oauth/callback',
        ].filter(Boolean) as string[]
      )
    );

    let lastError: any = null;
    for (const uri of candidates) {
      try {
        const client = createOAuth2Client(uri);
        const { tokens } = await client.getToken({
          code,
          redirect_uri: uri,
        });
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
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        if (errMsg.includes('redirect_uri_mismatch')) {
          continue; // try next candidate
        }
        throw err;
      }
    }
    throw lastError;
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
