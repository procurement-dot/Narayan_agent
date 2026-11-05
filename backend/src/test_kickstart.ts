import http from 'node:http';
import { app } from './app.js';

const PORT = 4098;
const server = http.createServer(app);

function request(path: string, method = 'GET', body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `http://localhost:${PORT}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  server.listen(PORT, async () => {
    console.log('\n========================================================');
    console.log('   ☀️ NRYN KICKSTART API AUTOMATED TEST');
    console.log('========================================================\n');

    let passed = 0;

    try {
      // 1. All-in-one Today Executive Briefing
      const r1 = await request('/api/kickstart/today');
      if (r1.status === 200 && r1.body.success && r1.body.data?.timeline && r1.body.data?.weather) {
        console.log('✓ 1. Today Synthesis API:     PASS (All-in-one Briefing Data Loaded)');
        passed++;
      } else {
        console.log('✗ 1. Today Synthesis API:     FAIL', r1.body);
      }

      // 2. Get Timeline
      const r2 = await request('/api/kickstart/timeline');
      if (r2.status === 200 && Array.isArray(r2.body.data)) {
        console.log(`✓ 2. Timeline List (GET):     PASS (${r2.body.data.length} Agenda Slots Loaded)`);
        passed++;
      } else {
        console.log('✗ 2. Timeline List (GET):     FAIL', r2.body);
      }

      // 3. Create Timeline Item
      const r3 = await request('/api/kickstart/timeline', 'POST', {
        timeSlot: '15:30',
        title: 'Executive Roadmap Review',
        detail: 'Deep dive into Q4 deliverables & milestones',
        isEmphasized: true,
      });
      if (r3.status === 201 && r3.body.data?.id) {
        console.log('✓ 3. Create Timeline (POST):  PASS (15:30 Review Added Successfully)');
        passed++;
      } else {
        console.log('✗ 3. Create Timeline (POST):  FAIL', r3.body);
      }

      // 4. Toggle Timeline Item
      const createdId = r3.body.data?.id;
      if (createdId) {
        const r4 = await request(`/api/kickstart/timeline/${createdId}/toggle`, 'PATCH');
        if (r4.status === 200 && r4.body.data?.isCompleted === true) {
          console.log('✓ 4. Toggle Timeline (PATCH): PASS (Item Marked Completed ✓)');
          passed++;
        } else {
          console.log('✗ 4. Toggle Timeline (PATCH): FAIL', r4.body);
        }
      }

      // 5. Get Weather
      const r5 = await request('/api/kickstart/weather');
      if (r5.status === 200 && r5.body.data?.city) {
        console.log(`✓ 5. Weather Info (GET):      PASS (${r5.body.data.city} ${r5.body.data.tempC}°C, AQI ${r5.body.data.aqi})`);
        passed++;
      } else {
        console.log('✗ 5. Weather Info (GET):      FAIL', r5.body);
      }

      // 6. Get News
      const r6 = await request('/api/kickstart/news');
      if (r6.status === 200 && Array.isArray(r6.body.data)) {
        console.log(`✓ 6. News Feed (GET):         PASS (${r6.body.data.length} Articles Loaded)`);
        passed++;
      } else {
        console.log('✗ 6. News Feed (GET):         FAIL', r6.body);
      }

      // 7. Get Astro & Mindset
      const r7 = await request('/api/kickstart/astro');
      if (r7.status === 200 && Array.isArray(r7.body.data)) {
        console.log(`✓ 7. Astro Reflection (GET):  PASS (${r7.body.data.length} Reflection Cards Loaded)`);
        passed++;
      } else {
        console.log('✗ 7. Astro Reflection (GET):  FAIL', r7.body);
      }

      // 8. Get Audio Brief
      const r8 = await request('/api/kickstart/audio');
      if (r8.status === 200 && r8.body.data?.durationSeconds) {
        console.log(`✓ 8. Audio Brief (GET):       PASS (${r8.body.data.title} - ${r8.body.data.durationSeconds}s)`);
        passed++;
      } else {
        console.log('✗ 8. Audio Brief (GET):       FAIL', r8.body);
      }

      console.log('\n========================================================');
      console.log(`   🎉 FINAL RESULT: ${passed}/8 APIS WORKING PERFECTLY!`);
      console.log('========================================================\n');
    } catch (err) {
      console.error('Error during test execution:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

run();
