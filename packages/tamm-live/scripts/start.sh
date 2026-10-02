#!/usr/bin/env bash
# Starts the Rasikh live TAMM demo: Rasikh Guard (8787), the MOCK TAMM MCP server (8790) and the console (8791).
# Works on macOS, Linux and git-bash on Windows. Needs Node 22+.
#
#   scripts/start.sh               start, smoke-test, print the URLs, stay in the foreground (Ctrl+C stops)
#   scripts/start.sh --stop        stop only what a previous run of this script started
#   scripts/start.sh --detach      start, smoke-test, print the URLs and return
#   scripts/start.sh --no-smoke    skip the smoke test
#   scripts/start.sh --record      run the smoke test with --record (saves each scenario run as a replay)
#   scripts/start.sh --rebuild-guard
#
# Environment overrides: RASIKH_GUARD_BIN (path to the guard binary), RASIKH_GUARD_TARGET (cargo target dir).
# TAMM is a mock, UAE PASS is simulated, and Guard enforcement is unverified. See ../README.md.
# This script never kills a process it did not start.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$(dirname "$PKG_DIR")"
REPO_ROOT="$(dirname "$PACKAGES_DIR")"
TAMM_DIR="$PACKAGES_DIR/tamm-mcp"
GUARD_DIR="$PACKAGES_DIR/rasikh-guard"
SERVER_MJS="$PKG_DIR/src/server.mjs"
SMOKE_MJS="$SCRIPT_DIR/smoke.mjs"
[ -n "${TAMM_LIVE_SERVER:-}" ] && SERVER_MJS="$TAMM_LIVE_SERVER"   # test hook: run another console entry file
GUARD_TARGET="${RASIKH_GUARD_TARGET:-$(dirname "$REPO_ROOT")/rasikh-guard-target}"

# Ports are fixed for the demo. The overrides exist only so the scripts can be tested next to a running demo.
GUARD_PORT="${TAMM_LIVE_GUARD_PORT:-8787}"
TAMM_PORT="${TAMM_LIVE_TAMM_PORT:-8790}"
CONSOLE_PORT="${TAMM_LIVE_PORT:-8791}"
GUARD_URL="http://127.0.0.1:$GUARD_PORT"
TAMM_URL="http://127.0.0.1:$TAMM_PORT"
CONSOLE_URL="http://127.0.0.1:$CONSOLE_PORT"

STATE_DIR="${TMPDIR:-/tmp}/rasikh-tamm-live"
STATE_FILE="$STATE_DIR/processes.txt"   # lines: name|wrapper_pid|listener_pid|port
mkdir -p "$STATE_DIR"

DO_STOP=0; NO_SMOKE=0; DETACH=0; RECORD=0; REBUILD=0
for a in "$@"; do
  case "$a" in
    --stop|-Stop) DO_STOP=1 ;;
    --no-smoke|-NoSmoke) NO_SMOKE=1 ;;
    --detach|-Detach) DETACH=1 ;;
    --record|-Record) RECORD=1 ;;
    --rebuild-guard|-RebuildGuard) REBUILD=1 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown option: $a (try --help)"; exit 64 ;;
  esac
done

IS_WINDOWS=0
case "$(uname -s 2>/dev/null)" in MINGW*|MSYS*|CYGWIN*) IS_WINDOWS=1 ;; esac

say()  { printf '%s\n' "$*"; }
step() { printf '\n== %s\n' "$*"; }
good() { printf '   ok  %s\n' "$*"; }
warn() { printf '   !!  %s\n' "$*"; }
bad()  { printf '   XX  %s\n' "$*"; }

# ---- ports ----------------------------------------------------------------------------------------------------------
# Prints "pid name" of the listener on a port (best effort), or nothing when the port is free.
port_owner() {
  local port="$1" line pid
  if [ "$IS_WINDOWS" = 1 ]; then
    line="$(netstat -ano -p tcp 2>/dev/null | tr -d '\r' | grep -E "[:.]$port[[:space:]].*LISTENING" | head -n 1)"
    [ -z "$line" ] && return 0
    pid="$(printf '%s' "$line" | awk '{print $NF}')"
    printf '%s %s\n' "$pid" "$(tasklist //FI "PID eq $pid" //FO CSV //NH 2>/dev/null | tr -d '\r' | head -n 1 | cut -d, -f1 | tr -d '"')"
  elif command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1)"
    [ -z "$pid" ] && return 0
    printf '%s %s\n' "$pid" "$(ps -o comm= -p "$pid" 2>/dev/null | head -n 1)"
  elif command -v ss >/dev/null 2>&1; then
    line="$(ss -ltnpH "sport = :$port" 2>/dev/null | head -n 1)"
    [ -z "$line" ] && return 0
    pid="$(printf '%s' "$line" | sed -n 's/.*pid=\([0-9]*\).*/\1/p')"
    printf '%s %s\n' "${pid:-?}" "$(ps -o comm= -p "${pid:-0}" 2>/dev/null | head -n 1)"
  else
    # No tool to name the owner: fall back to a connect test.
    node -e "const s=require('net').connect($port,'127.0.0.1');s.on('connect',()=>{console.log('? unknown');process.exit(0)});s.on('error',()=>process.exit(0))" 2>/dev/null
  fi
}

