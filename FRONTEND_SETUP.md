# Frontend Setup — Render Free-Tier Keepalive

This backend runs on Render's free tier, which **spins down after 15 minutes of inactivity**. When the server is cold, the first request takes 5–10 seconds to spin it back up.

To keep the server warm while the user is using the app, the frontend should **ping the `/ping` endpoint every 5 minutes**.

## Where to add the code

Add this in your frontend app's **main entry file** — typically `App.jsx`, `App.tsx`, `index.jsx`, `layout.tsx`, or `main.tsx` — inside a `useEffect` or component mount:

### React (JSX)

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://arc-backend.onrender.com/ping')
        .catch(() => {
          // Server may be cold-spinning — that's normal, ignore
        });
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    // your app
  );
}
```

### Vue 3 (Composition API)

```javascript
import { onMounted, onUnmounted } from 'vue';

let interval;
onMounted(() => {
  interval = setInterval(() => {
    fetch('https://arc-backend.onrender.com/ping')
      .catch(() => {});
  }, 5 * 60 * 1000);
});
onUnmounted(() => clearInterval(interval));
```

### Plain JS (no framework)

```javascript
setInterval(() => {
  fetch('https://arc-backend.onrender.com/ping')
    .catch(() => {});
}, 5 * 60 * 1000);
```

## How it works

| Interval | Why |
|----------|-----|
| Every 5 minutes | Render free tier spins down after **15 minutes** of inactivity. 5 min gives 3× buffer. |
| `GET /ping` | Returns `{ ok: true, ts: "..." }` instantly — no database call, no heavy processing. |
| `.catch(() => {})` | Ignores errors from cold starts so it doesn't spam the console. |

## Verify it's working

1. Deploy the frontend change
2. Open your browser DevTools → **Network** tab
3. Wait up to 5 minutes — you should see `GET /ping` requests to `arc-backend.onrender.com` with a `200` response
