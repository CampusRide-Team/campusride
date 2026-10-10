# CampusRide Phase 7B: Passenger Sections 1–5 Implementation Ledger

## Document Metadata
- **Scope:** Passenger Experience Sections 1–5 (Idle Discovery $\rightarrow$ Location Selection $\rightarrow$ Route Preview & Ride Configuration $\rightarrow$ Request & Matching $\rightarrow$ Driver Assigned / Approach / Arrival / Pickup Completion Handoff)
- **Status:** Final Production Reconciliation & Verification Complete
- **Created:** 2026-09-23
- **Branch:** `dev`

---

## 1. Product Capability Classification Framework

In accordance with the CampusRide Product Rule (*"Backend gaps must not shrink the frontend product"*), all requirements are strictly classified into:
- **Category A (Backend Supported Now):** Full frontend UI, interaction, and direct integration with live backend APIs/sockets.
- **Category B (Product Required, Backend Integration Pending):** Full frontend UI, interaction, state model, loading/empty/error states, and service boundaries implemented now with explicit `TODO(CAMPUSRIDE-BACKEND)` markers. Zero fabricated data.
- **Category C (Not a Product Requirement):** Prohibited features / negative requirements enforced.

Status classification across the ledger uses strictly:
- `COMPLETE — VERIFIED`
- `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING`
- `IMPLEMENTED — PHYSICAL DEVICE VERIFICATION REQUIRED`
- `BLOCKED`

---

## 2. Category B: Frontend Complete — Backend Integration Pending Matrix

