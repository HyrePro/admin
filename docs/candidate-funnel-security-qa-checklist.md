# Candidate Funnel Scoped-Access QA Checklist

## Access Control
- [ ] Login as school user A. Open `/analytics/candidate-funnel` and confirm data is visible.
- [ ] With school user A, call `/api/analytics/candidate-funnel?schoolId=<school_B_id>`. Confirm `403`.
- [ ] With school user A, call `/api/analytics/candidate-funnel/timeline?candidateKey=...&schoolId=<school_B_id>`. Confirm `403`.
- [ ] Login as school user B. Confirm user B cannot see any of school A data.
- [ ] If a super-admin role exists (`super_admin`, `platform_admin`, `internal_admin`), verify all-school access works only for those roles.

## Server Enforcement
- [ ] Verify no client-side-only filtering path exposes unscoped rows.
- [ ] Confirm server query layer applies `school_id = effective_scope_school_id` for school-scoped users.
- [ ] Confirm timeline endpoint uses same scope enforcement as overview endpoint.

## Data Privacy
- [ ] Candidate names/emails appear masked in list views.
- [ ] Timeline metadata redacts sensitive keys (`token`, `password`, `phone`, etc.).
- [ ] No raw sensitive metadata is rendered directly in UI.

## Functional Checks
- [ ] Default filter window is last 7 days.
- [ ] Job filter only includes jobs for the allowed school scope.
- [ ] Browser/device filter updates KPI + tables consistently.
- [ ] Timeline pagination works and does not leak other candidates.
- [ ] Copy debug summary excludes sensitive raw fields.

## Regression Safety
- [ ] Validate authenticated dashboard routes still load normally.
- [ ] Run TypeScript check for new analytics module.
- [ ] Spot-check API responses for malformed/empty states.
