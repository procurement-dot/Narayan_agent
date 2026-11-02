import { supabase } from '../../config/supabase.js';

export async function seedDemoEmails(userId = '00000000-0000-0000-0000-000000000001') {
  console.log('[Seed] Seeding demo email data into Supabase...');

  // 1. Ensure test account exists
  const { data: account, error: accError } = await supabase
    .from('email_accounts')
    .upsert({
      user_id: userId,
      provider: 'gmail',
      email: 'demo.user@nryn.ai',
      refresh_token_enc: 'demo_encrypted_token',
      status: 'connected',
    }, { onConflict: 'id' })
    .select()
    .single();

  if (accError) {
    console.error('[Seed Error] Failed to create demo account:', accError.message);
    return;
  }

  // 2. Insert 4 demo emails
  const demoEmails = [
    {
      account_id: account.id,
      provider_msg_id: 'msg_e1',
      from_name: 'AKC Planning Team',
      from_email: 'planning@akc.org',
      subject: 'Revised calendar and regional qualifiers',
      preview: 'Please send the updated regional qualifier calendar today by 2:30 PM.',
      content: 'We need the revised regional qualifier calendar today by 2:30 PM so schools can plan. Please send the latest version.',
      kind: 'task',
      draft: 'Thanks. I am reviewing the regional calendar and will share the latest version.',
      confidence: 'High',
      scope: 'work',
    },
    {
      account_id: account.id,
      provider_msg_id: 'msg_e2',
      from_name: 'Academic Partner',
      from_email: 'partner@manjalpur.edu',
      subject: 'Manjalpur review · 4 PM',
      preview: 'Can we meet today at 4 PM for 30 minutes to review the academic partner RFP?',
      content: 'Can we meet today at 4 PM for 30 minutes to review the academic partner RFP? Please bring the earlier minutes and the latest proposal.',
      kind: 'meeting',
      draft: 'Yes, 4:00–4:30 PM works. I will bring the latest proposal and previous minutes.',
      confidence: 'High',
      scope: 'work',
    },
    {
      account_id: account.id,
      provider_msg_id: 'msg_e3',
      from_name: 'Community Newsletter',
      from_email: 'news@community.org',
      subject: 'Your weekly updates',
      preview: 'Highlights, offers, articles and announcements.',
      content: 'Weekly updates about articles and offers. No explicit action requested.',
      kind: 'noise',
      draft: '',
      confidence: 'High',
      scope: 'personal',
    },
    {
      account_id: account.id,
      provider_msg_id: 'msg_e4',
      from_name: 'Sports Equipment Supplier',
      from_email: 'supplier@sportsgear.com',
      subject: 'Updated equipment quotation',
      preview: 'Please review the revised quotation before Monday.',
      content: 'Attached is the updated quotation. Please review and revert before Monday. The price changed from the earlier version.',
      kind: 'task',
      draft: 'I will compare the updated quotation with the previous version and respond.',
      confidence: 'High',
      scope: 'work',
    },
  ];

  for (const email of demoEmails) {
    const { data: insertedEmail } = await supabase
      .from('emails')
      .upsert(email, { onConflict: 'account_id,provider_msg_id' })
      .select()
      .single();

    if (insertedEmail) {
      // Add matching proposal
      if (email.provider_msg_id === 'msg_e1') {
        await supabase.from('proposals').upsert({
          email_id: insertedEmail.id,
          user_id: userId,
          type: 'task',
          title: 'Share revised AKC calendar',
          start_time: '14:00',
          end_time: '14:30',
          detail: 'Regional qualifier calendar · requested by AKC team',
          sources: ['w1', 'e1'],
          confidence: 'High',
          evidence: 'Please send the updated regional qualifier calendar today by 2:30 PM.',
          context: 'KinderSports · AKC',
          status: 'pending',
        });
      } else if (email.provider_msg_id === 'msg_e2') {
        await supabase.from('proposals').upsert({
          email_id: insertedEmail.id,
          user_id: userId,
          type: 'meeting',
          title: 'Manjalpur academic partner review',
          start_time: '16:00',
          end_time: '16:30',
          detail: 'Bring earlier minutes and latest RFP',
          sources: ['w2', 'e2'],
          confidence: 'High',
          evidence: 'Can we meet today at 4 PM for 30 minutes to review the academic partner RFP?',
          context: 'KinderSports · Manjalpur',
          status: 'pending',
        });
      } else if (email.provider_msg_id === 'msg_e4') {
        await supabase.from('proposals').upsert({
          email_id: insertedEmail.id,
          user_id: userId,
          type: 'task',
          title: 'Compare equipment quotation',
          start_time: '17:00',
          end_time: '17:30',
          detail: 'Compare latest quotation against prior estimate',
          sources: ['e4'],
          confidence: 'High',
          evidence: 'Please review the revised quotation before Monday.',
          context: 'KinderSports · Procurement',
          status: 'pending',
        });
      }
    }
  }

  console.log('[Seed] Demo emails & proposals seeded successfully.');
}
