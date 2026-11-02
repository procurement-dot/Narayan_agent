# NRYN Personal AI Assistant — Full Application Architecture

This project is a React Native (Expo) & Node.js/Express (Supabase) rebuild of the **NRYN V6.9** personal AI assistant, fully modularized and structured from scratch.

---

## 📁 Workspace Structure

```text
Narayan_Agent/
├── frontend/                     # React Native Expo App (TypeScript)
│   ├── src/
│   │   ├── app/                  # Expo Router layout & screens
│   │   │   ├── _layout.tsx       # Root layout with SafeArea & ToastProvider
│   │   │   └── index.tsx         # Space switcher & shell container
│   │   ├── features/             # All 13 Spaces + Navigation + Chat
│   │   │   ├── calendar/         # 1. 24-Hour Rolling Clock, Day/Month view, Add task
│   │   │   ├── kickstart/        # 2. Morning Briefing: Audio player, Weather, News, Astrology
│   │   │   ├── health/           # 3. Health & Coach: Vitals, Marathon 42k plan, Goals, Journal
│   │   │   ├── people/           # 4. People: Contact memory, WhatsApp context, Reply drafts
│   │   │   ├── email/            # 5. Email: Needs me, Meetings, Drafts, Proposal review
│   │   │   ├── finance/          # 6. Money: ₹5.03 Cr Net worth, Assets, Lending, Retirement
│   │   │   ├── work/             # 7. Work & EA: AKC (58%), Manjalpur (36%), KPIs, EA signals
│   │   │   ├── prayan/           # 8. Prayan: Speedcubing (14.82s PB), Maker ideas, Parenting
│   │   │   ├── travel/           # 9. Travel: Goa trip, Pune-Delhi flight alert, Tatkal assistant
│   │   │   ├── spirit/           # 10. Spirituality: Private scratchpad, Teachers, Meditation ring
│   │   │   ├── growth/           # 11. Better Me: Skill pathways, Habit schedule, Self-assessment
│   │   │   ├── notes/            # 12. Gallery/Notes: Work, Prayan, Health, Quick capture sheet
│   │   │   ├── settings/         # 13. Settings: Gmail/WhatsApp connections, AI models, Usage ledger
│   │   │   ├── chat/             # Ask NRYN Assistant: Floating ✳ sparkle button & AI sheet
│   │   │   └── navigation/       # Dock.tsx (13 spaces rail), AppHeader.tsx, BottomBar.tsx
│   │   └── shared/               # Reusable tokens, theme, Card, PillTabs, BottomSheet, Toast
│   └── package.json
│
├── backend/                      # Node.js + Express + Supabase API
│   ├── src/
│   │   ├── config/               # Supabase client, Zod env validation
│   │   ├── db/                   # PostgreSQL migrations & seed data
│   │   ├── features/
│   │   │   └── email/            # DTOs, Repository, Service, Controller, Routes
│   │   ├── shared/               # Crypto (AES-256-GCM), errors
│   │   ├── app.ts                # Express app configuration
│   │   └── server.ts             # Server entry point (Port 4000)
│   ├── .env                      # Environment variables template
│   └── package.json
│
└── reference/
    └── nryn-v6.9.html            # Original 438 KB single-file prototype reference
```

---

## 🚀 How to Run & Test

### 1. Frontend (Mobile App / Browser)

Navigate into `frontend/` and install dependencies:
```bash
cd frontend
npm install
```

Start the Expo development server:
```bash
npm run start
```

* **To test in Chrome / Edge (Instant):** Press `w` in the terminal to open the web view.
* **To test on your phone:** Install the **Expo Go** app on your iPhone or Android, and scan the QR code printed in the terminal.

---

## 🧩 The 13 Spaces in NRYN

| Space | View ID | Features & Interactive Elements |
|---|---|---|
| **Calendar** | `today` | Rolling 24-hr day rhythm, timeline events, Day/Month view toggle, `+ Add task` modal. |
| **Kickstart** | `kickstart` | 3-minute audio briefing card (Play/Pause), timeline items (Weather, News, Astrology). |
| **Health** | `health` | Resting HR (52 bpm), 7h 25m sleep, 12-week marathon plan, Vitals profile, Journal reflection. |
| **People** | `inbox` | Relationships (Neha, Prayan, Abhijit), WhatsApp intelligence with suggested reply drafts. |
| **Email** | `email` | Needs me, Meetings, All, Low signal, Drafts, Extracted action approval, Trust footer. |
| **Money** | `finance` | ₹5.03 Cr Net worth, Real estate assets with rental yield, Lending portfolio, Retirement runway. |
| **Work** | `work` | Executive KPIs, Active projects (AKC Cup, Manjalpur Sports School), EA extracted signals. |
| **Prayan** | `prayan` | Child development space: 3x3 Speedcubing PBs (14.82s), maker robotics, parenting inquiry. |
| **Travel** | `travel` | Winter Goa trip, Pune-Delhi flight price watcher, Passport renewal alerts, Tatkal assistant. |
| **Spirituality** | `spirit` | Private scratchpad with "Erase, leave no trace", Teachers (Krishnamurti, Osho), Meditation timer ring. |
| **Better Me** | `growth` | Skill pathways (AI Product Design, Systems Thinking), deliberate habit practice tracker. |
| **Notes** | `notes` | Local knowledge archive, categorized by space (Work, Prayan, Health), `+ Capture thought` modal. |
| **Settings** | `settings` | Provider connections (Gmail, WhatsApp, Calendar), AI Model picker, Token usage ledger. |

---

## 🔌 How to Connect Real Data Later

Every feature folder has a dedicated pattern:
- `*.mock.ts`: Holds the sample data matching the original design.
- `*.store.ts`: Zustand store managing local state and actions.

When you are ready to connect real backend endpoints to any space:
1. Create the backend endpoint in `backend/src/features/<module>/` (e.g. `GET /api/calendar/events`).
2. In `frontend/src/features/<module>/`, replace the mock initialization in the store with an API call using `client.ts` (`axios` or `react-query`).
3. The UI components remain **100% untouched** because they rely purely on the strongly-typed interfaces in `*.types.ts`!
