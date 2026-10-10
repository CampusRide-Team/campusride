# CampusRide Android Connectivity — Root Cause and Fix

Date: 2026-10-09

## Outcome

The laptop backend and corrected Android JavaScript bundle are ready for physical-device verification on the current Wi-Fi network. Physical Android authentication, authenticated Socket.IO, Driver Online, GPS telemetry, and dispatch retrieval remain **BLOCKED** until the owner loads the clean Metro bundle and signs in with a valid Driver account.

This report does not claim physical-device success.

## Evidence status legend

- **PASS** — directly executed and verified.
- **FAIL** — directly executed and failed.
- **BLOCKED** — requires unavailable device access, credentials, or infrastructure.
- **NOT TESTED** — not attempted.

## Confirmed root causes

### RC-1 — Backend process was not running

**PASS (reproduced and corrected).** At the start of the investigation, both `127.0.0.1:5000/api/health` and the configured LAN endpoint refused connections because no process was listening on port 5000. The backend was started from the current repository. It connected to MongoDB and is now listening on port 5000.

This was a transport-layer failure before Express, authentication, or Socket.IO could process a request.

### RC-2 — The laptop IPv4 address changed while the frontend retained the old address

**PASS (reproduced and corrected for the current network).** The frontend was configured for `http://192.168.67.5:5000`. During live verification, Windows reported the active Wi-Fi IPv4 address as `10.18.196.27`. The old address timed out; the new address returned HTTP 200 from `/api/health` and HTTP 200 from the Engine.IO polling handshake.

`frontend/.env` now uses:

```text
EXPO_PUBLIC_API_URL=http://10.18.196.27:5000
```

This LAN address is network-specific. It will not survive another DHCP/network change. A stable HTTPS deployment or explicitly authorized managed tunnel is still required for cross-network permanence.

### RC-3 — Metro reused a stale environment transform

**PASS (reproduced and corrected).** An Android export performed after editing `.env`, but without clearing Metro's cache, still embedded `http://192.168.67.5:5000`. A subsequent export with `--clear` embedded only `http://10.18.196.27:5000`.

This proves that editing `.env` or performing a normal reload is insufficient when the environment substitution remains cached. Metro must be restarted with `--clear` after changing `EXPO_PUBLIC_*` values.

### RC-4 — Passenger and Driver login screens violated the backend login contract

**PASS (reproduced by contract probe and corrected).** Both active login screens sent:

```json
{ "identifier": "...", "password": "...", "role": "..." }
```

The backend login controller requires the field `email` (which accepts email or phone content). A live request using the old shape returned HTTP 400 `MISSING_CREDENTIALS`. The same request using the canonical `email` shape reached credential validation and returned HTTP 401 `AUTH_FAILED` for the deliberately invalid probe account.

Both screens now call the existing `authService.login()`, which maps `identifier` to `email`. No backend contract was changed.

## Runtime configuration trace

### REST

`frontend/.env` → Expo environment substitution → `getApiBaseUrl()` in `frontend/src/api/axios.js` → Axios base URL → `/api/v1/` request prefix → Express routes.

The clean verified bundle contains `http://10.18.196.27:5000`. It does not contain the old `192.168.67.5` origin or Android-emulator `10.0.2.2` fallback.

The actual bundle currently running on the owner's phone is **BLOCKED** from inspection. The Metro development console now reports the resolved origin, platform, request method/path, response status, and transport-error category without logging tokens.

### Socket.IO

The same `getApiBaseUrl()` value → `socketHelper.js` → Socket.IO Engine.IO polling negotiation → WebSocket upgrade when available → JWT in Socket.IO `auth` → server authentication middleware → user and trip rooms.

REST and Socket.IO therefore share one configured origin. The client now uses polling-first negotiation, `tryAllTransports`, sustained reconnection, diagnostic failure reasons, and forced reauthentication when the stored JWT changes.

## Android native network security

| Check | Status | Evidence |
|---|---|---|
| Expo configuration inspected | PASS | `frontend/app.json` has Expo SDK 54/MapLibre configuration and no explicit cleartext policy. |
| Generated Android project inspected | BLOCKED | No `frontend/android` directory exists. |
| Installed APK manifest inspected | BLOCKED | No local APK, `adb`, `aapt`, or Android SDK platform tools were available. |
| Android logcat checked for cleartext rejection | BLOCKED | No ADB/device control. |
| Cleartext HTTP proven inside the app | BLOCKED | A phone browser health check does not prove Android app network policy. |

No speculative native policy change was made. A new APK is not required for the JavaScript/environment/auth fixes. If the new diagnostics or logcat report `CLEARTEXT communication not permitted`, an explicit development-only Android network policy and a rebuilt development client will be required.

## Backend and database findings

- **PASS:** backend starts from current source and listens on port 5000 without a loopback-only host override.
- **PASS:** current LAN `/api/health` returns 200.
- **PASS:** current LAN Engine.IO polling handshake returns 200 and advertises WebSocket upgrade.
- **PASS:** protected Driver profile, availability, notification, and dispatch-offer routes are registered; unauthenticated probes reached them and returned 401 rather than 404.
- **PASS:** backend logs recorded the executed health/auth/protected-route probes, proving Express request reception from the laptop test path.
- **PASS:** Mongoose connected to the configured Atlas replica set. The configured database name is `campusride`; the local URI uses standard `mongodb` format with three hosts. No full URI or credentials were printed in this report.
- **PASS:** no database-mutating test was run against Atlas.
- **Security note:** `backend/src/scripts/seedTestAccounts.js` contains development credentials in source. They were not included here and should be removed/rotated before production distribution.

## Files modified

