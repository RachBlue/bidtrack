# ⬧ BidTrack
### AI-Powered Commercial Construction Bid Pipeline

> Stop underbidding. Stop losing track of leads. Win more commercial contracts.

BidTrack is a mobile-first SaaS application built for commercial construction companies to manage their entire bid pipeline — from first contact to signed contract — with an AI cost estimator that uses real regional market data to help contractors bid confidently and profitably.

---

## 🚀 Live App

**[bidtrack-seven.vercel.app](https://bidtrack-seven.vercel.app)**

---

## 📱 Features

### Bid Pipeline Management
- Track every active bid through stages: Prospect → Qualified → Bidding → Won → Lost
- Mobile-optimized card layout with bottom sheet interactions
- Urgent deadline alerts for bids due within 5 days
- Filter by stage, add notes, move bids with one tap

### AI Cost Estimator
- Input project type, square footage, ZIP code, and quality level
- Get a full cost breakdown: materials, labor, overhead & profit
- Low / mid / high bid range with cost per sqft
- Competitor price range based on regional market data
- Bid recommendation to win without underbidding
- Risk factor warnings specific to the project type and location

### Stats Dashboard
- Weighted pipeline value across all active bids
- Revenue won, win rate, and total bids tracked
- Stage breakdown with visual progress bars

### PDF Export
- One-tap pipeline report generation
- Clean printable format with full bid table and summary stats
- Share with partners, investors, or your team instantly

### Multi-User & Secure
- Email/password authentication via Supabase Auth
- Each company's data is fully isolated with Row Level Security
- Cloud database — data syncs across all devices in real time
- Anthropic API key protected via server-side Vercel Function proxy

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Inline CSS (mobile-first) |
| Auth & Database | Supabase (PostgreSQL + RLS) |
| AI Estimator | Anthropic Claude API (claude-sonnet-4-20250514) |
| Hosting | Vercel |
| Serverless Functions | Vercel API Routes |
| Payments (roadmap) | Stripe |

---

## 🖥 Local Setup

### Prerequisites
- Node.js 18+
- A Supabase account (free)
- An Anthropic API account

### 1. Clone the repo
```bash
git clone https://github.com/RachBlue/bidtrack.git
cd bidtrack/bidtrack
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the `bidtrack` folder:
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 4. Set up the Supabase database
Run this SQL in your Supabase SQL Editor:
```sql
create table leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  project text not null,
  client text not null,
  contact text,
  value numeric default 0,
  win_prob integer default 30,
  type text default 'Office',
  stage text default 'Prospect',
  due_date text,
  last_touch text,
  notes text,
  created_at timestamp default now()
);

alter table leads enable row level security;

create policy "Users can manage their own leads"
on leads for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 5. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## 🗺 Roadmap

| Feature | Status |
|---------|--------|
| Bid pipeline management | ✅ Live |
| AI cost estimator | ✅ Live |
| Multi-user authentication | ✅ Live |
| PDF export | ✅ Live |
| Mobile optimized | ✅ Live |
| Custom domain | 🔜 In Progress |
| Landing page | 🔜 In Progress |
| Stripe subscription billing | 🔜 Planned |
| White-label branding per company | 🔜 Planned |
| Team collaboration & shared pipelines | 🔜 Planned |
| Subcontractor management | 🔜 Planned |
| Integration with Procore / Buildertrend | 🔜 Planned |

---

## 💡 The Problem We Solve

Commercial construction companies lose money in two ways:

1. **Underbidding** — not knowing current local market rates leads to winning jobs that lose money
2. **Pipeline chaos** — bids tracked in spreadsheets or memory means dropped leads and missed deadlines

BidTrack solves both with a purpose-built tool that fits in a contractor's pocket.

---

## 📄 License

Private — All rights reserved © 2026 BidTrack