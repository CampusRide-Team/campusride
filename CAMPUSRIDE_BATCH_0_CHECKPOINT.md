# CAMPUSRIDE BATCH 0 CHECKPOINT

Date: 2026-10-08  
Branch/HEAD: `dev` / `97aa06f`  
Scope: Batch 0 only; no Batch 1 implementation  
Git operations: no stage, commit, push, reset, clean, rebase, or branch change

## 1. Outcome

Batch 0 implementation has reached its review gate. The P0 location-source, implicit Driver availability, and redispatch-authorization defects have targeted corrections. The active route-to-booking path no longer calculates or requires fares. Existing fare-bearing records remain schema-compatible. Initial dispatch is owned by the server once; the Passenger no longer immediately invokes a duplicate manual dispatch.

This checkpoint is **not full acceptance**. There is no verified disposable MongoDB test database, so no database-mutating integration suite was run. No physical Android flow was tested. Batch 1 has not started.

## 2. Verified authoritative Driver availability contract

- Persistence: top-level `User.isOnline`, default `false`.
- Read API: authenticated Driver `GET /api/v1/driver/profile`; response `data.isOnline` comes from the User document.
- Write API: authenticated approved Driver `PUT /api/v1/driver/availability` with strict boolean `{ isOnline }`.
- Location API: `PUT /api/v1/driver/location` now updates only coordinates and heartbeat. It ignores/removes availability mutation responsibility.
- Telemetry API/socket similarly updates location/heartbeat without changing availability.
- Driver navigation now hydrates the profile using the verified profile API and uses safe offline state until hydration succeeds.
- Driver Home no longer defaults a missing value to online, and its initial/live GPS writes omit `isOnline`.

## 3. Contract changes

### Location

- Canonical sources: `poi`, `device_gps`, `map_pin`, `reverse_geocoded`.
- Input aliases `gps_current` and `gps_pin` normalize to `device_gps`.
- Schema continues accepting legacy values so historical records remain readable.
- Device GPS now carries `{ accuracyMeters, capturedAt }`.
- Backend rejects GPS worse than 100 m, older than two minutes, more than 30 seconds in the future, invalid coordinates, and unknown sources.
- Coordinate order remains `[longitude, latitude]`.

### Fare-free route and booking

- Routing success DTO retains road geometry, distance, duration, formatted ETA, provider source, fallback metadata, cache status, and calculation time.
- Routing no longer calculates or returns Solo/Shared quotes.
- If only geodesic/straight-line estimation is available, the routing controller returns HTTP 503 `ROAD_ROUTE_UNAVAILABLE`; it does not return estimated geometry/distance as a valid road route.
- Passenger route confirmation and booking require matching road geometry and no longer require a fare quote.
- Backend booking independently rejects estimate-only or missing/endpoint-only road geometry before any database write.
- New bookings omit `fare` and persist non-monetary route distance, duration, source, estimate flag, and calculation time.
- Existing `fare` subdocuments remain optional and readable; no migration or historical record update was performed.
- Trip completion no longer marks payment status paid.
- Dispatch offers no longer emit estimated fare or currency.

### Dispatch and authorization

- Existing `dispatchSoloBooking`, `dispatchSharedBooking`, `acceptSoloOffer`, `acceptSharedOffer`, transaction/fallback logic, and atomic booking claims remain the only canonical dispatch/acceptance architecture.
- No competing DispatchOffer acceptance path was introduced in Batch 0.
- Server booking creation retains ownership of initial dispatch.
- Passenger code no longer invokes a second dispatch immediately after creation.
- Manual redispatch remains the existing endpoint and existing dispatch services, now limited to the booking Passenger or an administrator, `pending` status, and an unexpired search window.
- Durable offers/idempotent offer lifecycle remain Batch 1/3 work and must extend the existing acceptance services.

## 4. Exact changed files

### Backend

- `backend/src/controllers/driverController.js`
- `backend/src/controllers/routingController.js`
- `backend/src/models/RideBooking.js`
- `backend/src/routes/bookingRoutes.js`
- `backend/src/routes/driverRoutes.js`
- `backend/src/services/bookingService.js`
- `backend/src/services/dispatchService.js`
- `backend/src/services/poiService.js`
- `backend/src/services/tripService.js`
- `backend/src/utils/bookingAuthorization.js` (new)
- `backend/test/batch0_contracts.test.js` (new)