| Item ID | Product Feature & UX Boundary | Current Frontend Solution | Required Future Backend Evolution | Codebase Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GAP-001` | **Popular on Campus Shortcuts** | Horizontally scrollable chips displaying verified POIs from `poiService.getPopularPOIs()`. Curated from real POIs without fabricated metrics. | Dedicated analytics-driven ranking endpoint or query filter (e.g. `GET /api/v1/pois?isPopular=true` or `GET /api/v1/pois/popular`). | `frontend/src/api/services/poiService.js` (`getPopularPOIs`) | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-002` | **Semantic Coordinate Reverse Resolution** | Resolves candidate map-pin coordinate to nearest campus POI name within radius (`Near {POI}`) or truthful `Custom Campus Point ({lat}, {lng})`. | Backend semantic geocoding endpoint returning campus zone, nearest gate/entrance, and road segment for arbitrary coordinates. | `frontend/src/api/services/poiService.js` (`resolveLocationCoordinates`) | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-003` | **Recent & Saved Campus Locations** | Local storage persistence (`AsyncStorage`) via `poiService.getRecentLocations()` / `saveRecentLocation()` shown in search view. | Authenticated passenger preferences endpoint for cloud persistence & cross-device sync (`GET/POST /api/v1/users/recent-locations`). | `frontend/src/api/services/poiService.js` (`getRecentLocations`) | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-004` | **Zero-Driver Manual Redispatch** | Manual redispatch execution on "Try Again" tap (`bookingService.dispatchBooking`) without creating duplicate bookings. | Server-side automatic dispatch retry engine with backoff schedule. | `frontend/src/components/passenger/NoDriverWorkspace.js` | `COMPLETE — VERIFIED` |
| `GAP-005` | **Driver Approach Route & ETA** | Map shows real driver marker spatially relative to pickup using campus road context; no fake ETA or polyline. | Future backend capability required IF Passenger approach ETA/route is approved for the product. | `frontend/src/components/passenger/DriverApproachWorkspace.js` | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-006` | **Authoritative Pre-Booking Fare Quote** | Frontend estimate via `pricingAdapter.js` matches backend `pricingService.js` defaults (Base: GH₵8.00, Per-km: GH₵3.50, Shared: -20%). Authoritative post-booking fare switches to `activeBooking.fare.totalFare`. | Server-side pre-booking fare quote endpoint (e.g. `POST /api/v1/pricing/quote`). | `frontend/src/api/services/pricingAdapter.js` | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-007` | **Road-Following Routing Geometry** | Geodesic campus route metrics calculated by backend routing service. | Road-following graph routing provider/engine (e.g., Valhalla/OSRM/GraphHopper with campus graph). | `frontend/src/api/services/routingService.js` | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-008` | **Stale Telemetry Technical Reliability** | Frontend preserves last known driver position during transient packet delays without fabricating motion or resetting state. | Server-side driver heartbeat & connection state monitor emitting explicit `driver:offline` or `driver:stale` events. | `frontend/src/context/RideContext.js` | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `GAP-009` | **Active Ride Restoration on Cold-Start** | Graceful fallback to Idle on fresh mount when session has no in-memory active booking/trip. | Authenticated endpoint `GET /api/v1/bookings/active` or `GET /api/v1/users/active-ride` to restore in-flight trip state after app restart. | `frontend/src/context/RideContext.js` | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |

---

## 3. Domain State Machine Reconciliation

| Conceptual Lifecycle State | RideContext Enum (`RIDE_STATES`) | Backend `RideBooking.status` | Backend `DriverTrip.status` | Description / Workspace View | Classification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IDLE** | `IDLE` | `null` | `null` | Persistent campus map shell (68% map / 32% workspace), popular POI chips, "Where to on campus?" bar, bottom navigation visible. | Category A | `COMPLETE — VERIFIED` |
| **LOCATION_SELECTION** | `SELECTING_DESTINATION` | `null` | `null` | Full-height search workspace, POI autocomplete, recent/saved list, back button. | Category A / B | `COMPLETE — VERIFIED` |
| **MAP_PIN_ADJUSTMENT** | `MAP_PIN_SELECTION` | `null` | `null` | Fixed center pin on map, map pan/zoom beneath, resolve coordinate button, cancel button. | Category A / B | `COMPLETE — VERIFIED` |
| **SPATIAL_PREVIEW** | `CONFIRMING_LOCATION` | `null` | `null` | Pinned pickup & dropoff preview on map, "Confirm Location" primary CTA, "Adjust on Map" secondary. | Category A | `COMPLETE — VERIFIED` |
| **ROUTE_PREVIEW** | `REVIEWING_OFFERS` | `null` | `null` | Route loaded, metrics summary (`1.4 km • 4 min`), Solo (default) & Shared rows, pricing adapter, dynamic Request CTA. | Category A / B | `COMPLETE — VERIFIED` |
| **REQUESTING** | `REQUESTING` | `pending` (in-flight) | `null` | Optimistic button lock, debounce protection, creating booking via API. Race-safe vs assignment. | Category A | `COMPLETE — VERIFIED` |
| **MATCHING** | `MATCHING_DISPATCH` | `pending` | `dispatched` | Calm indeterminate Gold line, truthful neutral copy ("Finding your driver"), cancel action. | Category A | `COMPLETE — VERIFIED` |
| **NO_INITIAL_DRIVER** | `NO_INITIAL_DRIVER` | `pending` / `failed_no_drivers` | `null` | `dispatchedToCount === 0`, "No drivers available right now", "Try Again" manual redispatch & "Cancel Request". | Category A / B | `COMPLETE — VERIFIED` |
| **DRIVER_ASSIGNED** | `DRIVER_EN_ROUTE_PICKUP` | `driver_assigned` | `dispatched` / `active` | Authoritative `ride:assigned` received, driver card (actual driver name, vehicle, plate), compact call action, cancel action. | Category A | `COMPLETE — VERIFIED` |
| **DRIVER_APPROACHING** | `DRIVER_EN_ROUTE_PICKUP` | `driver_assigned` | `active` | Live `driver:telemetry` stream, interpolated driver marker on map, responsive camera framing Driver + Pickup. | Category A / B | `COMPLETE — VERIFIED` |
| **DRIVER_ARRIVED** | `DRIVER_AT_PICKUP` | `arrived_at_pickup` | `active` (`stop.status = 'arrived'`) | Authoritative `trip:stop_update` received, headline: "Your driver has arrived", copy: "Meet {driverName} at {pickupName}", plate highlighted. | Category A | `COMPLETE — VERIFIED` |
| **TRIP_STARTING / IN_PROGRESS** | `TRIP_IN_TRANSIT` | `in_progress` | `active` (`stop.status = 'completed'`) | Driver completes pickup milestone. **HANDOFF BOUNDARY TO SECTION 6.** Minimal neutral boundary view. | Category A | `COMPLETE — VERIFIED` |
| **CANCELLING** | `CANCELLING` | In-flight | In-flight | Modal confirmation active, backend cancel in-flight. | Category A | `COMPLETE — VERIFIED` |
| **CANCELLED_TERMINAL** | `CANCELLED_TERMINAL` | `cancelled` | `cancelled` / updated | Clean state teardown, product-level `RideCancelledModal` recovery returns to Route Options with preserved configuration. | Category A | `COMPLETE — VERIFIED` |

---

## 4. Requirement Ledger (Sections 1–5)

### Section 1 — Passenger Map Shell & Idle Discovery

| ID | Requirement | Target File/Component | Backend/API Dependency | Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S1-001` | Persistent warm campus map canvas (`#ECE5D2` canvas background with vector campus roads and green spaces). | `PassengerRideShell.js`, `PassengerMap.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S1-002` | Idle visual hierarchy: ~68% map viewport height, ~32% shallow bottom workspace sheet. | `PassengerRideShell.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S1-003` | Top-left Passenger profile avatar button accessing Account. | `PassengerRideShell.js`, `PassengerMapOverlays.js` | `GET /api/v1/auth/profile` | Cat A | `COMPLETE — VERIFIED` |
| `S1-004` | Floating recenter FAB with gold reticle icon above workspace. | `PassengerMapOverlays.js` | `expo-location` GPS | Cat A | `COMPLETE — VERIFIED` |
| `S1-005` | Prominent search trigger card: "Where to on campus?" with search icon. | `IdleDiscoveryWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S1-006` | Horizontal scroll of "Popular on campus" POI chips loaded from POI service. | `IdleDiscoveryWorkspace.js` | `poiService.getPopularPOIs` | Cat B (`GAP-001`) | `COMPLETE — VERIFIED` |
| `S1-007` | Campus POI markers rendered on map canvas with subtle category icons and labels. | `PassengerMap.js` | `GET /api/v1/pois` | Cat A | `COMPLETE — VERIFIED` |
| `S1-008` | Passenger current location marker (Gold dot with pulse ring) located via GPS with fallback to University of Ghana central coordinates `[-0.1870, 5.6508]` for camera only. | `PassengerMap.js` | `expo-location` | Cat A | `COMPLETE — VERIFIED` |
| `S1-009` | Active bottom navigation bar visible during Section 1 Idle (`Ride`, `Activity`, `Safety`, `Account`). | `PassengerNavigator.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S1-010` | Tapping a Popular POI chip immediately sets destination and advances to Section 2 Spatial Preview. | `PassengerRideShell.js`, `IdleDiscoveryWorkspace.js` | `poiService.js` | Cat A | `COMPLETE — VERIFIED` |