1. `frontend/.env` — changed only the local API origin to the current Wi-Fi IPv4 address.
2. `frontend/src/screens/auth/PassengerLogin.js` — use canonical auth service and accurate error categorization.
3. `frontend/src/screens/auth/DriverLogin.js` — use canonical auth service and accurate error categorization.
4. `frontend/src/api/axios.js` — common API-origin constant plus development-only, token-safe REST diagnostics.
5. `frontend/src/api/socketHelper.js` — transport diagnostics, polling-first fallback, token-change reauthentication, and reconnect visibility.
6. `frontend/test/authConnectivityContract.test.js` — regression checks for login payload mapping and shared REST/Socket origin.
7. `CAMPUSRIDE_ANDROID_CONNECTIVITY_ROOT_CAUSE_AND_FIX.md` — this report.
8. `CAMPUSRIDE_CONNECTIVITY_VERIFICATION_REPORT.md` — verification matrix and owner procedure.

No backend source, UI layout, Expo version, MapLibre configuration, fare-free behavior, or database record was changed. Nothing was staged, committed, or pushed.

## Verification results

### REST and route reception

| Verification | Status | Result |
|---|---|---|
| `GET http://10.18.196.27:5000/api/health` | PASS | HTTP 200. |
| Engine.IO polling handshake | PASS | HTTP 200; packet type `0`; WebSocket upgrade advertised. |
| Old login payload shape | PASS | Reproduced HTTP 400 `MISSING_CREDENTIALS`. |
| Canonical login payload shape | PASS | Reached authentication and returned expected HTTP 401 for invalid probe credentials. |
| Protected Driver route without token | PASS | HTTP 401 `AUTH_NO_TOKEN`, proving route registration. |
| Valid Passenger authentication | BLOCKED | No valid disposable credentials/device session. |
| Valid Driver authentication | BLOCKED | No valid disposable credentials/device session. |
| Authenticated Driver profile/availability/GPS/notifications/offers | BLOCKED | Requires valid Driver JWT and physical-device flow. |

### Socket.IO

| Verification | Status | Result |
|---|---|---|
| Engine.IO transport reachability | PASS | Polling handshake succeeds and advertises WebSocket. |
| Shared REST/Socket origin | PASS | Automated source contract check passes. |
| Authenticated Socket.IO connection | BLOCKED | No valid JWT was available. |
| Reconnection and room restoration on phone | BLOCKED | Requires device/network interruption test. |
| No duplicate event processing | BLOCKED | Requires authenticated offer/trip flow. |

### Tests and build validation

- **PASS:** `node --test test/authConnectivityContract.test.js test/locationSelection.test.js test/routeSelection.test.js test/safetyLifecycleTransitions.test.js` — 25 passed, 0 failed, 0 skipped.
- **PASS:** `node --test test/batch0_contracts.test.js test/remediation_contracts.test.js test/routing_service_provider.test.js` — 17 passed, 0 failed, 0 skipped.
- **PASS:** `npx --no-install expo install --check` — dependencies are up to date for SDK 54.
- **PASS:** installed versions include Expo 54.0.37, React 19.1.0, React Native 0.81.5, Axios 1.18.1, Socket.IO client 4.8.3, and MapLibre 11.3.10.
- **PASS:** clean Android JavaScript export completed (1,424 modules) and embeds `http://10.18.196.27:5000`.
- **PASS:** Metro was restarted with an empty cache and is reachable at both `127.0.0.1:8081/status` and `10.18.196.27:8081/status` (`packager-status:running`).
- **BLOCKED:** APK build/install — no native change was demonstrated and no local Android toolchain/device bridge was available, so an unnecessary rebuild was not started.

## Required owner verification

1. Put the phone and laptop on the same current Wi-Fi network.
2. On the phone browser, open `http://10.18.196.27:5000/api/health`. Stop if it does not return the live health response; campus Wi-Fi client isolation or Windows firewall may prevent peer access.
3. Metro is currently running and LAN-reachable at `http://10.18.196.27:8081`. Connect the development client to that server URL. If this task's Metro process has stopped, restart it from `C:\Users\Hyp Er\Desktop\campusride\frontend` with:

   ```powershell
   .\node_modules\.bin\expo.cmd start --clear --dev-client --lan
   ```

4. Force-close CampusRide, open the installed development build, and connect it to this exact Metro session. Do not reuse an older Metro QR/session.
5. Confirm the Metro console prints the REST origin `http://10.18.196.27:5000`.
6. Sign in using a valid Driver account. Confirm HTTP responses appear rather than a generic transport error.
7. Confirm Driver profile hydration, explicit Online switch, GPS upload, authenticated Socket.IO connection, and pending-offer retrieval.
8. Turn Wi-Fi off briefly, then restore it. Confirm controlled retries, Socket.IO reconnection, profile reconciliation, and no duplicate offer.
9. If the app still fails, provide the new `[CampusRide Network] REST failure` and `Socket connection notice` objects. They intentionally contain no JWT or password.

## Remaining blockers and risks

- **BLOCKED:** all physical Android acceptance criteria until the owner completes the steps above.
- **BLOCKED:** authenticated tests until a valid Driver/Passenger session is available. The live Atlas database was not seeded or modified.
- **Risk:** `10.18.196.27` is a DHCP address. A network change requires updating `.env` and restarting Metro with `--clear` unless the backend is moved behind a stable HTTPS origin.
- **Risk:** campus/enterprise Wi-Fi may isolate peer devices even when both appear on the same SSID. If phone-browser health fails, use a private hotspot/LAN or a stable HTTPS backend deployment.
- **Unverified risk:** Android cleartext policy. Only device logs or an inspected APK can resolve it.

## Definition-of-done status

Backend reachability, current bundle origin, login request serialization, SDK compatibility, transport handshake, and Android bundling are **PASS**. The end-to-end physical Android sequence is **BLOCKED**, not complete, pending owner device verification.
