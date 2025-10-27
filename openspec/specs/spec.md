# Specification Deltas — Mental Health Support Platform

## Overview
This spec.md details the system deltas and impact for introducing the comprehensive mental health support platform outlined in proposal.md. It summarizes new endpoints, database schemas, integration points, and breaking changes or compatibility notes relevant to the initial MVP and iterative releases.

---

## New API Endpoints

- `POST /api/mood`: Log a user's daily mood entry (includes mood score, notes, timestamp)
- `GET /api/mood/history`: Retrieve user's mood history with trend aggregation
- `GET /api/cbt/modules`: List available CBT exercises and worksheets
- `POST /api/cbt/complete`: Mark CBT exercise as completed by the user
- `POST /api/conversation`: Launch AI chat session for a user; returns streaming chat completion
- `POST /api/crisis-check`: Submit user journal or message for crisis detection; alerts if indicators met

---

## Modified/Extended Systems

- **User Model**: Add fields for onboarding questionnaire (mental health needs, crisis flag, personal goals)
- **Session Management**: Update session payload to track AI conversation context and escalation flag
- **Permissions**: Role-based permissions for anonymous users (limited), registered (full features), clinical staff (view/report only if authorized)
- **Notification System**: New notification types for crisis detection, activity reminders

---

## Database Schema Changes

**Tables:**
- `mood_entries`: (id, user_id, mood_level, notes, timestamp)
- `cbt_sessions`: (id, user_id, module_id, completed_at)
- `ai_conversations`: (id, user_id, session_context, start_at, end_at, crisis_detected)
- `crisis_events`: (id, user_id, source, detected_at, flag_level, escalation_status)

**Modifications:**
- Extend `users` table: add `crisis_flag` (boolean), `privacy_mode` (enum: 'standard', 'max-secure')

---

## Third-Party Integrations

- **AI Chat/Inference API:** Connect to OpenAI, Gemma, or similar for empathetic conversation generation
- **Healthcare Escalation:** Securely link with crisis hotlines, SMS/email (Twilio, SendGrid)
- **Analytics:** Optional anonymized logging for mood trend improvement

---

## Backward Compatibility

- No impact on existing authentication or static content endpoints
- New tables and endpoints are additive; legacy users see no change until onboarding new features
- All crisis escalation features are opt-in and privacy-centric

---

## Migration / Setup Notes

- Database migrations required: add all enumerated new tables and columns
- Environment secrets for AI model keys, SMTP/SMS credentials

---

## Breaking Changes

- None anticipated for initial MVP. All new functionality is additive.

---

## Known Limitations / Risk Areas

- AI-driven crisis detection may generate false positives/negatives; all alerts must route to human review
- Data compliance (HIPAA/GDPR) required for all journal/conversation endpoints
- Initial AI models must not store personally identifiable messages without explicit opt-in

---

## Open Questions

- Will internationalization be required for mood terms and CBT language?
- Is fine-tuning allowed on AI provider for greater mental health accuracy, or does that trigger new compliance audits?
- Who is accountable for data audit logs when a user exercises right-to-erasure?

---

## Summary

This spec.md captures the delta between the existing system and the planned mental health platform: new mood/CBT endpoints, conversational AI integration, expanded user data, crisis detection flows, and full compliance-first migration notes. All significant technical and regulatory impact is annotated above.
