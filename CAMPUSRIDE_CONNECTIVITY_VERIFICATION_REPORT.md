# CampusRide Connectivity Verification Report

Date: 2026-10-09  
Scope: Android development client connectivity recovery

## Prior report availability

The following requested historical reports were not present in the repository and therefore could not be used as evidence:

- `CAMPUSRIDE_CONNECTIVITY_DIAGNOSTIC.md`
- previous `CAMPUSRIDE_CONNECTIVITY_VERIFICATION_REPORT.md`
- `CAMPUSRIDE_E2E_EXECUTION_REPORT.md`
- `CAMPUSRIDE_E2E_DEFECT_REGISTER.md`

`CAMPUSRIDE_FULL_REMEDIATION_REPORT.md` was present and reviewed. This file is the current replacement verification report.

## Current configuration

| Item | Verified value |
|---|---|
| Expo SDK | 54.0.37 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| Current laptop Wi-Fi IPv4 | `10.18.196.27` |
| Configured REST origin | `http://10.18.196.27:5000` |
| Configured Socket.IO origin | `http://10.18.196.27:5000` |
| Backend port | 5000 |
| MongoDB target | Atlas, database `campusride` |

## Verification matrix

| Area | Status | Evidence |
|---|---|---|
| Backend startup | PASS | Current repository server is running and connected to MongoDB. |
| Local health | PASS | HTTP 200. |
| Current LAN health | PASS | HTTP 200 at `10.18.196.27:5000/api/health`. |
| Old LAN origin | FAIL | `192.168.67.5` timed out after the network changed. |
| Engine.IO polling reachability | PASS | HTTP 200 with WebSocket upgrade advertised. |
| Route registration | PASS | Protected Driver routes return 401 without a token, not 404. |
| Login request contract | PASS | Screens now use the service that maps `identifier` to backend `email`. |
| Metro environment refresh | PASS | A non-cleared export retained the old IP; clean export embeds the new IP. |
| Metro LAN availability | PASS | Clean Metro is running and LAN `/status` returns `packager-status:running`. |
| Android export | PASS | 1,424 modules bundled successfully after `--clear`. |
| SDK dependency compatibility | PASS | Local Expo check reports dependencies are up to date. |
| Frontend tests | PASS | 25/25 passed. |
| Backend non-mutating contract tests | PASS | 17/17 passed. |
| MongoDB-mutating integration tests | NOT TESTED | No verified disposable MongoDB environment; live Atlas was protected. |
| Physical Android REST | BLOCKED | Owner/device action required. |
| Physical Android auth | BLOCKED | Owner/device and valid account required. |
| Authenticated Socket.IO | BLOCKED | Valid JWT/device required. |
| Driver Online and GPS | BLOCKED | Valid Driver session/device required. |
| Dispatch offer retrieval/delivery | BLOCKED | Valid Driver session and dispatch fixture required. |
| Android cleartext policy | BLOCKED | No APK manifest, ADB, or logcat access. |

## Exact commands that passed

```powershell
cd "C:\Users\Hyp Er\Desktop\campusride\frontend"
node --test test/authConnectivityContract.test.js test/locationSelection.test.js test/routeSelection.test.js test/safetyLifecycleTransitions.test.js
npx --no-install expo install --check
npx expo export --platform android --clear --output-dir .expo-connectivity-verification-cleared
```

```powershell
cd "C:\Users\Hyp Er\Desktop\campusride\backend"
node --test test/batch0_contracts.test.js test/remediation_contracts.test.js test/routing_service_provider.test.js
```

## Owner test command

Metro is currently running and reachable at `http://10.18.196.27:8081`. Use that address in the installed development client. If the process is no longer running, start it with:

```powershell
cd "C:\Users\Hyp Er\Desktop\campusride\frontend"
.\node_modules\.bin\expo.cmd start --clear --dev-client --lan
```

Before opening CampusRide, confirm the phone browser can load:

```text
http://10.18.196.27:5000/api/health
```

Then connect the installed development build to the newly started Metro session and verify, in order:

1. Metro logs REST origin `http://10.18.196.27:5000`.
2. Driver login returns an HTTP result and succeeds with valid credentials.
3. Driver profile hydrates while remaining Offline until explicitly changed.
4. Online switch succeeds and persists on the backend.
5. GPS telemetry is accepted.
6. The console logs an authenticated Socket.IO connection and active transport.
7. Pending dispatch offers load.
8. A short network interruption recovers without uncontrolled polling or duplicate events.

## Rebuild decision

No new APK was built. The confirmed corrections are JavaScript/environment changes, which the existing development client can load from Metro. A native rebuild becomes necessary only if physical-device diagnostics prove an Android cleartext-policy failure or another native configuration mismatch.

## Final status

Laptop/backend and clean Android bundle verification: **PASS**.  
Physical Android end-to-end connectivity: **BLOCKED — owner verification required**.  
Cross-network permanence with a DHCP LAN address: **FAIL — requires a stable HTTPS backend origin**.
