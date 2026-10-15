# Rodela Companion — Project Index ও Analysis

## Hermes integration update

মূল audit-এর পর `integrations/hermes/`-এ existing Rodela API bridge যোগ হয়েছে। GNOME context exporter, AT-SPI text ও MPRIS music metadata → Hermes-generated JSON → Rust validation → React emotion/animation/dialogue flow তৈরি হয়েছে। মূল timer/poke dialogue সরানো হয়েছে। বর্তমান setup ও সীমাবদ্ধতার জন্য `integrations/hermes/README.md` দেখুন; নিচের audit মূল সংস্করণের snapshot।

Verification: host runtime দিয়ে frontend production build, ৫টি Python bridge test, ৪টি monitor-follow test এবং ১টি Rust reaction validation test পাস করেছে। Host-এ AT-SPI ও একটি MPRIS player পাওয়া গেছে। Updated GNOME files install করা হয়েছে; session logout/login বাকি। Live authenticated Hermes response/persona-memory এবং actual active-window text collection end-to-end যাচাই হয়নি। Public `/v1/models` unauthenticated probe HTTP 404 দিয়েছিল।

পর্যালোচনার তারিখ: ১৬ অক্টোবর ২০২৬। Scope: repository-র ৩৭টি tracked file; application source, configuration ও workflow সম্পূর্ণ পড়া হয়েছে। Lockfile-এর direct dependency mapping এবং image file metadata পরীক্ষা করা হয়েছে; dependency implementation ও image artwork audit করা হয়নি।

পরবর্তী পরিবর্তন: GNOME 46 / Zorin Wayland-এর জন্য `integrations/gnome/`-এ compositor extension যোগ করা হয়েছে। এটি click/focus অনুযায়ী existing companion window অন্য monitor-এ সরায়। নিচের feature-gap findings মূল Tauri implementation-এর snapshot; এই নির্দিষ্ট desktop-এর follow behavior এখন optional extension দিয়ে বাস্তবায়িত। বিস্তারিত ও সীমাবদ্ধতা `integrations/gnome/README.md`-তে আছে। Host runtime-এ Node পাওয়া গেছে `flatpak-spawn --host` দিয়ে; extension-এর চারটি mocked logic test পাস করেছে।

## 1. প্রকল্পের বর্তমান অবস্থা

এটি v0.1.2-এর একটি ছোট desktop companion prototype। React দিয়ে CSS robot render হয়; Rust/Tauri native window, tray ও periodic event চালায়। Source-এ কোনো AI model, API integration, screen capture, active-window detection, database বা authentication নেই।

Stack: Tauri 2, Rust 2021 edition, React 19, TypeScript, Vite 8, Tailwind 4, pnpm। Versionগুলো repository manifest/lockfile থেকে নেওয়া; registry availability যাচাই করা হয়নি।

## 2. সম্পূর্ণ file index

| File / group | দায়িত্ব |
|---|---|
| `README.md` | সংক্ষিপ্ত পরিচিতি; updater/autostart দাবির সঙ্গে implementation-এর ফারাক আছে |
| `package.json` | frontend dependency ও dev/build/preview/tauri scripts |
| `pnpm-lock.yaml` | JavaScript dependency resolution |
| `index.html` | HTML entry, transparent background, root element |
| `vite.config.ts` | React/Tailwind plugins, strict dev port 1421 |
| `tsconfig.json` | strict TypeScript, noEmit; unused checks বন্ধ |
| `.gitignore` | node_modules, dist, Rust target/gen ও log বাদ দেয় |
| `src/main.tsx` | React root ও StrictMode |
| `src/App.tsx` | সম্পূর্ণ robot UI, expression, speech, click এবং native event listeners |
| `src/index.css` | Tailwind import ও global selection/box sizing |
| `src/vite-env.d.ts` | Vite type declaration |
| `public/favicon.png` | 64×64 browser favicon |
| `public/icon.png` | 512×512 public image |
| `src-tauri/Cargo.toml` | native dependencies ও release optimization |
| `src-tauri/Cargo.lock` | Rust dependency resolution |
| `src-tauri/build.rs` | Tauri build hook |
| `src-tauri/src/main.rs` | native executable entry; Windows release console লুকায় |
| `src-tauri/src/lib.rs` | plugins, command, tray, background timer এবং app runtime |
| `src-tauri/tauri.conf.json` | window, bundle, dev/build integration, security |
| `src-tauri/capabilities/default.json` | main window-এর IPC/plugin permission |
| `.github/workflows/release.yml` | main/tag/manual trigger; Windows ও Linux release build |
| `src-tauri/icons/32x32.png`, `128x128.png`, `128x128@2x.png` | 32/128/256 px bundle icons |
| `src-tauri/icons/icon.png`, `icon.ico`, `icon.icns` | base PNG ও Windows/macOS icon containers |
| `src-tauri/icons/Square30x30Logo.png`, `Square44x44Logo.png`, `Square71x71Logo.png` | Windows logo variants |
| `src-tauri/icons/Square89x89Logo.png`, `Square107x107Logo.png`, `Square142x142Logo.png` | Windows logo variants |
| `src-tauri/icons/Square150x150Logo.png`, `Square284x284Logo.png`, `Square310x310Logo.png` | Windows logo variants |
| `src-tauri/icons/StoreLogo.png` | 50×50 store logo |

