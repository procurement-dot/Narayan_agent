import { google, type gmail_v1 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface ParsedGmailMessage {
  providerMsgId: string;
  threadId?: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  receivedAt: Date;
  preview: string;
  content: string;
}

export const gmailService = {
  async fetchRecentEmails(
    auth: OAuth2Client,
    maxResults = 15
  ): Promise<ParsedGmailMessage[]> {
    const gmail = google.gmail({ version: 'v1', auth });

    // 1. Fetch latest messages from user inbox
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
    });

    const messageList = listRes.data.messages || [];

    if (messageList.length === 0) {
      return [];
    }

    // 2. Fetch full details for each message in parallel (batched)
    const parsedMessages: ParsedGmailMessage[] = [];

    for (const item of messageList) {
      if (!item.id) continue;
      try {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: item.id,
          format: 'full',
        });

        const parsed = this.parseMessage(full.data);
        if (parsed) {
          parsedMessages.push(parsed);
        }
      } catch (err) {
        console.warn(`Failed to fetch message ${item.id}:`, err);
      }
    }

    return parsedMessages;
  },

  parseMessage(msg: gmail_v1.Schema$Message): ParsedGmailMessage | null {
    if (!msg.id) return null;

    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const rawFrom = getHeader('From');
    const subject = getHeader('Subject') || '(No Subject)';
    const dateHeader = getHeader('Date');

    // Parse From: "John Doe <john@example.com>"
    let fromName = rawFrom;
    let fromEmail = rawFrom;
    const match = rawFrom.match(/^(.*?)\s*<(.+?)>$/);
    if (match) {
      fromName = match[1].replace(/^["']|["']$/g, '').trim() || match[2];
      fromEmail = match[2].trim();
    }

    let receivedAt = new Date();
    if (msg.internalDate) {
      receivedAt = new Date(Number(msg.internalDate));
    } else if (dateHeader) {
      receivedAt = new Date(dateHeader);
    }

    const preview = msg.snippet || '';
    const content = this.extractBody(msg.payload) || preview;

    return {
      providerMsgId: msg.id,
      threadId: msg.threadId || undefined,
      fromName,
      fromEmail,
      subject,
      receivedAt,
      preview,
      content,
    };
  },

  extractBody(payload?: gmail_v1.Schema$MessagePart): string {
    if (!payload) return '';

    // If body data is directly present
    if (payload.body?.data) {
      const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf8');
      if (payload.mimeType === 'text/html') {
        return this.stripHtml(decoded);
      }
      return decoded.trim();
    }

    // If multipart, search parts
    if (payload.parts && payload.parts.length > 0) {
      // 1. Prefer text/plain
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, 'base64url').toString('utf8').trim();
      }

      // 2. Fallback to text/html
      const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        const decoded = Buffer.from(htmlPart.body.data, 'base64url').toString('utf8');
        return this.stripHtml(decoded);
      }

      // 3. Recurse nested parts
      for (const part of payload.parts) {
        const nested = this.extractBody(part);
        if (nested) return nested;
      }
    }

    return '';
  },

  stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  },

  async archiveEmail(auth: OAuth2Client, providerMsgId: string) {
    const gmail = google.gmail({ version: 'v1', auth });
    return gmail.users.messages.modify({
      userId: 'me',
      id: providerMsgId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });
  },

  async sendEmailReply(
    auth: OAuth2Client,
    options: {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      inReplyTo?: string;
    }
  ) {
    const gmail = google.gmail({ version: 'v1', auth });

    const subjectLine = options.subject.toLowerCase().startsWith('re:')
      ? options.subject
      : `Re: ${options.subject}`;

    const headers = [
      `To: ${options.to}`,
      `Subject: =?utf-8?B?${Buffer.from(subjectLine).toString('base64')}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
    ];

    if (options.inReplyTo) {
      headers.push(`In-Reply-To: <${options.inReplyTo}>`);
      headers.push(`References: <${options.inReplyTo}>`);
    }

    const rawMessage = `${headers.join('\r\n')}\r\n\r\n${options.body}`;
    const encoded = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encoded,
        threadId: options.threadId,
      },
    });
  },
};
