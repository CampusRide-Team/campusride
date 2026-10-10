# CampusRide safety: research findings and design recommendations

Research date: 24 September 2026. Reviewed against the supplied Safety System Specification v2.

## Purpose and evidence quality

This is a desk-research assignment to identify useful evidence, reusable product patterns, implementation constraints, and changes to the proposed specification. It is not an implementation audit or a field trial. No SMS delivery tests, emergency calls, campus interviews, or production integrations were performed.

Evidence comes from Ghana-focused academic research, official emergency and regulatory sources, platform documentation, and first-party ride-hailing product descriptions. These answer different questions: studies describe experiences, vendors describe features, and technical documentation establishes platform constraints. A feature appearing in Uber or Bolt is not proof that it reduces injuries or crime, or that it is available in every Ghanaian city.

Some publisher and regulatory pages could be retrieved only through indexed text; findings from those sources are limited to the accessible abstract, methodology, or excerpt. An accessible accepted manuscript was located for the 2021 Ghana passenger study. Recommendations below are my synthesis, not claims that researchers tested CampusRide.

## Main conclusion

Keep the six-module structure. Its strongest choices are truthful status, saving alerts before confirmation, separate incident and lost-property queues, private reporting, and human review. The largest improvements are operational reliability, protection against tracking abuse, prevention before boarding, and realistic behavior when devices or networks fail.

The first release should demonstrate that an alert reaches an accountable person, that the person can act, and that users can see the limits of the service. Advanced detection and extensive evidence collection should come later.

## 1. Academic publications worth using

### Passenger safety in Ghana: Acheampong, 2021

