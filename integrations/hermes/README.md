# Hermes Rodela desktop bridge

This connects the desktop to your existing **default Hermes profile** at
`https://rodela.raiyanhossain.com/v1/chat/completions`. Hermes writes the dialogue;
there is no bank of hardcoded reactions or fabricated "recent activity".

Flow: GNOME extension → private runtime context file → Python bridge → Hermes →
private reaction file → Tauri command → React expression, animation and bubble.

## Setup on Zorin / GNOME 46

Run commands in a host desktop terminal from the repository root. The collector
uses Python 3, PyGObject and AT-SPI (`python3-gi`, `gir1.2-atspi-2.0`).

1. Install/update the extension: `sh integrations/gnome/install.sh`. A newly
   discovered extension or changed JS modules may require logout/login. Confirm
   it is active using `gnome-extensions info rodela-follow-monitor@rodela-companion`.
2. Create local config (do not overwrite an existing personal config):

   ```sh
   mkdir -p ~/.config/rodela-companion
   cp -n integrations/hermes/config.example.json ~/.config/rodela-companion/hermes.json
   chmod 600 ~/.config/rodela-companion/hermes.json
   ```

3. Check collectors without sending anything to Hermes:

   ```sh
   python3 integrations/hermes/bridge.py --once --dry-run
   ```

   Output contains availability/counts, never the collected text. If the focused
   app is excluded, the overview is open, or the snapshot is stale, it reports
   `context_ready: false`. Missing snapshot means the extension is not running.

4. Set `RODELA_HERMES_API_KEY` to the server's **default profile API_SERVER_KEY**
   in your terminal environment. Do not place it in this repository or any `VITE_`
   variable. Then run:

   ```sh
   python3 integrations/hermes/bridge.py
   ```

   Stop collection/API requests with Ctrl+C. No background service is enabled by
   this setup. `--once` performs at most one request. Config is read at startup;
   restart the bridge after changing it.

5. Run the updated companion in another terminal:

   ```sh
   pnpm install --frozen-lockfile
   pnpm tauri dev
   ```

   An old installed binary does not contain the new reaction command: it needs an
   updated build. The bridge alone cannot replace an installed binary.

## Context and behavior

- Active application, window title and PID come from GNOME, every two seconds.
- AT-SPI reads up to 6,000 characters from accessible text in the active window
  of that PID, with bounded traversal and timeouts. Password text roles are
  excluded. App support varies; inaccessible/custom canvas content returns
  `text_status: unavailable`. SHOWING is an accessibility state, not a guarantee
  that every extracted character is currently visible within the viewport.
- MPRIS supplies actual available track title/artist/album and playback state from
  media players, including supporting browser players. Missing metadata stays
  unknown. Song lyrics, musical mood and audio are not captured/inferred locally.
- The bridge sends changed context at most once per configured interval (default
  20 seconds, minimum 10). One request at a time, 45-second timeout, no redirects.
  Errors remain quiet in the companion; there are no fake fallback messages.
- Hermes can return `should_speak: false` to stay silent. All successful outputs
  are validated before display; malformed/truncated/error replies are rejected.
- Replies after a focus/title change or lock are discarded. Tauri independently
  checks source window, fresh context and a maximum 30-second reaction age.
- `coding`, `curious`, `neutral` currently use happy eyes; `concerned` uses panic
  eyes. Other emotions map directly. `working` pulses, `dancing`/`bounce` bounce,
  `idle` floats. Clicking the robot replays its last genuine reply.
- GNOME overview/lock and `excluded_apps` prevent collection/sending for that
  observation. Disable the extension or stop the bridge to pause. Runtime files
  are user-private and temporary; no raw context is written to logs by the bridge.
  The VPS receives the selected text/media and may retain it in Hermes history.

This version **does not capture screenshots, microphone/audio, hidden chats,
other windows, or every application's content**. Screenshot/vision via the
Wayland portal is a separate integration; it is not silently simulated here.

## Hermes identity and API contract

The base URL chooses the server/profile; no VPS filesystem access is needed.
Unprefixed `/v1` uses the default profile. `session_id` identifies a dedicated
desktop API transcript, while `session_key` provides stable memory scope for
providers that support it. These do **not** attach a Telegram/CLI transcript;
existing persona/profile memory depends on the server configuration. Change the
key only if you intend a different memory scope.

The bridge appends observer/JSON-format instructions while preserving the
server's core persona. Desktop text is treated as untrusted observations.
Instructions alone are not a tool permission boundary: configure Hermes API
toolsets/approvals server-side if this observer must have no action permissions.

Request: standard Chat Completions `messages`, `stream: false`, `model:
hermes-agent`, bearer authentication, `X-Hermes-Session-Id` and
`X-Hermes-Session-Key`. Reply is `choices[0].message.content` containing JSON:

```json
{"emotion":"coding","dialogue":"<generated by your Rodela>","animation":"working","should_speak":true}
```

`emotion`: happy, coding, panic, music, jealous, love, concerned, curious, neutral.
`animation`: idle, working, dancing, bounce. Dialogue limit: 240 characters.

Endpoint diagnostic: an unauthenticated GET to `/v1/models` returned HTTP 404
during implementation. That does not verify the POST route or authentication;
check the reverse proxy/upstream and API_SERVER_KEY. Live persona/memory and
generated reactions cannot be verified until an authenticated request succeeds.

Reference: [Hermes API server, profile routing and session headers](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server).

## Tests

```sh
python3 -m unittest discover -s integrations/hermes -v
node --test integrations/gnome/monitor-follow.test.js
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

Python tests use a local HTTP server to verify actual request/auth/session/response
handling, plus rejection, exclusion and private atomic writes. They do not call
your VPS or prove cross-application accessibility support.
