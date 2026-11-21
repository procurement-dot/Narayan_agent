import { env } from '../../config/env.js';

export interface AiAnalysisResult {
  scope: 'work' | 'personal';
  kind: 'meeting' | 'task' | 'noise' | 'unwanted';
  confidence: 'High' | 'Medium' | 'Low';
  proposal?: {
    type: 'meeting' | 'task';
    title: string;
    start_time: string;
    end_time: string;
    detail: string;
    evidence: string;
    confidence: 'High' | 'Medium' | 'Low';
  };
  draftReply: string;
  isUnwanted?: boolean;
  unwantedReason?: string;
}

export const emailAnalyzer = {
  async analyzeEmail(email: {
    fromName: string;
    fromEmail: string;
    subject: string;
    content: string;
  }): Promise<AiAnalysisResult> {
    const prompt = `You are NRYN AI Executive Assistant for Narayan. Analyze the following inbound email with care and discernment.

Email Metadata:
From: ${email.fromName} <${email.fromEmail}>
Subject: ${email.subject}

Email Content:
"""
${email.content.slice(0, 3000)}
"""

Instructions:
1. Classify:
   - "kind": MUST be one of ["meeting", "task", "noise", "unwanted"].
     * "meeting": An explicit request or suggestion to meet, call, or schedule a session.
     * "task": A concrete action item, review request, deliverable, or deadline requested.
     * "noise": Generic informational update, transactional alert, receipt.
     * "unwanted": Marketing promotion, spam, cold sales pitch, unwanted newsletter, advertisement, or junk.
   - "scope": "work" or "personal".
   - "confidence": "High", "Medium", or "Low".

2. Unwanted Email Detection:
   - "isUnwanted": Set to true if this email is promotional marketing, sale pitch, newsletter digest, advertising blast, cold outreach, or spam.
   - "unwantedReason": A crisp explanation in 3-8 words (e.g. "Promotional sale & discount offer", "Automated marketing newsletter", "Unsolicited cold sales pitch", "Social media alert / spam"). Set to "" if not unwanted.

3. Extract Action / Meeting Proposal:
   - If "kind" is "meeting" or "task", generate a proposal object with:
     * "type": "meeting" or "task"
     * "title": Short, crisp title (max 50 chars).
     * "start_time": Inferred start time in 24-hr "HH:mm" format (e.g. "16:00" or "14:00"). If no explicit time mentioned, suggest a sensible working hour slot like "15:00".
     * "end_time": End time in 24-hr "HH:mm" format (e.g. "16:30").
     * "detail": 1-2 sentence context explaining what needs to happen.
     * "evidence": An EXACT VERBATIM sentence quoted word-for-word from the email text that justifies this proposal.
     * "confidence": "High", "Medium", or "Low".
   - If "kind" is "noise" or "unwanted", do not generate a proposal.

4. Draft Reply:
   - Always write a calm, courteous, professional reply in Narayan's executive voice (2-3 sentences max).
   - Keep it concise, respectful, and clear.
   - For announcements, sales, or newsletters, write a polite acknowledgment or leave standard acknowledgment. Never leave draftReply empty.

Respond ONLY with valid JSON matching this schema:
{
  "scope": "work" | "personal",
  "kind": "meeting" | "task" | "noise" | "unwanted",
  "confidence": "High" | "Medium" | "Low",
  "isUnwanted": boolean,
  "unwantedReason": "string",
  "proposal": {
    "type": "meeting" | "task",
    "title": "string",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "detail": "string",
    "evidence": "string",
    "confidence": "High" | "Medium" | "Low"
  } | null,
  "draftReply": "string"
}`;

    try {
      const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.LLM_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'https://narayan-agent.onrender.com',
          'X-Title': 'NRYN Assistant',
        },
        body: JSON.stringify({
          model: env.LLM_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      const data = (await response.json()) as any;
      const rawText = data.choices?.[0]?.message?.content || '{}';
      const cleanJson = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      const isUnwanted = Boolean(parsed.isUnwanted) || parsed.kind === 'unwanted';
      const unwantedReason = parsed.unwantedReason || (isUnwanted ? 'Promotional or automated mail' : '');

      return {
        scope: parsed.scope === 'personal' ? 'personal' : 'work',
        kind: ['meeting', 'task', 'noise', 'unwanted'].includes(parsed.kind)
          ? parsed.kind
          : isUnwanted ? 'unwanted' : 'task',
        confidence: ['High', 'Medium', 'Low'].includes(parsed.confidence)
          ? parsed.confidence
          : 'High',
        isUnwanted,
        unwantedReason,
        proposal:
          parsed.proposal && parsed.proposal.title && !isUnwanted
            ? {
                type: parsed.proposal.type === 'meeting' ? 'meeting' : 'task',
                title: parsed.proposal.title,
                start_time: parsed.proposal.start_time || '15:00',
                end_time: parsed.proposal.end_time || '15:30',
                detail: parsed.proposal.detail || '',
                evidence: parsed.proposal.evidence || email.subject,
                confidence: parsed.proposal.confidence || 'High',
              }
            : undefined,
        draftReply: parsed.draftReply || '',
      };
    } catch (err) {
      console.error('AI Analysis failed, falling back to rule-based analysis:', err);
      return this.ruleBasedFallback(email);
    }
  },

  ruleBasedFallback(email: {
    fromName: string;
    subject: string;
    content: string;
  }): AiAnalysisResult {
    const text = (email.subject + ' ' + email.content).toLowerCase();
    const isMeeting = /meet|call|zoom|calendar|schedule|timing|at \d|pm|am/i.test(text);
    const isUnwanted = /unsubscribe|newsletter|promotions|promo|discount|sale|limited offer|deal of the day|best price|click here|sponsored|advertisement|shop now|hurry|coupon|webinar/i.test(text);
    const isNoise = /receipt|bill|invoice|statement|otp|verification code|security alert/i.test(text);

    let kind: 'meeting' | 'task' | 'noise' | 'unwanted' = 'task';
    let unwantedReason = '';

    if (isUnwanted) {
      kind = 'unwanted';
      if (/sale|discount|deal|coupon|shop/i.test(text)) {
        unwantedReason = 'Promotional discount & sales offer';
      } else if (/newsletter|digest/i.test(text)) {
        unwantedReason = 'Automated newsletter digest';
      } else if (/unsubscribe/i.test(text)) {
        unwantedReason = 'Marketing mailer with unsubscribe';
      } else {
        unwantedReason = 'Automated promotional noise';
      }
    } else if (isNoise) {
      kind = 'noise';
    } else if (isMeeting) {
      kind = 'meeting';
    }

    return {
      scope: 'work',
      kind,
      confidence: 'Medium',
      isUnwanted,
      unwantedReason,
      proposal:
        kind === 'meeting' || kind === 'task'
          ? {
              type: kind === 'meeting' ? 'meeting' : 'task',
              title: email.subject.slice(0, 45),
              start_time: '15:00',
              end_time: '15:30',
              detail: `Follow-up on: ${email.subject}`,
              evidence: email.subject,
              confidence: 'Medium',
            }
          : undefined,
      draftReply:
        kind !== 'unwanted' && kind !== 'noise'
          ? `Thank you. I have received your email regarding "${email.subject}" and am reviewing it.`
          : '',
    };
  },

  async generateDraftReply(email: {
    fromName: string;
    fromEmail?: string;
    subject: string;
    content: string;
    instruction?: string;
  }): Promise<string> {
    const prompt = `You are NRYN AI Executive Assistant for Narayan. Draft a courteous, concise, and professional reply to the following email.

From: ${email.fromName} ${email.fromEmail ? `<${email.fromEmail}>` : ''}
Subject: ${email.subject}
Email Content:
"""
${(email.content || '').slice(0, 3000)}
"""
${email.instruction ? `User's Special Request: ${email.instruction}` : ''}

Instructions:
- Write a warm, calm, and executive response.
- Keep it concise and natural (2-4 sentences).
- If it is a newsletter or announcement, write a polite acknowledgment or inquiry.
- Return ONLY the exact text of the email reply body, nothing else.`;

    try {
      const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.LLM_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'https://narayan-agent.onrender.com',
          'X-Title': 'NRYN Assistant',
        },
        body: JSON.stringify({
          model: env.LLM_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      return text || `Thank you for reaching out regarding "${email.subject}". I have reviewed the details and will follow up shortly.`;
    } catch (err) {
      console.warn('Failed to generate draft with Gemini, using fallback:', err);
      return `Thank you for reaching out regarding "${email.subject}". I have received your email and will get back to you shortly.`;
    }
  },
};
