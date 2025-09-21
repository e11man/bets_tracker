# Bets Tracker - Trading & Sports Betting Analytics

A comprehensive Next.js application for tracking sports bets and day trading activities with detailed analytics and ROI calculations.

## Features

- **Sports Betting Tracking**: Track your sports bets with detailed analytics
- **Day Trading Tracking**: Monitor your stock trades and performance
- **ROI Analytics**: Calculate returns on investment with projections
- **Interactive Dashboard**: Modern, responsive UI with real-time data
- **Supabase Integration**: Cloud database for data persistence

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase
- **Deployment**: Vercel

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create bets table
CREATE TABLE bets (
  id SERIAL PRIMARY KEY,
  team_or_player VARCHAR(255) NOT NULL,
  sportsbook VARCHAR(255) NOT NULL,
  result VARCHAR(20) DEFAULT 'pending',
  stake DECIMAL(10,2) NOT NULL,
  odds DECIMAL(10,2) NOT NULL,
  bet_amount VARCHAR(255),
  potential_payout DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stocks table
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  action VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  trade_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Development
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
npm start
```

## Deployment on Vercel

### Method 1: Via Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Method 2: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── bet-tracking/      # Betting components
│   ├── stock-tracking/    # Trading components
│   └── shared components
└── lib/
    └── supabase.ts        # Supabase client config
```

## Troubleshooting

### Build Errors
- Ensure all TypeScript types are properly defined
- Check that environment variables are set
- Verify Supabase connection

### Deployment Issues
- Make sure environment variables are configured in Vercel
- Check build logs for specific errors
- Ensure database tables are created

### Database Connection
- Verify Supabase URL and API key
- Check database table structure
- Ensure RLS policies are configured if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.