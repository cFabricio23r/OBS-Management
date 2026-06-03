# Parish OBS Control Dashboard

A local React/TypeScript control surface for OBS Studio browser docks. It connects to OBS WebSocket 5.x, prepares scene states in Preview, runs reusable visual sequences, and keeps the operator in a manual Take workflow by default.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in a browser or add it as an OBS Custom Browser Dock.

## OBS setup

1. In OBS Studio, enable WebSocket Server from `Tools -> WebSocket Server Settings`.
2. Use OBS WebSocket 5.x, usually at `ws://127.0.0.1:4455`.
3. Turn on Studio Mode in OBS.
4. In the app, open `Settings`, enter the URL and password, then connect.
5. Use `Visual Builder` to load real sources for each scene and adjust sequences.

## Operator shortcuts

- `Space`: prepare selected cue in Preview
- `T`: manual Transition / Take
- `ArrowDown` or `N`: next cue
- `ArrowUp` or `B`: previous cue
- `1-9`: run quick sequence for current Preview scene
- `Shift+1-9`: put scene in Preview
- `R`: refresh OBS state
- `X`: stop running sequence
- `Escape`: blur focused inputs so shortcuts work again

## Safety behavior

The app does not transition automatically unless a sequence step explicitly contains `take` or the operator clicks `Take` / presses `T`. Default templates only prepare Preview state.

## Project structure

```text
src/
  app/
  components/
  lib/
    obs/
    sequence/
    shortcuts/
    storage/
  schemas/
  store/
  styles/
  types/
```
