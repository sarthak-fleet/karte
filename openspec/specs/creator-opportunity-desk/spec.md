# creator-opportunity-desk Specification

## Purpose
TBD - created by archiving change add-creator-opportunity-desk. Update Purpose after archive.
## Requirements
### Requirement: Opportunity records are page-owned
The system SHALL store every creator opportunity under one Karte page and SHALL allow only that page's authenticated owner to list, create, read, update, generate, approve, or dismiss it.

#### Scenario: Owner accesses an opportunity
- **WHEN** the authenticated owner requests an opportunity belonging to their page
- **THEN** the system returns the opportunity and its current lifecycle state

#### Scenario: Another user accesses an opportunity
- **WHEN** an authenticated user requests an opportunity belonging to another user's page
- **THEN** the system rejects the request without exposing the opportunity content

### Requirement: Creator can start from an explicit signal
The system SHALL let the owner create an opportunity manually or from an eligible page-owned timeline event, qualified lead, contact submission, conversation, or received email. The system SHALL store source type, optional source identifier, and a bounded source snapshot.

#### Scenario: Creator uses a timeline moment
- **WHEN** the owner selects one of their timeline events and creates an opportunity
- **THEN** the system creates a `signal` opportunity linked to that event with a displayable source snapshot

#### Scenario: Creator enters a manual moment
- **WHEN** the owner enters a valid moment without selecting an existing source
- **THEN** the system creates a `signal` opportunity with source type `manual`

#### Scenario: Creator attempts to use another page's source
- **WHEN** the owner submits a source identifier that does not belong to their page
- **THEN** the system rejects the request and creates no opportunity

### Requirement: Generation is explicit and bounded
The system SHALL generate an opportunity brief only after the owner explicitly requests generation for a stored opportunity. It MUST send only the selected source snapshot and bounded relevant page/profile context to the configured AI provider.

#### Scenario: Owner requests generation
- **WHEN** the owner clicks Generate for a valid `signal` opportunity and AI is available
- **THEN** the system requests one structured brief and stores it only after schema validation

#### Scenario: Dashboard is opened
- **WHEN** the owner views Opportunity Desk without requesting generation
- **THEN** the system performs no AI generation and sends no opportunity source content to the AI provider

### Requirement: Brief is structured and reviewable
The generated brief SHALL include a title, lead-time assessment, fit rationale, risk notes, partnership angles, relevant brand categories, optional named-brand hypotheses, and an editable draft subject and body. Named-brand hypotheses MUST be labeled as AI suggestions that require verification.

#### Scenario: Valid brief is generated
- **WHEN** the AI returns output matching the opportunity schema
- **THEN** the system persists the brief, changes the lifecycle state to `drafted`, and displays all required review fields

#### Scenario: AI proposes a named brand
- **WHEN** a generated brief includes one or more named brands
- **THEN** the UI labels them as unverified AI suggestions and does not present invented contact information

#### Scenario: AI returns invalid output
- **WHEN** the AI response fails schema validation
- **THEN** the system returns a recoverable error and preserves the existing opportunity and prior valid draft, if any

### Requirement: Approval lifecycle is explicit
The system SHALL support `signal`, `drafted`, `approved`, and `dismissed` states. Only a valid draft can become `approved`, and any material edit to an approved draft MUST return it to `drafted` and clear its approval timestamp.

#### Scenario: Creator approves a draft
- **WHEN** the owner approves an opportunity containing a valid subject and body
- **THEN** the system records the `approved` state and approval timestamp

#### Scenario: Creator edits an approved draft
- **WHEN** the owner changes the subject, body, recipient, or partnership angle of an approved opportunity
- **THEN** the system returns it to `drafted` and clears the prior approval timestamp

#### Scenario: Creator dismisses a signal
- **WHEN** the owner dismisses an opportunity
- **THEN** the system records `dismissed` without deleting the underlying source record

### Requirement: Karte never sends in the first release
The system MUST NOT send opportunity email, direct messages, follow-ups, or other external communications. It SHALL provide copy actions and MAY open a user-controlled mail client only for an approved draft with a user-verified recipient.

#### Scenario: Approved draft has a verified recipient
- **WHEN** the owner chooses Open in mail for an approved draft with a syntactically valid recipient
- **THEN** the system opens a `mailto:` URL containing the reviewed recipient, subject, and body without sending it

#### Scenario: Draft is not approved
- **WHEN** the owner views a `signal` or `drafted` opportunity
- **THEN** the system does not expose an action that could be mistaken for sending the message

#### Scenario: Outbound recipient is missing
- **WHEN** an approved outbound draft has no user-verified recipient
- **THEN** the system disables Open in mail and explains that a recipient must be supplied and verified

### Requirement: AI and data failures preserve user work
The system SHALL preserve stored signals and valid drafts when AI generation, parsing, or persistence fails, and SHALL show an actionable retry state without fabricating success.

#### Scenario: AI provider is unavailable
- **WHEN** generation cannot reach the configured AI provider
- **THEN** the system keeps the opportunity unchanged and tells the owner generation can be retried

#### Scenario: Opportunity storage is unavailable
- **WHEN** the opportunity table is not available in the current environment
- **THEN** the surface fails closed with a clear unavailable state and does not attempt a runtime production schema mutation

