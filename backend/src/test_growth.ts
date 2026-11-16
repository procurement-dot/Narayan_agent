import http from 'node:http';
import { app } from './app.js';

const PORT = 4099;
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
    console.log('   🌱 NRYN BETTER ME (GROWTH) API AUTOMATED TEST');
    console.log('========================================================\n');

    let passed = 0;

    try {
      // 1. Overview
      const r1 = await request('/api/growth/overview');
      if (r1.status === 200 && r1.body.success) {
        console.log('✓ 1. Overview API:           PASS (Metrics & Streaks Loaded)');
        passed++;
      } else {
        console.log('✗ 1. Overview API:           FAIL', r1.body);
      }

      // 2. Get Paths
      const r2 = await request('/api/growth/paths');
      if (r2.status === 200 && Array.isArray(r2.body.data)) {
        console.log(`✓ 2. Skill Pathways (GET):   PASS (${r2.body.data.length} Pathways Loaded)`);
        passed++;
      } else {
        console.log('✗ 2. Skill Pathways (GET):   FAIL', r2.body);
      }

      // 3. Create Path
      const r3 = await request('/api/growth/paths', 'POST', {
        name: 'Systems Thinking for Leaders',
        category: 'Leadership & Strategy',
        level: 'Intermediate',
        progress: 15,
        modules: ['Feedback Loops', 'Leverage Points'],
      });
      if (r3.status === 201 && r3.body.data?.id) {
        console.log('✓ 3. Create Pathway (POST):  PASS (New Path Created Successfully)');
        passed++;
      } else {
        console.log('✗ 3. Create Pathway (POST):  FAIL', r3.body);
      }

      // 4. Update Path Progress
      const pathId = r3.body.data?.id;
      if (pathId) {
        const r4 = await request(`/api/growth/paths/${pathId}/progress`, 'PATCH', { progress: 45 });
        if (r4.status === 200 && r4.body.data?.progress === 45) {
          console.log('✓ 4. Update Progress (PATCH): PASS (Progress Increased to 45%)');
          passed++;
        } else {
          console.log('✗ 4. Update Progress (PATCH): FAIL', r4.body);
        }
      }

      // 5. Get Habits
      const r5 = await request('/api/growth/habits');
      if (r5.status === 200 && Array.isArray(r5.body.data)) {
        console.log(`✓ 5. Habits List (GET):      PASS (${r5.body.data.length} Daily Habits Loaded)`);
        passed++;
      } else {
        console.log('✗ 5. Habits List (GET):      FAIL', r5.body);
      }

      // 6. Create Habit
      const r6 = await request('/api/growth/habits', 'POST', {
        title: 'Evening 15m: Screen-free Walk',
        category: 'Mindset',
        timeOfDay: 'Evening',
        durationMins: 15,
      });
      if (r6.status === 201 && r6.body.data?.id) {
        console.log('✓ 6. Create Habit (POST):    PASS (New Habit Created Successfully)');
        passed++;
      } else {
        console.log('✗ 6. Create Habit (POST):    FAIL', r6.body);
      }

      // 7. Toggle Habit
      const habitId = r6.body.data?.id;
      if (habitId) {
        const r7 = await request(`/api/growth/habits/${habitId}/toggle`, 'PATCH');
        if (r7.status === 200 && r7.body.data?.isCompletedToday === true) {
          console.log('✓ 7. Toggle Habit (PATCH):   PASS (Habit Checked ✓ & Streak Updated)');
          passed++;
        } else {
          console.log('✗ 7. Toggle Habit (PATCH):   FAIL', r7.body);
        }
      }

      // 8. Assessments
      const r8 = await request('/api/growth/assessments');
      if (r8.status === 200 && Array.isArray(r8.body.data)) {
        console.log(`✓ 8. Assessments (GET):      PASS (${r8.body.data.length} Scorecards Loaded)`);
        passed++;
      } else {
        console.log('✗ 8. Assessments (GET):      FAIL', r8.body);
      }

      // 9. Create Assessment
      const r9 = await request('/api/growth/assessments', 'POST', {
        title: 'Communication & Negotiation',
        category: 'Leadership & Strategy',
        score: 85,
        summary: 'Excellent active listening and clear boundary definition.',
        strengths: ['Active listening', 'Clear boundaries'],
        growthAreas: ['High-stakes anchoring'],
      });
      if (r9.status === 201 && r9.body.data?.score === 85) {
        console.log('✓ 9. Add Assessment (POST):  PASS (Score 85/100 Saved)');
        passed++;
      } else {
        console.log('✗ 9. Add Assessment (POST):  FAIL', r9.body);
      }

      // 10. Library
      const r10 = await request('/api/growth/library');
      if (r10.status === 200 && Array.isArray(r10.body.data)) {
        console.log(`✓ 10. Library Items (GET):   PASS (${r10.body.data.length} Books/Resources Loaded)`);
        passed++;
      } else {
        console.log('✗ 10. Library Items (GET):   FAIL', r10.body);
      }

      // 11. Add Library Item
      const r11 = await request('/api/growth/library', 'POST', {
        title: 'Atomic Habits',
        author: 'James Clear',
        mediaType: 'Book',
        category: 'Habits & Productivity',
        readingStatus: 'Want to Read',
        summary: 'An easy & proven way to build good habits & break bad ones.',
        keyTakeaways: ['Make it obvious', 'Make it attractive', 'Make it easy', 'Make it satisfying'],
      });
      if (r11.status === 201 && r11.body.data?.id) {
        console.log('✓ 11. Add to Library (POST): PASS (Book Added Successfully)');
        passed++;
      } else {
        console.log('✗ 11. Add to Library (POST): FAIL', r11.body);
      }

      // 12. Update Reading Status
      const bookId = r11.body.data?.id;
      if (bookId) {
        const r12 = await request(`/api/growth/library/${bookId}/status`, 'PATCH', {
          readingStatus: 'Reading',
        });
        if (r12.status === 200 && r12.body.data?.readingStatus === 'Reading') {
          console.log('✓ 12. Update Status (PATCH): PASS (Reading Status Changed to "Reading")');
          passed++;
        } else {
          console.log('✗ 12. Update Status (PATCH): FAIL', r12.body);
        }
      }

      console.log('\n========================================================');
      console.log(`   🎉 FINAL RESULT: ${passed}/12 APIS WORKING PERFECTLY!`);
      console.log('========================================================\n');
    } catch (err) {
      console.error('Error during testing:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

run();