নতুন এই report মূল ৩৭টি tracked file-এর বাইরের documentation artifact।

## 3. Startup ও data flow

1. Native `main.rs` → `rodela_companion_lib::run()`।
2. Builder opener/autostart/notification plugin এবং `get_companion_status` command register করে।
3. Config থেকে 260×260 transparent, borderless, always-on-top window তৈরি হয়। Setup window show/focus করে।
4. Tray-তে Show ও Exit action register হয়; left-click-ও window দেখায়।
5. Background thread প্রতি ১২ সেকেন্ডে ticker বাড়ায়। প্রতি ৫ tick/৬০ সেকেন্ডে coding message; অন্যথায় ১৩-এর গুণিতক tick-এ love message পাঠায়। উভয় শর্ত মিললে coding অগ্রাধিকার পায়।
6. Frontend `context-update` শুনে expression ও speech বদলায়। Click করলে random hardcoded quote ও love expression হয়। প্রতি ৪.২ সেকেন্ডে blink চেষ্টা হয়।
7. `get_companion_status` শুধু `active` ফেরায়; frontend এটি ব্যবহার করে না।

## 4. Feature coverage

| Feature | Source-এ যা আছে |
|---|---|
| Floating robot | CSS robot, hover/poke, six expression variants, float animation |
| Speech | hardcoded বাংলা text ও timer-based dismissal |
| Tray | Show, focus, Exit |
| Context awareness | timer-generated coding/love; বাস্তব activity detection নেই |
| Screen jumping | frontend listener আছে; native emitter/movement নেই |
| Multi-monitor | enumeration, positioning বা monitor tracking নেই |
| Autostart | plugin registered; enable/disable/status flow নেই |
| Auto-update | dependency/permission আছে; Rust plugin registration, endpoint/public key, check/install flow নেই |
| Notification / opener | plugin registered; application call নেই |
| Settings/persistence | নেই |
| Automated tests/lint | test files, test scripts ও lint configuration নেই |

## 5. Findings, priority ও evidence

### High — promised functionality অসম্পূর্ণ

- **Auto-update কাজ করার flow নেই।** `src-tauri/src/lib.rs:14–21`-এ updater plugin register হয় না; config-এ updater endpoint/key নেই; frontend-এ check/download/install call নেই। Release workflow-তেও signing secret বা updater artifact configuration নেই। GitHub release publish হওয়া এবং installed app update হওয়া পৃথক flow।
- **Multi-monitor/context features বাস্তবায়িত নয়।** `src/App.tsx:39`-এর `screen-jump` listener-এর কোনো producer নেই। `src-tauri/src/lib.rs:69–89` শুধু timer text পাঠায়। UI-র screen দেখার কথাগুলো বাস্তব capability বোঝায় না।
- **Borderless window সরানোর control নেই।** `tauri.conf.json:21` decorations বন্ধ করে; source-এ drag region, startDragging বা positioning নেই। ব্যবহারকারী robot-কে পছন্দের জায়গায় সরানোর application control পান না।

### Medium — frontend lifecycle ও state bugs

