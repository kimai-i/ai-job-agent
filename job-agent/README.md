# Job agent data folder

Used by the `job-hunt` skill (`.claude/skills/job-hunt/SKILL.md`).

| Path | Purpose | In Git? |
|---|---|---|
| `MASTER_PROMPT.md` | Owner's job-hunting rules and profile (contains contact details) | No |
| `queue/*.json` | Jobs reviewed by the agent, waiting to be imported | No |
| `queue/processed/` | Imported queue files (kept as an audit trail) | No |
| `state/known-jobs.json` | Snapshot of the tracker, used to skip duplicates | No |

## How records reach Supabase

The agent never talks to Supabase directly and never needs a secret key.
When the signed-in owner opens the Dashboard or Job Applications page, the app
calls `POST /api/tracker/sync`, which imports every queue file using the owner's
session (Row Level Security applies), moves imported files to `queue/processed/`,
and rewrites `state/known-jobs.json`.

## Queue file format

A JSON array of job objects (or `{ "jobs": [...] }`). Keys are database column
names. Required: `platform`, `job_posting_title`, `link`.

```json
[
  {
    "platform": "OnlineJobs.ph",
    "job_posting_title": "Local SEO Specialist",
    "link": "https://www.onlinejobs.ph/jobseekers/job/local-seo-specialist-1234567",
    "client_name": "Example Plumbing Co.",
    "job_type": "Full-time",
    "rate": "$6/hour",
    "time_zone": "EST",
    "status": "Pending Review",
    "posting_date": "2026-10-12",
    "date_applied": null,
    "ai_match_score": 86,
    "expected_rate": "$8/hour ($1,408/month)",
    "olj_points": null,
    "application_method": "OnlineJobs.ph",
    "application_instructions": "Start the cover letter with the word 'Pipeline'.",
    "email_subject": "Application for Local SEO Specialist | Kim Bandola",
    "cover_letter": "…",
    "portfolio_url": "https://kimbandola-seo-specialist.vercel.app/",
    "resume_url": "https://kimbandola-seo-specialist.vercel.app/resume",
    "case_study_url": "https://kimbandola-seo-specialist.vercel.app/projects",
    "qualification_notes": "JOB ELIGIBILITY REVIEW …",
    "job_description": "…",
    "rejection_reason": null,
    "video_required": false,
    "references_required": false,
    "submission_evidence": null
  }
]
```

Re-queuing a job with the same link updates the existing row instead of
creating a duplicate. A submitted job (Applied or later) is never moved back to
an earlier status by a re-import.
