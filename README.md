# Quire Study Planner

A study planner that fits homework, reading, past papers and test preparation around your classes and the hours you're free.

## What it does

- **Timetable**: import your classes from a Google Sheets link, an Excel or CSV file, or cells pasted from Google Sheets. Any layout works. Free time is worked out from your classes and a few simple rules (time to get home, dinner, when you stop for the night).
- **Homework**: add what's due, when, and how long it will take. The planner splits it into sessions that finish the day before it's due.
- **Daily habits**: 15 minutes of reading and 15 minutes of past papers every day. Past papers follow the subject of your next test.
- **Tests**: each test gets a total amount of study, spread over the lead-up and building towards the test. Sciences and maths get 5 hours starting 14 days before, humanities 4 hours from 7 days before, and languages 3 hours from 5 days before. Exams get 50% more. You can change the hours for any test, or the defaults for each subject.
- **School holidays**: paste the list from a school circular, link a Google Sheet, or upload Excel, CSV or .ics. Holidays have no classes and become full study days in the plan.
- **Calendar**: Day and Week views of classes, tests, events and planned sessions, with free time shaded. Click any empty time to add an event on that day: a one-off, every week, a holiday (no classes) or a day away. The plan moves around it.
- **Study plan**: every day is filled up to a study target (90 minutes on school days, 3 hours on days off, both adjustable). Homework is spread evenly before each deadline, tests get daily prep, and the remaining time goes to revision sessions for the subjects that need it most: the ones with tests coming up, lower readiness, or not studied recently.
- **Session timers**: every planned session has its own Start button on the dashboard and calendar. A bar along the bottom keeps the timer visible on every page. When it ends, the session is marked done and the time is logged. Focus mode gives a full-screen timer.
- **Assistant**: the “Ask Quire” button opens a chat. Tell it about changes in plain words (“football Saturday 4 to 6”, “no tuition tomorrow”, “Friday is a holiday”, “biology test on 3 Nov”, “maths homework due Friday, 45 min”) or ask about your plan (“what should I study now?”). Every change is shown for you to confirm, and can be undone. With the assistant service set up (below), it also answers study questions.
- **Progress**: weekly hours, time per subject, a habit streak and a revision checklist.
- **Accounts**: email and password sign-in through Supabase. Each student's planner is private and syncs across devices.

If a piece of work can't fit into your free time, the dashboard says so.

## Timetable CSV format

```
Day,Start,End,Subject,Room
Mon,08:00,08:45,Mathematics,Room 12
Tue,13:30,14:15,Physics,Lab 2
```

- Days can be written as `Mon`, `Monday` or `1` to `7`, where 1 is Monday.
- Times can be written as `08:00`, `8.00` or `2pm`.
- The Room column is optional.

A ready-made file is in [`timetable-template.csv`](timetable-template.csv).

## Setting up accounts (once)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of [`supabase-setup.sql`](supabase-setup.sql).
3. In **Authentication → URL Configuration**, set **Site URL** to the address of this site, for example `https://USERNAME.github.io/study-planner/`. This makes the confirmation and password-reset emails link back here.
4. Copy the **Project URL** and **anon public** key from **Project Settings → API** into [`config.js`](config.js).

Optional: to let people sign in without confirming their email, turn off **Confirm email** under **Authentication → Providers → Email**.

If `config.js` is left empty, the site still works, but without accounts. Data is then saved only in the browser on that device.

## Hosting on GitHub Pages

In the repository, go to **Settings → Pages**. Choose **Deploy from a branch**, select `main` and `/ (root)`, then click **Save**. The site appears at `https://USERNAME.github.io/REPOSITORY/` within a minute or two.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `styles.css` | Design: navy, white, warm off-white and muted gold; square corners and hairline rules |
| `app.js` | The app, including the planner and sign-in |
| `config.js` | Supabase connection details |
| `supabase-setup.sql` | Database table and privacy rules |
| `timetable-template.csv` | Example timetable to fill in |

## Turning on study questions in the assistant (optional)

Schedule changes work straight away. To let the assistant answer subject doubts, it needs an AI service. This uses an Anthropic API key, which is billed per message, so it runs on the server and the key never reaches the browser.

1. Set up accounts first (see above).
2. Get an API key at [console.anthropic.com](https://console.anthropic.com) (Settings → API keys). Add a small amount of credit and, if you like, a monthly spend limit.
3. In Supabase, open **Edge Functions → Secrets** and add:
   - `ANTHROPIC_API_KEY`: your key
   - `ALLOWED_EMAILS` (recommended): the email addresses allowed to use the assistant, separated by commas, so other people who sign up can't run up charges
4. Open **Edge Functions → Deploy a new function → Via editor**, name it `assistant`, paste the contents of [`supabase/functions/assistant/index.ts`](supabase/functions/assistant/index.ts) and deploy. Leave **Verify JWT** switched on.

Once that's done, sign in to the site and the assistant answers study questions too.
