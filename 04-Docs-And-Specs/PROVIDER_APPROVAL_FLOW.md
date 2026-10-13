# Provider approval flow

Independent instructors must be approved before an organization, trial, public profile, or instructor record is created.

## State machine

`pending_review -> needs_changes -> pending_review -> approved | rejected`

- `pending_review`: locked for applicant edits while the platform team reviews it.
- `needs_changes`: applicant can update the form and replace documents.
- `approved`: creates the instructor organization, owner membership, trial subscription, verified public profile, and active instructor record in one transaction.
- `rejected`: keeps the review history and allows a corrected resubmission.

## Applicant endpoints

- `GET /api/v1/provider-applications/mine`
- `POST /api/v1/provider-applications` (multipart form data)

Email verification is required. Identity documents are mandatory, private, malware-scanned, and never exposed through public URLs.

## Platform review endpoints

- `GET /api/v1/admin/provider-applications`
- `GET /api/v1/admin/provider-applications/{application}/documents/{document}`
- `POST /api/v1/admin/provider-applications/{application}/approve`
- `POST /api/v1/admin/provider-applications/{application}/request-changes`
- `POST /api/v1/admin/provider-applications/{application}/reject`

Only platform super administrators and moderators can make review decisions. Platform support may view requests and their documents.

## Notifications and privacy

Every state change creates an in-app notification and queues an email to the applicant. New submissions create an in-app action for platform reviewers. Provider application data is included in privacy exports; private documents are removed and personal fields are redacted during account deletion.