**Reference:** Acheampong, R. A. (2021). *Societal impacts of smart, digital platform mobility services—an empirical study and policy implications of passenger safety and security in ride-hailing*. Case Studies on Transport Policy, 9(1), 302–314. [DOI](https://doi.org/10.1016/j.cstp.2021.01.008) · [Accepted manuscript](https://pure.manchester.ac.uk/ws/portalfiles/portal/185116953/Ride_hailing_safety_Manuscript_Acheampong_RA.pdf).

The study draws on qualitative survey data from 548 users and non-users in Ghana. Identification and journey traceability contributed to perceived safety, while distrust, unsafe driving, smartphone distraction, and disputes over opaque fares emerged as concerns.

**Application:** prioritize accurate vehicle/driver identification, understandable tracking, unsafe-driving reporting, and clear fare communication. Safety begins before an SOS is triggered.

**Limit:** perceptions and reported experiences do not establish that a particular feature prevents harm. The sample is not a CampusRide evaluation.

### Driver safety in Ghana: Nkansah, Nsaful and Asumeng, 2026

**Reference:** *Drivers’ safety and security in the gig economy: A content analysis of media reports in Ghana*. [Publisher abstract](https://www.sciencedirect.com/science/article/pii/S3050475926001284) · [DOI](https://doi.org/10.1016/j.nexres.2026.101431).

The exploratory analysis covers 24 local news reports from June 2016 to November 2024; robbery is the most frequently reported threat in that corpus.

**Application:** retain driver-raised emergencies, private reporting, and protection from hostile passengers. Extend incident-management actions to either role rather than implementing only “warn driver” and “suspend driver.”

**Limit:** media reports are selected accounts, not a population denominator. Do not describe robbery as the most common incident across all Ghanaian rides based on this study.

### Female drivers’ experiences, Ghana, 2026

**Reference:** *Lived experiences of female ride hailing drivers and the dynamics of opportunity and risk in Ghana*. Discover Global Society. [Article](https://doi.org/10.1007/s44282-026-00425-3).

The accessible methodology describes 23 interviews with female drivers in Accra and Kumasi, supplemented by focus groups. Accounts include harassment and gender-related discrimination.

**Application:** include women drivers in usability research; allow harassment reporting independently of ratings; consider a reviewed “do not match us again” option. Avoid assuming that passengers are always the vulnerable party.

**Limit:** this qualitative sample offers contextual insights, not prevalence estimates for all drivers or students.

### Road safety and distraction

WHO identifies mobile-phone distraction as a road-safety risk. [WHO road traffic injuries fact sheet](https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries/).

**Application:** driver emergency interaction should be brief. Defer descriptions, photos, and lost-property replies until the driver can stop safely. Do not require typing to submit a driver alert.

## 2. Existing products: what is useful to borrow

| Pattern | Evidence | CampusRide recommendation |
|---|---|---|
| Vehicle details, trip sharing and pickup verification | Bolt’s Ghana safety page describes shareable vehicle/location details and pickup codes. [Bolt](https://bolt.eu/en-gh/rides/safety//) | Show plate, photo, make and colour prominently; add a booking-specific boarding PIN. |
| Checks for unusual trips | Uber describes RideCheck and PIN verification. [Uber announcement](https://www.uber.com/in/en/newsroom/new-safety-features/) | Start with user-initiated concerns. Later trial non-accusatory check-ins for unexpected stops. |
| Privacy-preserving evidence | Uber describes encrypted audio that becomes accessible to its team when attached to a safety report. [Uber audio](https://www.uber.com/be/en/ride/safety/audio-recording/) | Treat audio as a later research item requiring consent, storage and local legal decisions. |
| Lost-phone recovery outside the app | Uber provides web recovery and an alternative callback number. [Uber lost items](https://help.uber.com/en/riders/article/forgot-something-in-an-uber?nodeId=feab9beb-9eac-47a2-b63a-6915d8821e1d) | Add a web or campus-desk route that does not require access to the missing device. |

A boarding PIN should validate the passenger-booking pairing at boarding, expire after use, and resist repeated guesses. It complements the visible driver and plate check; it does not establish that a driver is safe or that an account has never been shared. For pooled trips, verify each booking independently.

Automated route checks need campus-specific evaluation: traffic, road closures, gates and passenger-requested stops may be legitimate. Begin with a check-in, log the outcome, and measure false alerts before using automation to mobilize responders. Do not automatically punish a driver based on GPS anomalies.

## 3. Ghana-specific findings

### Emergency number and campus response

Ghana’s National Ambulance Service lists **112** as its emergency hotline. Keep it prominently available, including when CampusRide is offline. [National Ambulance Service](https://www.nas.gov.gh/).

Opening a dialer is not confirmation that a call connected. Do not mark help dispatched because somebody tapped the button. Also distinguish no internet from no cellular service: an SMS composer is a useful fallback for the former, not a guarantee for the latter.

Campus numbers and arrangements must be campus-specific. For example, KNUST publishes a physical-security hotline and office contacts. [KNUST campus security](https://www.knust.edu.gh/students/life/security). A published number establishes a contact route, not a service agreement with CampusRide. Confirm routing, coverage hours, callback procedures and escalation ownership through the campus before enabling automatic forwarding. Do not confuse a university cybersecurity incident team with physical emergency response.

Recommended configuration: campus ID, emergency contact, backup contact, coverage hours, supported escalation channel, last verification date, and responsible operator. No target campus was identified in this assignment, so no campus number is recommended for deployment.

### SMS provider shortlist

| Provider | Verified public information | What remains to establish |
|---|---|---|
| Arkesel | Ghana SMS API, sender IDs and delivery callbacks are described. [API overview](https://arkesel.com/developer-api/sms-api/) | Account-specific pricing, registration, callback authentication, actual network latency, support and service commitments. |
| Hubtel | Developer portal offers SMS services and delivery monitoring. [Developer portal](https://developers.hubtel.com/) | Detailed integration contract, delivery-report semantics, registration and operational support. |
| Twilio | Ghana-specific guidelines describe sender registration and no two-way SMS support. [Ghana guidelines](https://www.twilio.com/en-us/guidelines/gh/sms) | Cost at the required volume and successful delivery on the campus users’ networks. |

Twilio’s current Ghana guidance states that unregistered sender IDs to MTN are blocked from 8 July 2026. Start sender approval early. This is Twilio’s route guidance; confirm requirements with whichever provider is selected.

Recommendation: trial a local provider and a second candidate before committing. Record submission time, acceptance, delivery report, handset arrival and failures across the networks actually used by students. Vendor latency claims are not independent evidence of campus performance. A second provider may share carrier dependencies with the first, so do not assume complete independence.

Use one notification adapter, but separate OTP traffic from emergency traffic in queues and monitoring. Measure SMS segments, not just message count: names, long URLs and character encoding affect segmentation. Use a branded HTTPS domain. Include a contact-managed opt-out flow; do not assume recipients can reply STOP to an alphanumeric sender.

### Data protection

Ghana’s Act 843 governs personal-data processing and treats health information and alleged offences as special personal data. Its retention framework is purpose-based; the specification’s 90-day and 12/24-month periods are design proposals, not automatically statutory requirements. [Act 843](https://ghalii.org/akn/gh/act/2012/843/eng%402012-05-18).

The Data Protection Commission’s guidance addresses controller registration, and its assessment tool covers operational compliance controls. [DPC guidance](https://dataprotection.org.gh/wp-content/uploads/2025/07/GUIDELINES-TO-DEMONSTRATE-DATA-PROTECTION-COMPLIANCE-1.pdf) · [DPC assessment tool](https://dpc.gov.gh/self-assessment-compliance-tool/).

Before a live rollout, determine the responsible controller, document purposes and access, and obtain local review of the legal basis for emergency and health data. Supervisor approval alone is not a legal-compliance determination.

Recommended design work: a retention schedule for each record type; processor inventory; deletion and backup policy; access-review process; breach-response procedure; and a documented basis for any evidence hold. Removing a name does not necessarily anonymize a detailed journey. Defer optional medical notes until these controls are demonstrable.

## 4. What the mobile and backend stack can actually promise

### Location

Expo documents background-location constraints, including tracking stopping when a user terminates the app and differences across platforms/vendors. Development builds are needed for background-location testing. [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/).

Treat five-second updates as a target under supported conditions. Display sample time, accuracy, source and freshness; distinguish vehicle position from the reporter’s position. A geofencing restart behavior does not guarantee continuous emergency tracking. Test locked screens, permissions, force termination, battery restrictions and poor reception on physical phones.

Google Play requires justification and approval for background location. Move disclosure and permissions work into the first implementation phase. [Google Play location policy](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en-GB).

### Push and SMS

Expo states that successful receipts establish handoff to Apple/Google, not device receipt, and the Expo push service has no SLA. [Expo push documentation](https://docs.expo.dev/push-notifications/sending-notifications/).

Recommended status vocabulary: queued; accepted by provider; delivery reported where supported; acknowledged by a person; failed. Use explicit human acknowledgement to establish that someone is handling the event. On-call escalation must continue independently of push receipt checks.

Expo SMS opens the native composer. Android returns an unknown result rather than reliable sending confirmation. [Expo SMS](https://docs.expo.dev/versions/latest/sdk/sms/). Therefore “SMS app opened” is a defensible status; “trusted contact alerted” is not established by the composer result. The user still controls sending.

### Real-time delivery and persistent work

Socket.IO documents at-most-once arrival by default. [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/).

Recommended architecture: commit the event and durable pending-work records together; let retryable workers send notifications and process escalation; use Socket.IO for prompt display; reload authoritative state on reconnect. Give every outbound action a deduplication key. A process crash between saving an event and creating its notification job must not silently strand the alert.

Enforce one-open-event and idempotency rules atomically, rather than checking in application code and inserting later. Preserve incident updates with a version or sequence number so delayed socket messages cannot overwrite newer state.

### Expiry and alarms

MongoDB TTL deletion is asynchronous. Enforce share-link expiry and revocation on every read; TTL is only cleanup. [MongoDB TTL](https://www.mongodb.com/docs/manual/core/index-ttl/).

Browsers can block autoplay audio. An admin shift-start action should enable and test alarm sound, with a visible alarm-health indicator and an independent on-call channel. [Chrome audio policy](https://developer.chrome.com/blog/web-audio-autoplay). Keep sound muting separate from acknowledging responsibility for a case.

## 5. Specification corrections before implementation

The following are design-review findings from the supplied specification, informed by the research above. They have not been tested against application code.

| Priority | Gap in v2 | Recommended change |
|---|---|---|
| Critical | Section 2 rejects suspended users at socket connection, while section 16 accepts their safety events. | Define a restricted authenticated safety capability for suspended accounts, including status and location updates. Never restore normal booking/admin permissions through this exception. |
| Critical | First-use disclosure must be accepted before using the emergency control. | Present disclosure during setup and normal use. Keep urgent help accessible; locally review the emergency processing basis rather than making a new terms screen the emergency gate. |
| Critical | Every hold starts as `safety_threat`, but accident telemetry is captured on creation. | Temporarily preserve the relevant rolling window on initial emergency creation, subject to the retention design, so later reclassification can attach it. Do not block alert persistence when telemetry is missing. |
| Critical | Initial contact SMS uses the default threat category before reclassification. | Send a generic initial alert; define deduplicated follow-up rules when the type changes. Never delay emergency submission merely to get a better message label. |
| Critical | Reclassifying an event resets escalation from the current time. | Base deadlines on persisted urgency/creation history. Do not allow repeated changes to postpone an overdue escalation. |
| Critical | Acknowledgement ends the no-ack ladder, even if no subsequent action occurs. | Add a response-progress deadline, ownership and reassignment. “Seen” must not silence operational follow-up indefinitely. |
| Critical | Vehicle location is used on the assumption that driver and passenger are together. | Show it as vehicle location only. Boarding, separation, early exit and no-ride emergencies invalidate that assumption. |
| High | Fire/smoke is included in an ordinary P2 breakdown. | Create explicit immediate-danger escalation criteria for qualified responders to review; do not rely only on the unsafe-location question. |
| High | One unresolved event may prevent a genuinely new emergency after the user reports being safe. | Specify immediate reactivation/escalation or a linked new episode without waiting for administrative closure. |
| High | An unconditional five-events-per-hour cap can block urgent help. | Deduplicate retries, append updates to existing cases and apply abuse controls without a blanket loss of emergency access. Keep direct calling available. |
| High | No admins on duty means “all admins on duty.” | Record this as coverage failure and alert a designated backup. Database roles do not establish actual availability. |
| High | A no-ride emergency has no obvious booking scope for its share link. | Support an event-scoped emergency link with its own location source and expiry. |
| High | Cancellation revokes links; an unsafe cancellation may happen during an emergency. | Separate ordinary ride-share cancellation from emergency-link lifecycle, while retaining explicit user revocation. |
| High | Post-trip link grace can expose the driver or the next passenger. | Stop live vehicle tracking when the sharing passenger’s participation ends; show final relevant status during any grace period. |
| High | “I'm safe” does not define when tracking stops. | Separate case follow-up from location collection. Provide a clear stop-sharing control and bounded collection policy. |
| High | Changing a verified contact’s phone might preserve its verified state. | Invalidate consent/verification for the old destination, revoke related links and verify the new number. |
| High | OTP relay is treated as proof of contact consent. | Prefer a contact-operated confirmation page with an explicit choice; record the notice version and choice, not just code possession. |
| High | Contact opt-out uses a state-changing GET. | Let GET open a minimal page; use explicit confirmation to change state, so previews/prefetches do not revoke consent. |
| High | Automatic shares begin when a driver is assigned. | Separate pre-trip details from passenger live tracking; do not expose the driver’s unrelated approach journey by default. |
| High | Shared-ride accidents attach all trip bookings. | Select occupants whose participation overlaps the incident, excluding future pickups and prior drop-offs. Permit logged corrections. |
| High | One incident per user and “no duplicate accident events” are ambiguous when two occupants independently report. | Preserve each reporter’s private event and correlate them to a shared incident for admin coordination. |
| Medium | A medical note is promised to disappear immediately and permanently. | Define operational deletion, cache eviction, backup expiry and restoration handling; align wording with what can actually be enforced. |
| Medium | All administrators can see all safety information. | Add safety-specific permissions within the admin role and restrict sensitive detail to authorized staff. |
| Medium | Follow-up omits `passenger_unresponsive`. | Include it or document a deliberate clinical/operational reason; make follow-up appropriate to the affected person. |
| Medium | Replacement-ride creation could be mistaken for successful assistance. | Distinguish requested, assigned, accepted and completed replacement; do not resolve solely because a booking exists. |
| Medium | Lost-and-found and incident actions assume access to the original phone. | Provide verified alternative access and staff assistance, including a disputed-handover path. |

## 6. Privacy and misuse protections

A per-contact bearer link can be forwarded. It enables per-link revocation but does not authenticate the person opening it. Label view counters as link accesses, not proof that a named contact has checked the ride. Consider additional verification where needed, balanced against emergency usability.

OWASP’s URL-token guidance supports secure random generation, expiry, protected storage and leakage controls. Its password-reset context is different; the applicable security principles are being adapted here. [OWASP token guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Recommendations: HTTPS; hashed tokens; `Referrer-Policy: no-referrer`; `Cache-Control: no-store`; no advertising or analytics on tracking pages; token redaction in proxy/application/error logs; minimal third-party resources; and immediate authorization checks after revocation. Review what a mapping provider receives. Do not describe data as impossible to copy once a recipient can see it.

Separate opt-out, consent and tracking tokens. A tracking-link recipient should not automatically gain account-management powers. Require secure action semantics; OWASP advises against state-changing GET requests. [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

“Silent toward the other party” should mean no direct notification to that party. A visible screen, operating-system location indicator, vibration or callback may still reveal activity. Add an optional “safe to call?” preference on the active event, discreet notification text and an operator instruction to check before calling. Do not promise perfect secrecy.

## 7. Emergency interaction and accessibility

The proposed 1.5-second hold plus five-second countdown imposes at least 6.5 seconds before network submission. No reviewed source establishes this exact combination as optimal for CampusRide. Treat it as a hypothesis to test.

W3C guidance addresses accidental pointer activation and sufficient target size. [Pointer cancellation](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation) · [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). These web criteria inform the design but do not by themselves certify a native app.

Test a hold-and-cancel flow against an accessible alternative activation path. Keep direct emergency calling immediate. Use large separated controls, screen-reader labels, visible status text, strong contrast and feedback beyond colour. Test one-handed use, tremor, screen readers, large text, low-end phones and low-light use. Detailed questions remain optional after sending.

## 8. Recommended delivery order

1. **Operational setup:** identified responder, coverage hours, backup route, campus contacts, rehearsed call script and honest availability wording.
2. **Emergency foundation:** non-blocking entry, durable submission, idempotency, usable no-location state, admin queue, acknowledgement and progress escalation, direct calling and offline wording.
3. **Delivery and contacts:** provider registration, tested SMS route, contact-operated consent, delivery states and revocation. Implement independently of a single push or browser channel.
4. **Prevention and tracking:** accurate vehicle details, per-booking pickup PIN, expiring shares, participant-aware tracking boundaries and stale-location display.
5. **Aftercare:** incident reporting, private updates, role-neutral moderation, follow-up, lost-property recovery through app and alternative access.
6. **Advanced features:** reviewed medical notes, replacement coordination, anomaly detection and possible audio evidence after usability, operations and privacy requirements are met.

Move the minimal Safety Center, disclosure and emergency guidance into the early phases. Optional management polish can wait; discoverable help cannot.

## 9. Research and validation still needed on campus

Conduct formative interviews with students, drivers, security staff and the service operator. Include women and people using accessibility features. Ask about unsafe pickup locations, reliable contact channels, language, harassment reporting, safe callback behavior and ownership of an alert after hours. These interviews discover design needs; a small convenience sample should not be reported as a campus-wide prevalence estimate.

Run consented simulations with test responders and clearly marked test messages. Do not place routine tests into public emergency queues.

| Scenario | Evidence to collect |
|---|---|
| Network lost before submission | UI remains unconfirmed; direct help remains accessible; queued state survives restart. |
| Server saves, response is lost | Retry returns the same event and avoids duplicate outward actions. |
| Worker crashes after sending | Recovery preserves the notification record and handles uncertain delivery explicitly. |
| App backgrounded, killed or permissions withdrawn | Location freshness is honest; server-side escalation continues. |
| Admin browser muted, closed or disconnected | Independent escalation reaches the designated backup. |
| Type changes repeatedly | Priority updates; overdue work is not postponed. |
| Admin acknowledges then disappears | Progress timeout triggers reassignment/escalation. |
| Rider exits or pooled trip continues | Link does not track the next passenger’s journey. |
| Contact revokes or changes number | Old destination immediately loses future access. |
| User loses their registered phone | Verified alternate recovery path works. |

Track separate times for button activation, server persistence, console visibility, provider acceptance, delivery report, human acknowledgement, first response action and resolution. Also measure stale-location duration, unanswered cases, accidental alerts, callback safety, battery/data use and user understanding. Report median and tail latency, sample size, devices and network conditions.

The two-second dashboard and one-second persistence goals in v2 are sensible engineering targets to evaluate, not established performance. A fast console is not evidence of fast emergency arrival. User satisfaction and perceived safety should be measured separately from actual incident outcomes.

## 10. Decisions this research can and cannot settle

**Ready to use:** keep the modular design; keep truthful status and direct 112 access; add boarding verification and lost-phone recovery; use durable work and explicit human acknowledgement; treat tracking as permission-dependent; test registered SMS delivery; fix the lifecycle contradictions above.

**Still requires local confirmation:** target campus, responder staffing and authority, accepted campus-security escalation channel, actual SMS cost/delivery, supported devices, legally reviewed retention and consent wording, and funding for operations.

**Not established by this research:** a percentage reduction in crime, guaranteed emergency response time, a universally best SMS provider, optimal countdown length, or legal approval for CampusRide to collect every proposed field.

For an academic project, a defensible contribution is evaluating whether a campus-specific system can deliver understandable, private and resilient safety coordination under realistic device, network and staffing constraints. Avoid claiming a novel panic button or proven prevention of crime without supporting evaluation.
