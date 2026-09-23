# CAMPUSRIDE — FRONTEND BASELINE DOCUMENTATION CHECKPOINT

**Date:** 2026-09-23  
**Branch:** `dev` (Tracking `origin/dev`)  
**Status:** In Development — Checkpoint Baseline Established  

---

## 1. ARCHITECTURE OVERVIEW

### Application Entry & Context Tree
- **Entry Point:** `frontend/index.js` -> `frontend/App.js`
- **Font System:** Google Manrope font suite (`200ExtraLight`, `300Light`, `400Regular`, `500Medium`, `600SemiBold`, `700Bold`, `800ExtraBold`) loaded synchronously before render.
- **Context Hierarchy:**
  ```text
  SafeAreaProvider
    └── AuthProvider (Session, JWT persistence, token injection, role normalization)
          └── ThemeProvider (Canonical theme tokens, light/dark state)
                └── RideProvider (Ride state machine, active trip telemetry, socket lifecycle)
                      └── AppContent (Push notification registration)
                            └── RootNavigator (Dynamic role-based router)
  ```

---

## 2. NAVIGATION ARCHITECTURE

### Root Navigation Router (`RootNavigator.js`)
- Evaluates `isLoggedIn` and `role`:
  - `!isLoggedIn` $\rightarrow$ `AuthNavigator`
  - `isLoggedIn && role === 'driver'` $\rightarrow$ `DriverNavigator`
  - `isLoggedIn && role === 'passenger'` $\rightarrow$ `PassengerNavigator`
- **Global Interceptor:** Catches `403 ACCOUNT_SUSPENDED` from Axios and opens `AccountSuspendedModal`.

### Authentication & Onboarding Stack (`AuthNavigator.js`)
- **Status:** **Fully Implemented & Modernized**
- **Screen Inventory & Sequence:**
  1. `SplashScreen` $\rightarrow$ Checks onboarding version key (`onboarding_version: 1`).
  2. `Onboarding` $\rightarrow$ 3-slide animated carousel (`onboarding_stop_waiting.png`, `onboarding_book_instantly.png`, `onboarding_ride_safe.png`).
  3. `RoleSelection` $\rightarrow$ Passenger vs. Driver portal selection.
  4. `AuthGatewayScreen` $\rightarrow$ Continue with Phone, Google Auth (scaffolded notice), or Sign In.
  5. `PhoneInputScreen` $\rightarrow$ Ghana phone input (`+233...`) with network validation.
  6. `OTPVerificationScreen` $\rightarrow$ 6-digit OTP verification (supports temporary dev bypass when configured).
  7. `NameInputScreen` $\rightarrow$ Full name input.
  8. `EmailInputScreen` $\rightarrow$ Email address validation.
  9. `ProfilePhotoScreen` $\rightarrow$ Avatar selection / optional skip.
  10. `SetPasswordScreen` $\rightarrow$ Password creation with real-time requirement checklist.
  11. `TermsPrivacyScreen` $\rightarrow$ Terms & Conditions / Privacy acceptance.
  12. `DriverDetailsScreen` (Driver only) $\rightarrow$ Personal driver information.
  13. `VehicleDetailsScreen` (Driver only) $\rightarrow$ Vehicle make, model, license plate, color, capacity.
  14. `DriverDocumentsScreen` (Driver only) $\rightarrow$ Document image uploads (license, Ghana card, insurance).
  15. `DriverVerificationPendingScreen` $\rightarrow$ Review hero illustration (`application_under_review.png`) & truth-in-advertising timeline.
  16. `SignInScreen` $\rightarrow$ Supports Email OR Phone + Password authentication for Passenger/Driver.
  17. `ForgotPasswordScreen` $\rightarrow$ Recovery code dispatch.
  18. `RecoveryOTP` $\rightarrow$ Recovery OTP verification.
  19. `ResetPasswordScreen` $\rightarrow$ New password input.
  20. `PasswordUpdatedScreen` $\rightarrow$ Password recovery success confirmation.

### Passenger Navigation (`PassengerNavigator.js`)
- **Tab Navigator (`PassengerTabs`):**
  - `HomeTab` (`PassengerHome.js`) — Interactive campus map, active drivers, ride search.
  - `ActivityTab` (`RideBooking.js`) — Booking history & active ride state.
  - `SafetyTab` (`AlertScreen.js`) — Campus safety & SOS controls.
  - `ProfileTab` (`ProfileScreen.js`) — User profile, settings, logout.
- **Stack Sub-Screens:**
  - `EditProfileScreen`, `HelpSupportScreen`, `SettingsScreen`.

### Driver Navigation (`DriverNavigator.js`)
- **Tab Navigator (`DriverTabs`):**
  - `DriverHomeTab` (`DriverHome.js`) — Online/offline toggle, dispatch radar, telemetry.
  - `RequestsTab` (`ActiveRequests.js`) — Pending dispatch ride requests.
  - `DriverProfileTab` (`DriverProfile.js`) — Driver stats, ratings, earnings summary.