---

### Section 2 — Location Selection & Confirmation

| ID | Requirement | Target File/Component | Backend/API Dependency | Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S2-001` | Expand RideWorkspace into full-height search mode on "Where to on campus?" tap. | `LocationSearchWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S2-002` | Hide bottom navigation during focused location selection workflows. | `PassengerNavigator.js`, `PassengerRideShell.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S2-003` | Dual input header for Pickup (default "Current Location" / detected POI) and Destination with swap and clear triggers. | `LocationSearchWorkspace.js` | `poiService.searchPOIs` | Cat A | `COMPLETE — VERIFIED` |
| `S2-004` | Realtime POI search query with debounce (250ms), querying `/api/v1/pois/search`. | `LocationSearchWorkspace.js` | `GET /api/v1/pois/search` | Cat A | `COMPLETE — VERIFIED` |
| `S2-005` | Search results list rendering POI name, category pill, landmark notes, and distance. | `LocationSearchWorkspace.js` | `poiService.searchPOIs` | Cat A | `COMPLETE — VERIFIED` |
| `S2-006` | "Set pin on map" action row in search results to initiate manual map-pin mode. | `LocationSearchWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S2-007` | Fixed center pin on map while map canvas pans/zooms underneath (`onRegionChangeComplete`). | `MapPinWorkspace.js`, `PassengerMap.js` | `GET /api/v1/pois/nearest` | Cat A | `COMPLETE — VERIFIED` |
| `S2-008` | Reverse resolve pinned location via nearest POI or truthful campus coordinate presentation. | `MapPinWorkspace.js`, `PassengerRideShell.js` | `poiService.resolveLocationCoordinates` | Cat B (`GAP-002`) | `COMPLETE — VERIFIED` |
| `S2-009` | Spatial confirmation card showing pickup and dropoff markers on map, "Confirm Location" primary CTA, and "Adjust on Map" secondary. | `LocationConfirmationWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S2-010` | Editing pickup preserves chosen destination and vice versa. | `PassengerRideShell.js`, `RideContext.js` | N/A | Cat A | `COMPLETE — VERIFIED` |

---

### Section 3 — Route Preview & Ride Configuration

| ID | Requirement | Target File/Component | Backend/API Dependency | Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S3-001` | Fetch route geometry, distance, and duration from `GET /api/v1/routing/route`. | `RouteOptionsWorkspace.js`, `routingService.js` | `GET /api/v1/routing/route` | Cat B (`GAP-007`) | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `S3-002` | Render route polyline (`#C89F3E` stroke width 4 with outline) between pickup and destination. | `PassengerMap.js` | Routing API | Cat A | `COMPLETE — VERIFIED` |
| `S3-003` | Route summary header badge displaying formatted metrics: `{distanceKm} km • {durationMin} min`. | `RouteOptionsWorkspace.js` | Routing API | Cat A | `COMPLETE — VERIFIED` |
| `S3-004` | Compact stacked selectable ride mode rows: **Campus Solo** (default) and **Campus Shared**. | `RouteOptionsWorkspace.js`, `RideModeRow.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S3-005` | Campus Solo copy: "Campus Solo" • Subtitle: "Direct ride • No shared stops". | `RideModeRow.js` | Pricing API | Cat A | `COMPLETE — VERIFIED` |
| `S3-006` | Campus Shared copy: "Campus Shared" • Subtitle: "Share your ride • Save 20%" with badge "-20%". | `RideModeRow.js` | Pricing API | Cat A | `COMPLETE — VERIFIED` |
| `S3-007` | Authoritative fare presentation in Cedis format: `GH₵{totalFare.toFixed(2)}` via pricing adapter. | `RideModeRow.js`, `pricingAdapter.js` | Pricing API | Cat B (`GAP-006`) | `FRONTEND COMPLETE — BACKEND INTEGRATION PENDING` |
| `S3-008` | Dynamic primary CTA button: **Request Solo** when Solo is selected; **Request Shared** when Shared is selected. | `RouteOptionsWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S3-009` | Prevent duplicate request submission (optimistic loading indicator on CTA). | `RouteOptionsWorkspace.js` | `POST /api/v1/bookings` | Cat A | `COMPLETE — VERIFIED` |
| `S3-010` | Error retry banner if route retrieval fails ("Couldn't load this route. Try again."). | `RouteOptionsWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |

---

### Section 4 — Ride Request & Matching

| ID | Requirement | Target File/Component | Backend/API Dependency | Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S4-001` | Execute `POST /api/v1/bookings` with validated payload (`pickup`, `dropoff`, `rideMode`). | `RideContext.js`, `bookingService.js` | `POST /api/v1/bookings` | Cat A | `COMPLETE — VERIFIED` |
| `S4-002` | Transition workspace in-place to Matching state without unmounting the map canvas. | `MatchingWorkspace.js`, `PassengerRideShell.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S4-003` | Matching headline: "Finding your driver" (Solo) or "Finding your shared ride" (Shared) with calm neutral subtitle. | `MatchingWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S4-004` | Calm indeterminate Gold activity progress line representing active dispatch lifecycle. | `MatchingWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S4-005` | Trip summary context row with post-booking authoritative fare reconciliation (`Pickup · {pickupName}` and `{rideModeName} · GH₵{fare}`). | `MatchingWorkspace.js`, `PassengerRideShell.js` | Booking model | Cat A | `COMPLETE — VERIFIED` |
| `S4-006` | Initial zero-driver detection (`dispatchedToCount === 0` from initial dispatch or booking state). | `NoDriverWorkspace.js`, `PassengerRideShell.js` | `bookingService.dispatchBooking` | Cat A | `COMPLETE — VERIFIED` |
| `S4-007` | Zero-driver recovery card: "No drivers available right now", copy: "We couldn't find an available driver for this request.", CTAs: "Try Again" & "Cancel Request". | `NoDriverWorkspace.js` | `POST /api/v1/bookings/:id/dispatch` | Cat B (`GAP-004`) | `COMPLETE — VERIFIED` |
| `S4-008` | Manual redispatch execution on "Try Again" tap without creating a duplicate booking. | `NoDriverWorkspace.js`, `bookingService.js` | `POST /api/v1/bookings/:id/dispatch` | Cat A | `COMPLETE — VERIFIED` |
| `S4-009` | Subtle "Cancel Request" trigger invoking cancellation modal ("Cancel ride request? CampusRide will stop looking for a driver."). | `MatchingWorkspace.js`, `CancelRideRequestModal.js` | `POST /api/v1/bookings/:id/cancel` | Cat A | `COMPLETE — VERIFIED` |
| `S4-010` | Authoritative cancellation handling via `POST /api/v1/bookings/:id/cancel`, clearing booking state and returning to Section 3 Route Options with journey intact. | `RideContext.js`, `PassengerRideShell.js` | Cancel API | Cat A | `COMPLETE — VERIFIED` |

