import { supabase } from '../../config/supabase.js';

export const emailRepository = {
  async getEmails(tab?: string) {
    let query = supabase.from('emails').select('*').order('received_at', { ascending: false });

    if (tab === 'priority') {
      query = query.neq('kind', 'noise');
    } else if (tab === 'meetings') {
      query = query.eq('kind', 'meeting');
    } else if (tab === 'low') {
      query = query.eq('kind', 'noise');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getEmailById(id: string) {
    const { data, error } = await supabase
      .from('emails')
      .select('*, email_drafts(body)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async upsertDraft(emailId: string, userId: string, body: string) {
    const { data, error } = await supabase
      .from('email_drafts')
      .upsert({ email_id: emailId, user_id: userId, body, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markArchive(emailId: string) {
    const { data, error } = await supabase
      .from('emails')
      .update({ status: 'Archive proposed (demo)' })
      .eq('id', emailId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProposalByEmailId(emailId: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('email_id', emailId)
      .single();

    if (error) throw error;
    return data;
  },

  async approveProposal(proposalId: string, userId: string, taskData: { title: string; start: string; end: string; detail: string }) {
    // Check if task already exists for this proposal to enforce duplicate guard
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('source_proposal_id', proposalId)
      .maybeSingle();

    if (existingTask) {
      const err = new Error('Already on your day; duplicate prevented.');
      (err as any).statusCode = 409;
      throw err;
    }

    // Insert task
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: taskData.title,
        start_time: taskData.start,
        end_time: taskData.end,
        detail: taskData.detail,
        source_proposal_id: proposalId,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Update proposal status
    await supabase
      .from('proposals')
      .update({ status: 'approved' })
      .eq('id', proposalId);

    return newTask;
  },

  async dismissProposal(proposalId: string) {
    const { data, error } = await supabase
      .from('proposals')
      .update({ status: 'dismissed' })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