### Frontend

- `frontend/src/api/services/driverService.js`
- `frontend/src/navigation/DriverNavigator.js`
- `frontend/src/screens/driver/DriverHome.js`
- `frontend/src/screens/driver/ActiveRequests.js`
- `frontend/src/utils/locationSelection.js`
- `frontend/src/utils/routeSelection.js`
- `frontend/src/components/passenger/PassengerRideShell.js`
- `frontend/src/components/passenger/RouteOptionsWorkspace.js`
- `frontend/src/components/passenger/RideModeRow.js`
- `frontend/src/components/passenger/NoDriverWorkspace.js`
- `frontend/src/components/passenger/MatchingWorkspace.js`
- `frontend/src/components/passenger/TripCompletionWorkspace.js`
- `frontend/test/locationSelection.test.js`
- `frontend/test/routeSelection.test.js`

### Documentation

- `CAMPUSRIDE_BATCH_0_CHECKPOINT.md` (this file)

Pre-existing changes in all other modified/untracked files were preserved.

## 5. Test results

| Command | Pass | Fail | Skip | Result/limit |
|---|---:|---:|---:|---|
| `node --test frontend/test/locationSelection.test.js frontend/test/routeSelection.test.js` | 16 | 0 | 0 | Pure location/road-route/fare-free payload tests passed. No UI/device proof. |
| `node --test backend/test/batch0_contracts.test.js backend/test/routing_service_provider.test.js` | 14 | 0 | 0 | Schema-only compatibility, source/GPS, authorization helper, availability controllers with mocked model methods, routing failure, fare-free response, pre-write rejection, and provider tests passed. No Mongo mutation. |
| `node --check` on ten changed backend modules | n/a | 0 parse errors | n/a | Syntax only. |
| `npx expo export --platform android --output-dir %TEMP%\\campusride-batch0-final-export` | 1 export | 0 | n/a | SDK 54 Android bundle/export succeeded (1,424 modules). Not runtime/device evidence. |

The first sandboxed export attempt reached bundling but Hermes was denied execution by sandbox permissions. It was rerun with approved execution and succeeded. The final successful output is temporary and outside the repository.

### Database safeguard

- `backend/.env.test` does not exist.
- The configured `MONGO_URI` does not specify a dedicated database name.
- Therefore database-mutating tests were deliberately skipped.
- Redispatch route behavior, real Mongoose persistence, dispatch side effects, and historical-record round trips are not claimed as integration-tested.

## 6. Remaining monetary references

### Intentionally retained for backward compatibility

- `backend/src/models/RideBooking.js`: historical optional fare subdocument.
- `backend/test/batch0_contracts.test.js`: proves an old fare-bearing document still validates.
- Legacy `backend/src/models/Ride.js` records are untouched.

### Still requiring removal/deprecation before final acceptance

Backend:

- `backend/src/config/dispatchConfig.js`: shared fare discount setting.
- `backend/src/controllers/driverController.js` and `backend/src/routes/driverRoutes.js`: earnings endpoint.
- `backend/src/controllers/rideController.js`, `backend/src/models/Ride.js`, and `backend/src/models/User.js`: legacy fare, commission, and wallet logic.
- `backend/src/services/pricingService.js`: legacy pricing engine.
- `backend/src/services/incidentService.js` and `backend/src/services/safetyService.js`: fare included in booking projections.
- `backend/src/scripts/seedTestAccounts.js`: wallet balance fixture.
- Existing phase/cron/safety test suites: fare/payment/earnings assertions that must be converted while retaining a historical compatibility fixture.

Frontend:

- `frontend/src/api/services/driverService.js`: earnings client method.
- `frontend/src/api/services/pricingAdapter.js`: pricing adapter.
- `frontend/src/components/passenger/ActivityRideCard.js`, `ActivitySkeletonLoader.js`, and `TripDetailsSheet.js`: history/details fare presentation.
- `frontend/src/screens/driver/RideHistory.js`: earnings API dependency and fare display.
- `frontend/src/screens/driver/DriverSettings.js` and `DriverSupport.js`: earnings/fare copy.
- `frontend/src/screens/passenger/HelpSupportScreen.js` and `frontend/src/screens/auth/TermsPrivacyScreen.js`: fare/pricing copy.
- `frontend/src/components/safety/ReportConcernModal.js` and `SomethingFeelsWrongSheet.js`: overcharging/payment categories require an owner product-policy decision.
- `frontend/src/theme/typography.js`: fare-specific comment only.