healthy() { curl -fsS -m 2 -o /dev/null "$1" 2>/dev/null; }

tail_log() { [ -f "$1" ] && tail -n 12 "$1" || echo "(no output yet)"; }

pid_alive() { [ -n "${1:-}" ] && [ "$1" != "0" ] && kill -0 "$1" 2>/dev/null; }

# Kill a process and its children. Only ever called with a pid recorded in our own state file.
kill_tree() {
  local pid="$1" child
  if [ "$IS_WINDOWS" = 1 ]; then
    # on git-bash the pid may be an MSYS pid or a Windows pid: try the Windows tool first
    taskkill //PID "$pid" //T //F >/dev/null 2>&1 && return 0
    kill "$pid" 2>/dev/null
    return 0
  fi
  if command -v pgrep >/dev/null 2>&1; then
    for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  fi
  kill "$pid" 2>/dev/null
}

# A recorded listener pid is only killed while it still owns the port we started it on.
stop_started() {
  if [ ! -f "$STATE_FILE" ]; then say "   nothing recorded as started by this script."; return 0; fi
  local lines name wpid lpid port owner opid
  lines="$(sed '1!G;h;$!d' "$STATE_FILE")"   # reverse order
  while IFS='|' read -r name wpid lpid port; do
    [ -z "$name" ] && continue
    if pid_alive "$lpid" || [ "$IS_WINDOWS" = 1 -a -n "$lpid" ]; then
      owner="$(port_owner "$port")"; opid="${owner%% *}"
      if [ "$opid" = "$lpid" ]; then kill_tree "$lpid"; say "   stopped $name listener (pid $lpid)"; fi
    fi
    if pid_alive "$wpid"; then kill_tree "$wpid"; say "   stopped $name (pid $wpid)"; fi
  done <<EOF
$lines
EOF
  rm -f "$STATE_FILE"
  sleep 1
  for p in $GUARD_PORT $TAMM_PORT $CONSOLE_PORT; do
    owner="$(port_owner "$p")"
    [ -n "$owner" ] && warn "port $p is still held by ${owner#* } (pid ${owner%% *}); it was not started by this script, so it was left alone."
  done
  return 0
}

STARTED_ANY=0
cleanup() {
  if [ "$DETACH" = 0 ] && [ "$STARTED_ANY" = 1 ]; then
    step "Stopping what this script started"
    stop_started
  fi
}

if [ "$DO_STOP" = 1 ]; then
  step "Stopping what this script started"
  stop_started
  say ""
  say "Done. Anything else on this machine (including ports 3000, 3100, 3300) was not touched."
  exit 0
fi

# start_managed NAME PORT WORKDIR command...   (environment is taken from the caller; sets LAST_PID)
start_managed() {
  local name="$1" port="$2" workdir="$3"; shift 3
  ( cd "$workdir" && exec nohup "$@" >"$STATE_DIR/$name.log" 2>"$STATE_DIR/$name.err.log" ) &
  LAST_PID=$!
  printf '%s|%s|%s|%s
' "$name" "$LAST_PID" "0" "$port" >>"$STATE_FILE"
  STARTED_ANY=1
}

record_listener() {   # NAME PORT -> fills in the listener pid in the state file
  local name="$1" port="$2" owner opid
  owner="$(port_owner "$port")"; opid="${owner%% *}"
  [ -z "$opid" ] && return 0
  sed -i.bak "s#^\($name|[0-9]*|\)0|#\1$opid|#" "$STATE_FILE" 2>/dev/null; rm -f "$STATE_FILE.bak"
}

