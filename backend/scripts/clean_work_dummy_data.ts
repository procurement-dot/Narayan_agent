import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function clean() {
  if (!connectionString) {
    console.error('No connection string found.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    // Truncate dummy data in work module tables
    console.log('Cleaning dummy records from work module tables...');
    await client.query(`
      TRUNCATE TABLE 
        work_project_tasks, 
        work_projects, 
        work_invoices, 
        work_deals, 
        work_team_ops, 
        work_ea_signals 
      CASCADE;
    `);

    // Reset external apps to clean live connection status
    await client.query(`
      UPDATE work_external_apps 
      SET 
        summary_metrics = '{"activeProjects": 0, "onTrack": 0, "delayed": 0, "latestUpdate": "Live portal connected"}'::jsonb
      WHERE app_key = 'infra_tracker';

      UPDATE work_external_apps 
      SET 
        deploy_url = '',
        status = 'ready',
        summary_metrics = '{"activeModules": 0, "pendingApprovals": 0, "latestUpdate": "Connect your deployed link to view live pulse"}'::jsonb
      WHERE app_key = 'second_app';
    `);

    console.log('All dummy data cleared from PostgreSQL successfully!');
  } catch (err: any) {
    console.error('Error cleaning database:', err.message);
  } finally {
    await client.end();
  }
}

clean();