- **Stack Sub-Screens:**
  - `ActiveRequests`, `DriverNavigation`, `TripSummary`, `RideHistory`, `DriverNotis`, `DriverSupport`, `EditDriverProfile`, `DriverSettings`.

---

## 3. DESIGN SYSTEM & ASSET INVENTORY

### Canonical Design System (`frontend/src/theme/`)
- **Canvas Background:** Continuous `#ECE5D2` (warm cream canvas across all auth screens).
- **Primary Brand Gold:** `#C89F3E` (CTAs, primary actions, active states).
- **Surface Cards:** `#FFFFFF` with `#D8D2C3` subtle borders and 16px radius pills.
- **Typography:** Google Manrope with clear typographic scale (24px titles, 15px subtitles, 14px body).
- **Reusable Component Suite:** `CRButton`, `CRInput`, `CRCard`, `CRBadge`, `CRBottomSheet`, `CRHeader`, `CRIcon`, `CRLoadingState`, `CRModal`.

### Verified Assets
- `frontend/assets/brand/wordmark_transparent.png` (Crisp white "Campus" and gold "Ride").
- `frontend/assets/images/application_under_review.png` (Driver verification illustration).
- `frontend/assets/images/auth_gateway_safety.png` (Safety gateway character illustration).
- `frontend/assets/images/role_selection_campus.png` (Role selection header illustration).
- `frontend/assets/images/onboarding_stop_waiting.png` (Slide 1).
- `frontend/assets/images/onboarding_book_instantly.png` (Slide 2).
- `frontend/assets/images/onboarding_ride_safe.png` (Slide 3).

---

## 4. BACKEND INTEGRATION & REALTIME STATUS

### API Client (`frontend/src/api/axios.js`)
- Base URL normalized via `EXPO_PUBLIC_API_URL` with runtime fallback (`10.0.2.2:5000` on Android emulator).
- Automatic JWT injection from AsyncStorage across all authenticated requests.
- Automatic multipart boundary management for `FormData` file uploads.
- Human-readable error formatting via `formatApiError`.

### Realtime Socket (`frontend/src/api/socketHelper.js` & `RideContext.js`)
- Authenticated singleton WebSocket connection using `socket.io-client`.
- Event handling for: `ride:assigned`, `driver:telemetry`, `trip:stop_update`, `trip:status_change`, `ride:cancelled`, `ride:completed`.

---

## 5. FEATURE STATUS MATRIX

| Feature / Screen Flow | Implementation State | Notes |
| :--- | :--- | :--- |
| **Splash & Onboarding** | **Implemented** | Animated, responsive, persistent versioning check |
| **Role Selection & Gateway** | **Implemented** | Clean modal for Google Auth notice, seamless transitions |
| **Progressive Registration** | **Implemented** | 7-step passenger & 10-step driver onboarding on cream canvas |
| **Sign In & Auth Persistence** | **Implemented** | Supports Email OR Phone + Password; persistent storage |
| **Driver Approval State Handling** | **Implemented** | Direct routing; no `PENDING_APPROVAL` for approved drivers |
| **Password Recovery Flow** | **Partially Implemented** | UI complete; uses fallback until dedicated backend routes exist |
| **Passenger Home & Map UI** | **Legacy / Partially Aligned** | Functional map; needs visual alignment to new cream design system |
| **Ride Booking & Dispatch Flow**| **Partially Implemented** | `RideContext` state machine ready; needs operational UI refresh |
| **Driver Home & Availability**  | **Legacy / Partially Aligned** | Online toggle & socket radar functional; legacy styling present |
| **Active Ride Navigation**      | **Partially Implemented** | Prop-based routing in place; live routing polish needed |
| **Driver Profile & Earnings**   | **Partially Implemented** | Data rendering functional; UI uses older theme tokens |
| **Push Notifications**          | **Implemented (Scaffold)** | Expo push token registration linked on driver login |

---

## 6. KNOWN TECHNICAL & UX DEBT

1. **Dual-Layer Socket Handling:** `PassengerHome.js` and `DriverHome.js` attach direct socket listeners instead of delegating 100% of telemetry/dispatch to `RideContext.js`.
2. **Operational Screen Styling:** `PassengerHome`, `DriverHome`, `RideBooking`, and profile sub-screens still contain legacy hardcoded colors (`#10206B`, `#2F6BFF`, `#B6E84A`) and white card wrappers.
3. **Tab Navigation Redundancy:** `PassengerHome.js` has an internal tab switcher that duplicates `PassengerNavigator.js` bottom tab navigation.
4. **Unnormalized Asset Files:** Raw user-uploaded assets with unnormalized spaces exist untracked in `frontend/assets/images/` and should be excluded from version control.

---

## 7. RECOMMENDED NEXT DEVELOPMENT FOCUS

**Focus Area:** **Operational Passenger Experience Refactor (`PassengerHome.js` & `RideBooking.js`)**
- Align `PassengerHome` to the canonical `#ECE5D2` continuous design language.
- Consolidate socket subscriptions and booking state into `RideContext.js`.
- Remove redundant internal tab management in favor of `PassengerNavigator`.
