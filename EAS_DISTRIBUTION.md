# EAS iOS Dev Client Distribution

This project uses a native OCR module (`@react-native-ml-kit/text-recognition`), so Expo Go cannot run receipt scanning.
Use EAS to build and distribute a development client.

## One-time project setup

1. Install EAS CLI globally (optional):

```bash
npm i -g eas-cli
```

2. Log in:

```bash
npx eas-cli login
```

3. Initialize EAS project linkage (writes `extra.eas.projectId` into app config):

```bash
npx eas-cli init
```

## Build profiles

Configured in `eas.json`:

- `development`: Internal distribution dev client for physical iOS devices.
- `development-simulator`: Dev client for iOS Simulator.
- `preview`: Internal release build.
- `production`: App Store/TestFlight build.

## Build commands

Run from this folder:

```bash
npm run eas:build:ios:dev
npm run eas:build:ios:sim
npm run eas:build:ios:preview
npm run eas:build:ios:prod
```

## Team distribution flow (recommended)

1. A maintainer runs:

```bash
npm run eas:build:ios:dev
```

2. Share the generated internal installation link with teammates.
3. Teammates install that dev client once on their devices.
4. Teammates run Metro with dev-client mode:

```bash
npm run start:dev-client
```

5. Open the installed dev client and connect to Metro.

## TestFlight flow

1. Build production binary:

```bash
npm run eas:build:ios:prod
```

2. Submit to App Store Connect:

```bash
npm run eas:submit:ios:prod
```

3. Add testers in App Store Connect -> TestFlight.

## Notes

- You still need valid Apple credentials/team for iOS cloud builds.
- If `ascAppId` is known, set it in `eas.json` under `submit.production.ios.ascAppId`.
- For JavaScript-only changes, no rebuild is needed; just restart Metro.
