# Firebase

The web app uses the modular Firebase SDK with project `rasikh-f0207`.
The root layout mounts `FirebaseAnalytics`, which initializes Firebase and then
Google Analytics in supported browsers. Analytics is never initialized during
server rendering, and initialization is reused across React renders.

## Run

```sh
npm ci
npm run dev
```

The supplied public Firebase web configuration is already included. To override
it, copy `.env.example` to `.env.local` and set the `NEXT_PUBLIC_FIREBASE_*` values
before starting or building the app.

Other client components can import `getFirebaseApp` from `@/lib/firebase` when
adding Firebase services. This change configures the web SDK and Analytics;
Authentication, database collections, Storage rules, and Hosting deployment are
configured separately when those features are added.

Setup reference: https://firebase.google.com/docs/web/setup