wait_healthy() {   # NAME URL TIMEOUT PID PORT
  local name="$1" url="$2" timeout="$3" pid="$4" port="$5" t0 now
  t0="$(date +%s)"
  while :; do
    if healthy "$url"; then
      record_listener "$name" "$port"
      now="$(date +%s)"; good "$name is up at $url ($((now - t0)) s)"; return 0
    fi
    if ! pid_alive "$pid" && [ "$IS_WINDOWS" = 0 ]; then
      sleep 1
      if healthy "$url"; then record_listener "$name" "$port"; good "$name is up at $url"; return 0; fi
      bad "$name exited before it came up."
      tail_log "$STATE_DIR/$name.err.log"; tail_log "$STATE_DIR/$name.log"
      return 1
    fi
    now="$(date +%s)"
    if [ $((now - t0)) -ge "$timeout" ]; then
      bad "$name did not answer $url within $timeout s."
      tail_log "$STATE_DIR/$name.err.log"; tail_log "$STATE_DIR/$name.log"
      return 1
    fi
    sleep 0.5
  done
}

fail() { bad "$*"; cleanup; exit 1; }

trap 'echo; cleanup; exit 130' INT TERM

echo
echo "Rasikh live TAMM demo"
echo "TAMM is a MOCK. UAE PASS is SIMULATED. Guard enforcement is UNVERIFIED (see README)."

