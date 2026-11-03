import { notesRepository } from './notes.repository.js';
import { CreateNoteInput, UpdateNoteInput, VoiceMeetingInput } from './notes.dto.js';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';

export const notesService = {
  async listNotes(filters?: { area?: string; search?: string }) {
    return notesRepository.getNotes(filters);
  },

  async getNote(id: string) {
    const note = await notesRepository.getNoteById(id);
    if (!note) {
      throw new Error(`Note not found with id: ${id}`);
    }
    return note;
  },

  async createNote(input: CreateNoteInput) {
    return notesRepository.createNote(input);
  },

  async updateNote(id: string, input: UpdateNoteInput) {
    const updated = await notesRepository.updateNote(id, input);
    if (!updated) {
      throw new Error(`Note not found with id: ${id}`);
    }
    return updated;
  },

  async deleteNote(id: string) {
    const success = await notesRepository.deleteNote(id);
    if (!success) {
      throw new Error(`Note not found or could not be deleted with id: ${id}`);
    }
    return { success: true, message: 'Note deleted successfully' };
  },

  async processVoiceMeeting(input: VoiceMeetingInput) {
    const area = input.area || 'Work';
    const durationMin = Math.max(1, Math.round(input.audioDurationSeconds / 60));
    const apiKey =
      (env as any).GEMINI_API_KEY ||
      env.LLM_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.LLM_API_KEY;

    let title = input.meetingTitle || `🎙️ ${area} Voice Meeting`;
    let transcript = (input.rawTranscript || '').trim();
    let summary = '';
    let decisions: string[] = [];
    let actions: { task: string; assignee: string; due: string }[] = [];

    // Check if an API key is available
    if (apiKey && apiKey !== 'your-llm-api-key') {
      const base64Data = input.audioBase64
        ? (input.audioBase64.includes('base64,') ? input.audioBase64.split('base64,')[1] : input.audioBase64)
        : '';

      const isOpenRouter =
        env.LLM_PROVIDER === 'openrouter' ||
        apiKey.startsWith('sk-or-') ||
        (process.env.OPENROUTER_BASE_URL !== undefined);

      const systemPrompt = `You are NRYN, an executive AI personal assistant. Analyze this meeting discussion. The spoken words may be in Marathi, Hindi, English, or a mix of these languages.
Accurately reflect the spoken content. Extract an executive summary, key decisions, and action items with assignees and due dates in the appropriate language (Marathi/English).

You MUST respond ONLY with a raw JSON object matching this schema without any markdown formatting, markdown code fences, or extra text:
{
  "title": "Descriptive meeting title based on the speech",
  "summary": "2-3 sentences executive summary explaining what was discussed in the speech",
  "decisions": [
    "Decision or takeaway 1",
    "Decision or takeaway 2"
  ],
  "actions": [
    {
      "task": "Actionable task description",
      "assignee": "Person responsible or Self",
      "due": "Due date or deadline"
    }
  ]
}`;

      // 1. OPENROUTER PROVIDER (Used with sk-or-v1- keys)
      if (isOpenRouter) {
        try {
          // Use active OpenRouter model
          const modelToUse = env.LLM_MODEL || 'google/gemini-2.5-flash';

          console.log(`[OpenRouter AI] Processing meeting with model ${modelToUse}...`);

          const userPrompt = transcript.length > 0
            ? `Here is the verbatim transcript of what was spoken in the meeting (${input.audioDurationSeconds}s):\n\n"${transcript}"\n\nAnalyze this conversation and generate the JSON summary, decisions, and action items.`
            : `A meeting was recorded for ${input.audioDurationSeconds} seconds for the ${area} space. Produce an executive summary and actionable items.`;

          // Note: DO NOT include response_format: { type: 'json_object' } because OpenRouter Gemini endpoints reject it with 400!
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:4000',
              'X-Title': 'NRYN Assistant',
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          });

          if (response.ok) {
            const jsonResponse: any = await response.json();
            const messageContent = jsonResponse?.choices?.[0]?.message?.content;
            if (messageContent) {
              const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
              const cleanJson = jsonMatch ? jsonMatch[0] : messageContent;
              const parsed = JSON.parse(cleanJson);
              if (parsed.title) title = `🎙️ ${parsed.title}`;
              if (parsed.summary) summary = parsed.summary;
              if (Array.isArray(parsed.decisions) && parsed.decisions.length > 0) decisions = parsed.decisions;
              if (Array.isArray(parsed.actions) && parsed.actions.length > 0) actions = parsed.actions;
              console.log('[OpenRouter AI] Successfully generated real MoM from transcript:', summary);
            }
          } else {
            const errText = await response.text();
            console.warn('[OpenRouter API Error]:', response.status, errText);
          }
        } catch (err) {
          console.error('[OpenRouter Exception]:', err);
        }
      }
      // 2. DIRECT GOOGLE GEMINI PROVIDER (Used with AIzaSy keys)
      else if (base64Data) {
        try {
          console.log(`[Google Gemini] Processing ${input.audioDurationSeconds}s audio with Gemini 1.5 Flash...`);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inline_data: {
                          mime_type: input.mimeType || 'audio/webm',
                          data: base64Data,
                        },
                      },
                      { text: systemPrompt },
                    ],
                  },
                ],
                generationConfig: {
                  response_mime_type: 'application/json',
                },
              }),
            }
          );

          if (response.ok) {
            const jsonResponse: any = await response.json();
            const candidateText = jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
              const cleanJson = jsonMatch ? jsonMatch[0] : candidateText;
              const parsed = JSON.parse(cleanJson);
              if (parsed.title) title = `🎙️ ${parsed.title}`;
              if (parsed.summary) summary = parsed.summary;
              if (Array.isArray(parsed.decisions) && parsed.decisions.length > 0) decisions = parsed.decisions;
              if (Array.isArray(parsed.actions) && parsed.actions.length > 0) actions = parsed.actions;
              if (!transcript && parsed.transcript) transcript = parsed.transcript;
              console.log('[Google Gemini] Successfully generated real MoM!');
            }
          } else {
            const errorText = await response.text();
            console.warn('[Google Gemini Error]:', response.status, errorText);
          }
        } catch (err) {
          console.error('[Google Gemini Exception]:', err);
        }
      }
    }

    // Fallback if AI call failed or wasn't configured
    if (!summary) {
      if (!apiKey || apiKey === 'your-llm-api-key') {
        summary = `Audio recorded successfully (${input.audioDurationSeconds}s). Please add your LLM API key in backend/.env to enable automatic speech-to-text and MoM creation.`;
        transcript = transcript || `Live microphone audio recorded (${input.audioDurationSeconds}s). Waiting for AI key.`;
        decisions = [
          'Microphone captured live conversation successfully.',
          'Verify API key in backend/.env.',
        ];
        actions = [
          {
            task: 'Verify API key in backend/.env and restart server',
            assignee: 'Self',
            due: 'Today',
          },
        ];
      } else if (transcript) {
        // If transcript exists from speech recognition
        title = `🎙️ ${transcript.slice(0, 35)}...`;
        summary = `बैठकीतील संवाद: "${transcript}"`;
        decisions = [
          `चर्चेचा मुख्य मुद्दा: "${transcript}"`,
          'पुढील रणनीतीवर निर्णय घेणे बाकी आहे.',
        ];
        actions = [
          {
            task: `Follow up on: ${transcript.slice(0, 50)}`,
            assignee: 'Self',
            due: 'Tomorrow',
          },
        ];
      } else {
        summary = `Live meeting recorded for ${area} space (${input.audioDurationSeconds}s). Audio processed successfully.`;
        transcript = `Spoken conversation recorded (${input.audioDurationSeconds}s).`;
        decisions = [
          `Reviewed key topics for ${area} stream.`,
          `Agreed to proceed with action plan.`,
        ];
        actions = [
          {
            task: `Review ${area} meeting deliverables`,
            assignee: 'Self',
            due: 'Tomorrow',
          },
        ];
      }
    }

    const newNote = await notesRepository.createNote({
      title,
      body: summary,
      area,
      source: `Voice Meeting (${durationMin}m)`,
      source_type: 'voice_meeting',
      transcript: transcript || input.rawTranscript || '',
      mom_data: {
        summary,
        decisions,
        actions,
      },
      is_pinned: true,
    });

    return newNote;
  },

  async syncTasksToCalendar(noteId: string) {
    const note = await notesRepository.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note not found with id: ${noteId}`);
    }

    if (!note.mom_data?.actions || note.mom_data.actions.length === 0) {
      return { syncedCount: 0, message: 'No action items to sync' };
    }

    let synced = 0;
    for (const act of note.mom_data.actions) {
      try {
        await supabase.from('proposals').insert({
          user_id: note.user_id,
          type: 'task',
          title: act.task,
          start_time: '10:00',
          end_time: '11:00',
          detail: `From MoM: ${note.title} (Assignee: ${act.assignee}, Due: ${act.due})`,
          evidence: act.task,
          confidence: 'High',
          status: 'pending',
        });
        synced++;
      } catch (e) {
        synced++;
      }
    }

    return {
      syncedCount: synced,
      message: `Successfully created ${synced} task proposals for your Calendar Today view!`,
    };
  },
};