Benign textual matches such as “fare-free” and “concurrency” are not monetary dependencies.

## 7. All issue IDs at the Batch 0 gate

| Issue ID | Gate status |
|---|---|
| CR-LOC-001 | Corrected in code; pure/schema tests pass; DB/API/device verification pending. |
| CR-DISP-001 | Corrected in code; mocked controller tests pass; real API/device verification pending. |
| CR-SEC-001 | Corrected in route/helper; pure authorization tests pass; authenticated integration pending. |
| CR-BOOK-001 | Initial duplicate client dispatch removed; durable dispatch idempotency remains later work. |
| CR-GPS-001 | Partially resolved: metadata and server freshness validation added; proactive refresh/reconfirmation UX remains Batch 2/5. |
| CR-ROUTE-002 | Partially resolved: fare mismatch removed and route metrics persisted; endpoint fingerprint/binding remains Batch 2. |
| CR-DISP-003 | Partially resolved: money removed from active offer payload/card; coordinate normalization remains Batch 1. |
| CR-MAP-001 | Unresolved; Batch 2. |
| CR-TRIP-001 | Unresolved; Batch 1. |
| CR-TRIP-002 | Unresolved; Batch 2. |
| CR-DISP-002 | Unresolved; Batch 1. |
| CR-MAP-002 | Unresolved; Batch 2/5. |
| CR-ROUTE-001 | Unresolved infrastructure dependency; Batch 2/owner decision. |
| CR-STATE-001 | Unresolved; Batch 3. |
| CR-STATE-002 | Unresolved; Batch 3/5. |
| CR-TRIP-003 | Unresolved; Batch 1/4. |
| CR-TRIP-004 | Unresolved; Batch 4/5. |
| CR-HIST-001 | Unresolved apart from tracked fare removal; Batch 4/5. |
| CR-SEARCH-001 | Unresolved; Batch 2/5. |
| CR-SEARCH-002 | Unresolved; Batch 2. |
| CR-SEARCH-003 | Unresolved; Batch 2/5. |
| CR-POI-001 | Unresolved pending owner POI evidence; Batch 2. |
| CR-POI-002 | Unresolved; Batch 2/5. |
| CR-DISP-004 | Unresolved; Batch 1/3. |
| CR-TRIP-005 | Unresolved; Batch 3/4. |
| CR-MAP-003 | Unresolved; Batch 2/5. |
| CR-HIST-002 | Unresolved; Batch 5. |

## 8. Unresolved risks and regression risks

- No disposable MongoDB integration evidence; persistence and authorization acceptance criteria remain open.
- The routing provider still relies on public OSRM when ORS is not configured (`CR-ROUTE-001`). Failure is now safe and explicit, but availability is not solved.
- Preview and booking still independently request routes. Persisted booking metrics are authoritative, but endpoint fingerprint/version binding is not implemented yet.
- Old mobile clients that send legacy GPS sources without accuracy/timestamp will now be rejected for new GPS bookings. Historical records remain valid; the current frontend sends the new metadata.
- Server auto-dispatch is fire-and-forget. Removal of the duplicate client dispatch can delay the existing no-driver UI because authoritative timeout/recovery is still `CR-STATE-002`.
- Redispatch is authorized and state-gated but not yet durable/idempotent per offer round.
- Driver availability hydration failure leaves the UI safely offline/unknown while backend state may still be online; recovery/status UI belongs to later batches.
- Existing Driver offer coordinates, legacy polling, TripStop mapping, and active-trip recovery remain unresolved and must not be inferred fixed from this checkpoint.
- Fare references listed above can still appear in history, details, support/legal text, safety categories, legacy APIs, and old tests. Final fare-free acceptance is not met yet.
- Expo export proves bundling only. Authentication, GPS, maps, booking, dispatch, and physical Android behavior remain unverified.

## 9. Approval gate

Batch 1 has not started. Before Batch 1, the owner should review this checkpoint and explicitly approve the canonical location changes, availability separation, fare-free active booking contract, and extension of existing atomic acceptance through durable offers.

**BATCH 0 CHECKPOINT COMPLETE — AWAITING OWNER APPROVAL BEFORE BATCH 1.**