- **Speech timer race:** `src/App.tsx:62–67` প্রতিবার নতুন timeout বানায়, আগেরটি cancel করে না। দ্রুত দ্বিতীয় message এলে প্রথমটির timeout দ্বিতীয় message আগেই hide করতে পারে।
- **Expression blink আগের state হারায়:** `src/App.tsx:23–27` music/jealous-কে blink করে happy ফিরিয়ে দেয়। সাময়িক blink মূল emotion বদলে দেয়। আলাদা blink state বা previous expression restore দরকার।
- **Poke reset নতুন context overwrite করে:** `src/App.tsx:74–76`-এর পুরোনো timeout নতুন panic/music/love event-এর পরও happy লিখতে পারে।
- **Async listener cleanup race:** `src/App.tsx:35–59`-এ subscription promise resolve হওয়ার আগে effect cleanup হলে unlisten হারায়। `src/main.tsx`-এর StrictMode development setup/cleanup cycle-এ duplicate listener হওয়ার ঝুঁকি আছে। Cancellation flag এবং late-resolution cleanup দরকার। Listener promise rejection-ও handle করা হয়নি।
- **Unmanaged timeout ও impure updater:** blink timeout state updater callback-এর ভিতরে তৈরি হয়; StrictMode-এ updater পুনরায় চলতে পারে। Speech/poke/jump/blink timeout cleanup নেই। Timer refs ও effect cleanup দরকার।
- **Layout sizing অনিশ্চিত:** `h-full` থাকলেও `html/body/#root`-এর explicit height নেই। ফলে parent-relative full height এবং bottom alignment প্রত্যাশামতো নাও হতে পারে। Native visual check প্রয়োজন।
- **Release version collision risk:** workflow main-এর প্রতিটি push-এ package version থেকে একই `v__VERSION__` release target করে। Version bump ছাড়া একাধিক build একই release-এ যেতে পারে; immutable versioned release policy নেই। এটি configuration risk, observed failed CI নয়।

### Lower priority — hardening ও maintainability

- `tauri.conf.json:28`-এ CSP disabled। Local bundled UI-তে তাৎক্ষণিক exploit প্রমাণিত নয়; remote content/integration আনার আগে সীমিত CSP স্থাপন করা উচিত।
- Default capability-তে unused updater/opener/notification/autostart permissions আছে; implemented features অনুযায়ী permissions কমানো যায়।
- Native show/focus/emit errors discard হয়; default icon missing হলে unwrap panic করবে। Diagnostic logging উন্নত করা যায়।
- `invoke` import, lucide-react এবং একাধিক plugin বর্তমানে অব্যবহৃত।
- Startup speech নিজে hide হয় না; প্রথম timed speech/click পর্যন্ত visible থাকে। Desired behavior স্পষ্ট করা দরকার।
- Robot click target `div`; keyboard focus/activation ও accessible label নেই। Reduced-motion preference handling নেই। বাংলা UI হলেও HTML language `en`।
- Source/config version তিন জায়গায় একই 0.1.2; ভবিষ্যৎ release-এ synchronization দরকার।
- README-তে setup prerequisites, development/build guide, actual feature status ও troubleshooting নেই।
- CI-তে dedicated typecheck/test gate নেই; frontend compilation build script-এর মাধ্যমে হয়। macOS runner নেই, যদিও macOS icon ও launcher enum আছে।

## 6. প্রস্তাবিত কাজের ক্রম

1. Speech/expression timeout management, listener cleanup, root height ও drag support ঠিক করা।
2. README/UI-র capability দাবি বাস্তব feature-এর সঙ্গে মেলানো; screen jump/activity detection-এর intended behavior নির্ধারণ করা।
3. Autostart control ও persistence তৈরি; updater registration/config/signing/check/install সম্পূর্ণ করা।
4. Release version policy, CI checks এবং meaningful timer/listener regression tests যোগ করা।
5. প্রয়োজন অনুযায়ী monitor service, activity provider ও settings যোগ করা; App-কে Robot/SpeechBubble এবং lifecycle hooks-এ ভাগ করা।

## 7. Validation

- সব application source, manifest, config ও release workflow static review করা হয়েছে।
- Original working tree clean ছিল। Application source পরিবর্তন করা হয়নি।
- Shell PATH-এ Node.js ও pnpm পাওয়া যায়নি; frontend install/build এবং UI runtime যাচাই করা যায়নি।
- `cargo check --offline --manifest-path src-tauri/Cargo.toml` চালানো হয়েছে; `javascriptcore-rs-sys` build step-এ system package `javascriptcoregtk-4.1 >= 2.38` না পাওয়ায় exit 101 হয়েছে। এটি environment prerequisite failure; application Rust compilation সফল বা ব্যর্থ প্রমাণ করে না।
- Native desktop behavior, Windows/Linux release execution ও installed update flow এই review-তে runtime verified নয়।
