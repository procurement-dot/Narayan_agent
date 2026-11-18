import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { WorkProject } from './work.types.js';

let sipsClient: SupabaseClient | null = null;
let lastAuthTime = 0;
const AUTH_CACHE_MS = 30 * 60 * 1000; // 30 minutes cache

async function getAuthenticatedClient(): Promise<SupabaseClient | null> {
  const url = env.SIPS_SUPABASE_URL;
  const key = env.SIPS_SUPABASE_KEY;
  const email = env.SIPS_EMAIL;
  const password = env.SIPS_PASSWORD;

  if (!url || !key || !email || !password) {
    return null;
  }

  const now = Date.now();
  if (sipsClient && (now - lastAuthTime < AUTH_CACHE_MS)) {
    return sipsClient;
  }

  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      },
    });

    // Authenticate with SIPS (Strictly Read-Only usage)
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('[SIPS Service] Login failed:', error.message);
      return null;
    }

    sipsClient = client;
    lastAuthTime = now;
    return sipsClient;
  } catch (err: any) {
    console.warn('[SIPS Service] Connection failed:', err.message);
    return null;
  }
}

export interface SipsMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalValue: number;
  totalValueDisplay: string;
  latestUpdate: string;
}

export const sipsService = {
  /**
   * Fetch all real projects from SIPS (Strictly Read-Only)
   */
  async getProjects(): Promise<WorkProject[]> {
    try {
      const client = await getAuthenticatedClient();
      if (!client) return [];

      // 1. Fetch projects (READ-ONLY)
      const { data: rawProjects, error: projError } = await client
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projError || !rawProjects) {
        console.warn('[SIPS Service] Projects select error:', projError?.message);
        return [];
      }

      // 2. Fetch project tasks (READ-ONLY)
      let allTasks: any[] = [];
      try {
        const { data: tasksData } = await client
          .from('project_tasks')
          .select('id, project_id, title, is_done, status, created_at');
        allTasks = tasksData || [];
      } catch (tErr) {
        // Non-blocking
      }

      // 3. Transform to NRYN WorkProject format
      const mapped: WorkProject[] = rawProjects.map((p: any) => {
        const progress = Math.min(100, Math.max(0, Math.round(Number(p.progress_pct || 0))));
        const isCompleted = progress >= 100 || p.status === 'completed';

        let nextAction = 'Review site execution';
        if (isCompleted) {
          nextAction = 'Project completed · Site handed over';
        } else if (p.end_date && new Date(p.end_date).getTime() < Date.now()) {
          nextAction = 'Milestone review · Contractor delay follow-up';
        } else if (p.location) {
          nextAction = `Site review at ${p.location}`;
        }

        const numericVal = Number(p.contract_value || 0);
        const budgetDisplay = numericVal > 0
          ? (numericVal >= 10000000
              ? `₹${(numericVal / 10000000).toFixed(2)} Cr`
              : `₹${(numericVal / 100000).toFixed(2)} L`)
          : '₹0';

        const projectTasks = allTasks
          .filter((t) => t.project_id === p.id)
          .map((t) => ({
            id: `sips-t-${t.id}`,
            title: t.title || 'Site milestone task',
            is_completed: Boolean(t.is_done || t.status === 'done'),
          }));

        return {
          id: `sips-${p.id}`,
          name: p.name || 'Sports Infrastructure Project',
          subtitle: `${p.location || 'Civil Site'}${p.sport_type ? ` · ${p.sport_type}` : ''}`,
          tag: p.sport_type ? p.sport_type.toUpperCase() : 'Civil Infra',
          progress,
          next_action: nextAction,
          owner: p.project_manager || 'SIPS Operations',
          budget: budgetDisplay,
          status: isCompleted ? 'completed' : 'active',
          tasks: projectTasks,
        };
      });

      return mapped;
    } catch (err: any) {
      console.warn('[SIPS Service] getProjects failed (graceful fallback):', err.message);
      return [];
    }
  },

  /**
   * Compute live summary metrics for SIPS card on NRYN Overview
   */
  async getSummaryMetrics(): Promise<SipsMetrics | null> {
    try {
      const client = await getAuthenticatedClient();
      if (!client) return null;

      const { data: projects, error } = await client.from('projects').select('*');
      if (error) {
        console.warn('[SIPS Service] getSummaryMetrics error:', error.message);
        return null;
      }
      if (!projects || projects.length === 0) return null;

      const totalProjects = projects.length;
      let activeProjects = 0;
      let completedProjects = 0;
      let delayedProjects = 0;
      let totalValue = 0;

      for (const p of projects) {
        const pct = Number(p.progress_pct || 0);
        const isDone = pct >= 100 || p.status === 'completed';
        if (isDone) {
          completedProjects++;
        } else {
          activeProjects++;
          if (p.end_date && new Date(p.end_date).getTime() < Date.now()) {
            delayedProjects++;
          }
        }
        totalValue += Number(p.contract_value || 0);
      }

      const totalValueDisplay = totalValue >= 10000000
        ? `₹${(totalValue / 10000000).toFixed(2)} Cr`
        : `₹${(totalValue / 100000).toFixed(2)} L`;

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        delayedProjects,
        totalValue,
        totalValueDisplay,
        latestUpdate: `${activeProjects} active sites · ${completedProjects} completed · Live Supabase pulse`,
      };
    } catch {
      return null;
    }
  },
};