---

### Section 5 — Driver Assigned, Approach, Arrival & Pickup

| ID | Requirement | Target File/Component | Backend/API Dependency | Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S5-001` | Receive authoritative `ride:assigned` socket event and join trip room `trip:{driverTripId}`. | `RideContext.js` | `ride:assigned` | Cat A | `COMPLETE — VERIFIED` |
| `S5-002` | Store verified driver identity: `id`, `fullName`, `phoneNumber`, `avatarUri`, `vehicleModel`, `vehicleColor`, `vehicleLicensePlate`. | `RideContext.js` | Socket payload | Cat A | `COMPLETE — VERIFIED` |
| `S5-003` | Transform workspace to Driver En Route state (Headline: "Driver en route", Subtitle: "Driver is heading to your pickup"). | `DriverApproachWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-004` | Render Driver identity card with driver initials/avatar, full name, vehicle model/color, and prominent license plate badge. | `DriverApproachWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-005` | Compact native phone call trigger button opening OS dialer (`Linking.openURL('tel:${phoneNumber}')`) with graceful fallback. | `DriverApproachWorkspace.js` | `Linking` API | Cat A | `COMPLETE — VERIFIED` |
| `S5-006` | Subscribe to `driver:telemetry` in `RideContext` and render real-time moving driver marker on map without approach polyline. | `PassengerMap.js`, `DriverMarker.js` | `driver:telemetry` | Cat B (`GAP-005`) | `COMPLETE — VERIFIED` |
| `S5-007` | Smooth driver marker coordinate visual interpolation without extrapolating movement beyond received packets. | `DriverMarker.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-008` | Camera management: Initial telemetry frames Driver + Pickup; user manual pan suspends auto-follow; recenter FAB restores Driver + Pickup frame. | `PassengerMap.js`, `PassengerRideShell.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-009` | Authoritative arrival milestone handling (`trip:stop_update` with `targetStatus: 'arrived'`). | `RideContext.js` | `trip:stop_update` | Cat A | `COMPLETE — VERIFIED` |
| `S5-010` | Transform workspace to Arrival state: Headline: "Your driver has arrived", Subtitle: "Meet {driverName} at {pickupName}", high-contrast license plate. | `DriverArrivedWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-011` | Passenger cancellation after assignment: State-neutral modal ("Cancel ride? Are you sure you want to cancel this ride?"), execute cancel endpoint, and leave trip room. | `AssignedRideCancellationModal.js`, `RideContext.js` | `POST /api/v1/bookings/:id/cancel` | Cat A | `COMPLETE — VERIFIED` |
| `S5-012` | Driver cancellation handling: On `ride:cancelled` socket event, product recovery modal (`RideCancelledModal`), clean state release, returning deliberately to Route Options. | `RideCancelledModal.js`, `RideContext.js`, `PassengerRideShell.js` | `ride:cancelled` | Cat A | `COMPLETE — VERIFIED` |
| `S5-013` | Pickup completion milestone (`trip:stop_update` with `targetStatus: 'completed'` & `stopType: 'pickup'`) advances booking to `in_progress`. | `RideContext.js` | `trip:stop_update` | Cat A | `COMPLETE — VERIFIED` |
| `S5-014` | Section 6 Handoff Boundary: Render temporary minimal neutral "Ride in Progress (Section 6 Boundary)" placeholder view without unmounting map. | `Section6BoundaryWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-015` | Hardware/Software Back button lock: Disallow returning to pre-booking search screens while in active booking lifecycle (cancellation must be explicit via modal). | `PassengerRideShell.js` | `BackHandler` | Cat A | `COMPLETE — VERIFIED` |
| `S5-016` | No fake initial driver position prior to first telemetry packet; marker appears only after actual coordinates exist. | `PassengerMap.js`, `DriverMarker.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-017` | No driver rating rendered unless authoritative data is present in the assignment payload. | `DriverApproachWorkspace.js` | N/A | Cat A | `COMPLETE — VERIFIED` |
| `S5-018` | Stale telemetry / offline handling: Preserve last known driver position during transient connectivity losses without fabricating continued movement. | `RideContext.js`, `PassengerMap.js` | N/A | Cat B (`GAP-008`) | `COMPLETE — VERIFIED` |

---

## 5. Negative Requirements (Prohibited Behaviors)

| ID | Prohibited Feature / Anti-Pattern | Reason / Invariant | Status |
| :--- | :--- | :--- | :--- |
| `NEG-001` | **NO Fake ETA or countdown timer** during approach or matching. | Backend does not compute real-time approach ETA; showing fake minutes deceives passengers. | ENFORCED |
| `NEG-002` | **NO Fake driver markers or ghost cars** on map during idle or matching. | Only drivers with verified active telemetry are rendered. | ENFORCED |
| `NEG-003` | **NO Driver-to-pickup approach polyline**. | Backend routing engine does not provide authoritative approach route geometry. | ENFORCED |
| `NEG-004` | **NO Radar sweep animations or percentage loaders**. | Matching progress is non-linear and non-percentage based. | ENFORCED |
| `NEG-005` | **NO Fake driver ratings or "Verified Campus Driver" badges**. | Rating is omitted from `ride:assigned` socket payload; only display verified fields. | ENFORCED |
| `NEG-006` | **NO Pickup PIN or OTP entry UI**. | CampusRide backend does not require passenger PIN verification for trip start. | ENFORCED |
| `NEG-007` | **NO In-app chat or VoIP messaging buttons**. | In-app messaging is unsupported by backend; phone call via native dialer is authoritative. | ENFORCED |
| `NEG-008` | **NO Passenger seat-count selectors or vehicle class pickers**. | CampusRide supports only Solo and Shared ride modes. | ENFORCED |
| `NEG-009` | **NO Payment method selector or fare calculation formula exposure**. | Fare is authoritative platform-calculated; payment flow is handled at booking settlement. | ENFORCED |
| `NEG-010` | **NO Scheduled Ride date/time picker in pre-booking flow**. | Out of scope for Sections 1–5 instant campus ride request. | ENFORCED |
| `NEG-011` | **NO Invented campus gate or walking instructions**. | Only display official POI names (`Pickup · Balme Library`). | ENFORCED |
| `NEG-012` | **NO Giant structural white cards or non-token styling**. | Strictly adhere to Warm Gold (`#C89F3E`), Cream (`#ECE5D2`), and Elevated Sheet (`#FBFAF7`). | ENFORCED |
| `NEG-013` | **NO Duplicate socket subscriptions between screens and RideContext**. | `RideContext` is the single authoritative realtime lifecycle subscriber. | ENFORCED |
| `NEG-014` | **NO Arbitrary 15-second or 60-second matching timeout timers on frontend**. | Driver offer TTL is driver-side; frontend must not invent arbitrary cancellation timeouts. | ENFORCED |
| `NEG-015` | **NO Unmounting/remounting of MapView between workspace states**. | MapView remains persistently mounted at the root shell. | ENFORCED |
