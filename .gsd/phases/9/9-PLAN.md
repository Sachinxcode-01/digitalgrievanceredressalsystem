---
phase: 9
plan: 1
wave: 1
---

# Plan 9.1: Finalize Institutional SSO Documentation

## Objective
Verify the existing OAuth code implementation and finalize the administrative documentation so that administrators know how to enable Google and Microsoft login via Supabase.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- src/pages/LoginPage.jsx
- src/App.jsx

## Tasks

<task type="auto">
  <name>Document OAuth Configuration</name>
  <files>README.md, HANDOFF.md</files>
  <action>
    Update README.md to include an 'OAuth Configuration' section under 'Environment Variables' or 'Deployment', specifying how to enable Google and Microsoft (Azure) in Supabase.
    Update HANDOFF.md to ensure Institutional SSO is checked as completed.
  </action>
  <verify>Get-Content README.md | Select-String "OAuth Configuration"</verify>
  <done>README.md contains explicit instructions for configuring Supabase OAuth and HANDOFF.md marks Institutional SSO as complete.</done>
</task>

## Success Criteria
- [ ] README.md contains Supabase OAuth setup instructions.
- [ ] Phase 9 can be fully completed.
