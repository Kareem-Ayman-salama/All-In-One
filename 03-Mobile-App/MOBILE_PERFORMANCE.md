# Mobile Performance

## Budgets

| Area | Budget |
|---|---|
| Cold start to first meaningful screen | Under 3 seconds on mid-range devices. |
| Authenticated home refresh | Under 1.5 seconds after cached shell appears. |
| Course catalog first page | Under 2 seconds on staging network. |
| Route transition jank | No sustained frames over 16 ms on common devices. |
| Protected content open | Metadata under 1 second, viewer URL only after authorization. |

## Implemented Foundation

- Course catalog and notification requests use paginated backend contracts.
- API repositories keep Dio calls outside widgets.
- Tenant cache policy separates metadata suitable for persistence from
  memory-only protected content sessions.
- `Connectivity` dependency is present for offline-aware UX.
- `cached_network_image` is declared for controlled image caching.

## Required Implementation Work

- Add debounced search and filter preservation tests for course catalog.
- Add Drift cache tables for approved read-only datasets.
- Add image thumbnail sizing rules for course and academy media.
- Add Riverpod rebuild audits for dashboards and long lists.
- Add background notification handling performance checks.
- Profile Android release and iOS release builds before staging.

## Measurement Commands

```bash
flutter run --profile --flavor staging
flutter build apk --flavor staging --profile
flutter test --coverage
```

The current Codex environment does not include Flutter, so these measurements
are pending.