step "Checks"
command -v node >/dev/null 2>&1 || fail "Node.js was not found on PATH. Install Node 22 or newer."
command -v curl >/dev/null 2>&1 || fail "curl was not found on PATH."
NODE_VER="$(node --version)"
[ "$(echo "${NODE_VER#v}" | cut -d. -f1)" -ge 22 ] || fail "Node $NODE_VER is too old. Node 22 or newer is required."
good "node $NODE_VER"
[ -f "$SERVER_MJS" ] || fail "The console server is missing: $SERVER_MJS"
[ -f "$SMOKE_MJS" ] || fail "The smoke test is missing: $SMOKE_MJS"

# a previous run that is still alive?
if [ -f "$STATE_FILE" ]; then
  ALIVE=""
  while IFS='|' read -r name wpid lpid port; do
    pid_alive "$wpid" && ALIVE="$ALIVE $name(pid $wpid)"
  done <"$STATE_FILE"
  if [ -n "$ALIVE" ]; then
    bad "A previous run of this script is still running:$ALIVE"
    say "   Run  scripts/start.sh --stop  first, or just open the console: $CONSOLE_URL"
    exit 1
  fi
  rm -f "$STATE_FILE"
fi

TAKEN=0
for pair in "Rasikh Guard:$GUARD_PORT" "TAMM mock:$TAMM_PORT" "Console:$CONSOLE_PORT"; do
  label="${pair%%:*}"; p="${pair##*:}"
  owner="$(port_owner "$p")"
  if [ -n "$owner" ]; then
    bad "Port $p ($label) is already in use by ${owner#* } (pid ${owner%% *})"; TAKEN=1
  else good "port $p is free ($label)"; fi
done
if [ "$TAKEN" = 1 ]; then
  say ""
  say "   Nothing was started and nothing was stopped. Close the program that owns the port yourself,"
  say "   or, if it is a leftover from an earlier run of this script, run:  scripts/start.sh --stop"
  exit 1
fi

# ---- Guard ----------------------------------------------------------------------------------------------------------
step "Rasikh Guard"
GUARD_BIN=""
for c in "${RASIKH_GUARD_BIN:-}" "$GUARD_TARGET/release/rasikh-guard.exe" "$GUARD_TARGET/release/rasikh-guard" "$GUARD_DIR/target/release/rasikh-guard.exe" "$GUARD_DIR/target/release/rasikh-guard"; do
  if [ -n "$c" ] && [ -f "$c" ]; then GUARD_BIN="$c"; break; fi
done
if [ "$REBUILD" = 1 ] || [ -z "$GUARD_BIN" ]; then
  command -v cargo >/dev/null 2>&1 || fail "No Guard binary found and cargo is not installed. Install Rust (https://rustup.rs) or set RASIKH_GUARD_BIN."
  warn "Building Rasikh Guard with cargo into $GUARD_TARGET"
  warn "A cold first build compiles the vendored engine and ~150 crates: plan 2 to 6 minutes. A warm rebuild took 49 s on the dev machine."
  (cd "$GUARD_DIR" && CARGO_TARGET_DIR="$GUARD_TARGET" cargo build --release -p rasikh-guard) || fail "cargo build failed."
  for c in "$GUARD_TARGET/release/rasikh-guard.exe" "$GUARD_TARGET/release/rasikh-guard"; do [ -f "$c" ] && GUARD_BIN="$c" && break; done
  [ -n "$GUARD_BIN" ] || fail "The build finished but no binary was found in $GUARD_TARGET/release."
fi
good "binary: $GUARD_BIN"
RASIKH_DEMO_MODE=1 RASIKH_GUARD_BIND="127.0.0.1:$GUARD_PORT,[::1]:$GUARD_PORT" start_managed guard "$GUARD_PORT" "$GUARD_DIR" "$GUARD_BIN"; GUARD_PID="$LAST_PID"

# ---- TAMM mock ------------------------------------------------------------------------------------------------------
step "TAMM mock (MCP server, demo mode)"
if [ ! -d "$TAMM_DIR/node_modules/tsx" ]; then
  warn "node_modules is missing in packages/tamm-mcp: running npm ci (needs network, about 1 minute)"
  (cd "$TAMM_DIR" && npm ci) || fail "npm ci failed."
else good "node_modules present"; fi
RASIKH_DEMO_MODE=1 RASIKH_GUARD_URL="$GUARD_URL" TAMM_MCP_URL="$TAMM_URL/mcp" TAMM_MCP_HOST=127.0.0.1 start_managed tamm-mcp "$TAMM_PORT" "$TAMM_DIR" npm run dev; TAMM_PID="$LAST_PID"

# ---- Console --------------------------------------------------------------------------------------------------------
step "Console"
RASIKH_DEMO_MODE=1 RASIKH_GUARD_URL="$GUARD_URL" TAMM_MCP_URL="$TAMM_URL/mcp" TAMM_LIVE_PORT="$CONSOLE_PORT" TAMM_LIVE_HOST=127.0.0.1 PORT="$CONSOLE_PORT" start_managed console "$CONSOLE_PORT" "$PKG_DIR" node "$SERVER_MJS"; CONSOLE_PID="$LAST_PID"

step "Waiting for the services"
wait_healthy "guard" "$GUARD_URL/health" 30 "$GUARD_PID" "$GUARD_PORT" || fail "Rasikh Guard did not start. Logs: $STATE_DIR"
wait_healthy "tamm-mcp" "$TAMM_URL/health" 90 "$TAMM_PID" "$TAMM_PORT" || fail "The TAMM mock did not start. Logs: $STATE_DIR"
wait_healthy "console" "$CONSOLE_URL/api/status" 30 "$CONSOLE_PID" "$CONSOLE_PORT" || fail "The console did not start. Logs: $STATE_DIR"

SMOKE_CODE=0
if [ "$NO_SMOKE" = 1 ]; then
  warn "Smoke test skipped (--no-smoke). Run it before you go on:  node scripts/smoke.mjs"
else
  step "Smoke test (runs the three scenarios and asserts the outcomes)"
  SMOKE_ARGS=""; [ "$RECORD" = 1 ] && SMOKE_ARGS="--record"
  (cd "$PKG_DIR" && TAMM_LIVE_URL="$CONSOLE_URL" RASIKH_GUARD_URL="$GUARD_URL" TAMM_MCP_URL="$TAMM_URL/mcp" node "$SMOKE_MJS" $SMOKE_ARGS); SMOKE_CODE=$?
fi

echo
echo "------------------------------------------------------------------------------"
if [ "$SMOKE_CODE" != 0 ]; then
  bad "SMOKE TEST FAILED (exit code $SMOKE_CODE). Do not go on stage with this state. Services are left running so you can look."
else good "Ready."; fi
echo
echo "   Console (open this, put it on the projector):  $CONSOLE_URL"
echo "   Guard health:                                  $GUARD_URL/health"
echo "   TAMM mock health:                              $TAMM_URL/health"
echo
echo "   On stage: pick a scenario and press Run. If anything is down, press Replay."
echo "   Reset between takes: the Reset button, or  POST /api/reset  (TAMM first, then Guard)."
echo "   Logs: $STATE_DIR"
echo "------------------------------------------------------------------------------"

if [ "$DETACH" = 1 ]; then
  echo "   Detached. Stop later with:  scripts/start.sh --stop"
  [ "$SMOKE_CODE" = 0 ] && exit 0 || exit 3
fi

echo "   Press Ctrl+C here to stop Guard, the TAMM mock and the console."
while :; do sleep 2; done
