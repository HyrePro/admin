# Candidate Funnel Analytics: Recruiter Guide

## What this module answers
- Where candidates drop in the submit-to-next-step flow.
- Which jobs have the highest drop-off risk.
- Which browser/device combinations show the most failures.
- Candidate-level event timelines for support follow-up.

## How to use it quickly
1. Open `/analytics/candidate-funnel`.
2. Keep default last 7 days to start.
3. Sort **Job-Level Friction** by **Drop-off %** (default).
4. Open **Candidate-Level Issues** and click **Timeline** on a high-failure candidate.
5. In the drawer, identify the exact failure event (`form_submit_failed`, `redirect_failed`, `route_guard_blocked`).
6. Use **Copy debug summary** and share it with support/engineering.

## Typical support workflow
1. Filter by job and date range for the reported issue period.
2. Filter by browser/device if issue appears platform-specific.
3. Inspect candidate timeline and pinpoint the first failing event.
4. Cross-check browser/device issue table for pattern volume.
5. Escalate with copied debug summary and timestamped event details.

## Notes
- Data is read-only.
- Candidate identifiers are masked in UI.
- This dashboard is school-scoped for school roles.
