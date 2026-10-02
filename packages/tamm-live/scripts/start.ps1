<#
.SYNOPSIS
  Starts the Rasikh live TAMM demo: Rasikh Guard, the MOCK TAMM MCP server and the demo console.

.DESCRIPTION
  1. Rasikh Guard sidecar on 127.0.0.1:8787  (RASIKH_DEMO_MODE=1)
  2. Mock TAMM MCP server on 127.0.0.1:8790  (RASIKH_DEMO_MODE=1, npm run dev)
  3. Demo console on        127.0.0.1:8791
  Then waits for all three, runs scripts/smoke.mjs, prints the URLs and keeps running.
  Ctrl+C (or `start.ps1 -Stop` from another window) stops ONLY the processes this script started.

  TAMM is a mock, UAE PASS is simulated, and Guard enforcement is unverified. See ../README.md.

.PARAMETER Stop          Stop the processes a previous run of this script started, then exit.
.PARAMETER NoSmoke       Do not run the smoke test.
.PARAMETER Detach        Start, smoke-test, print the URLs and return, leaving the services running.
.PARAMETER Record        Run the smoke test with --record, which saves each scenario run as a replay.
.PARAMETER RebuildGuard  Rebuild the Guard binary with cargo even if one exists.

.NOTES
  Environment overrides: RASIKH_GUARD_BIN (path to rasikh-guard.exe), RASIKH_GUARD_TARGET (cargo target dir).
  Windows PowerShell 5.1 compatible. Needs Node 22+.
#>
[CmdletBinding()]
param(
  [switch]$Stop,
  [switch]$NoSmoke,
  [switch]$Detach,
  [switch]$Record,
  [switch]$RebuildGuard
)

$ErrorActionPreference = 'Stop'

# ---- locations and ports ------------------------------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$PkgDir      = Split-Path -Parent $ScriptDir
$PackagesDir = Split-Path -Parent $PkgDir
$RepoRoot    = Split-Path -Parent $PackagesDir
$TammDir     = Join-Path $PackagesDir 'tamm-mcp'
$GuardDir    = Join-Path $PackagesDir 'rasikh-guard'
$ServerMjs   = Join-Path $PkgDir 'src\server.mjs'
$SmokeMjs    = Join-Path $ScriptDir 'smoke.mjs'
if ($env:TAMM_LIVE_SERVER) { $ServerMjs = $env:TAMM_LIVE_SERVER }   # test hook: run another console entry file

if ($env:RASIKH_GUARD_TARGET) { $GuardTarget = $env:RASIKH_GUARD_TARGET }
else { $GuardTarget = Join-Path (Split-Path -Parent $RepoRoot) 'rasikh-guard-target' }

# Ports are fixed for the demo. The overrides exist only so the scripts can be tested next to a running demo.
function PortFromEnv([string]$Name, [int]$Default) {
  $v = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ($v -and $v -match '^\d+$') { return [int]$v }
  return $Default
}
$GuardPort   = PortFromEnv 'TAMM_LIVE_GUARD_PORT' 8787
$TammPort    = PortFromEnv 'TAMM_LIVE_TAMM_PORT' 8790
$ConsolePort = PortFromEnv 'TAMM_LIVE_PORT' 8791
$GuardUrl   = "http://127.0.0.1:$GuardPort"
$TammUrl    = "http://127.0.0.1:$TammPort"
$ConsoleUrl = "http://127.0.0.1:$ConsolePort"

$StateDir  = Join-Path ([IO.Path]::GetTempPath()) 'rasikh-tamm-live'
$StateFile = Join-Path $StateDir 'processes.json'
if (-not (Test-Path -LiteralPath $StateDir)) { New-Item -ItemType Directory -Path $StateDir -Force | Out-Null }

$script:Started = New-Object System.Collections.ArrayList

# ---- output helpers -----------------------------------------------------------------------------------------------
function Say([string]$Text)  { Write-Host $Text }
function Step([string]$Text) { Write-Host ''; Write-Host "== $Text" -ForegroundColor Cyan }
function Good([string]$Text) { Write-Host "   ok  $Text" -ForegroundColor Green }
function Warn([string]$Text) { Write-Host "   !!  $Text" -ForegroundColor Yellow }
function Bad([string]$Text)  { Write-Host "   XX  $Text" -ForegroundColor Red }

# ---- process and port helpers -------------------------------------------------------------------------------------
function Get-PortOwner([int]$Port) {
  $owners = @()
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $conns = $null
    try { $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop) } catch { $conns = @() }
    foreach ($c in $conns) {
      $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      $name = '(unknown)'; $path = ''
      if ($p) { $name = $p.ProcessName; try { $path = $p.Path } catch { $path = '' } }
      $owners += [pscustomobject]@{ Pid = [int]$c.OwningProcess; Name = $name; Path = $path }
    }
  } else {
    $lines = netstat -ano -p tcp | Select-String -Pattern ":$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
    foreach ($l in $lines) {
      $ownerPid = [int]$l.Matches[0].Groups[1].Value
      $p = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
      $name = '(unknown)'; if ($p) { $name = $p.ProcessName }
      $owners += [pscustomobject]@{ Pid = $ownerPid; Name = $name; Path = '' }
    }
  }
  return ($owners | Sort-Object Pid -Unique)
}

function Test-Healthy([string]$Url) {
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300)
  } catch { return $false }
}

function Get-LogTail([string]$Path, [int]$Lines = 12) {
  if (Test-Path -LiteralPath $Path) {
    $t = Get-Content -LiteralPath $Path -Tail $Lines -ErrorAction SilentlyContinue
    if ($t) { return ($t -join "`n") }
  }
  return '(no output yet)'
}

function Save-State {
  $items = @($script:Started | ForEach-Object { $_ })
  ConvertTo-Json -InputObject $items -Depth 4 | Set-Content -LiteralPath $StateFile -Encoding ASCII
}

function Test-Alive($Entry, [int]$ProcessId, [long]$StartTicks) {
  if (-not $ProcessId) { return $false }
  $p = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $p) { return $false }
  try { return ([math]::Abs($p.StartTime.ToFileTimeUtc() - $StartTicks) -lt 20000000) } catch { return $false }
}

function Stop-OurProcess([string]$Name, [int]$ProcessId, [long]$StartTicks) {
  if (-not (Test-Alive $null $ProcessId $StartTicks)) { return $false }
  Start-Process -FilePath 'taskkill.exe' -ArgumentList @('/PID', "$ProcessId", '/T', '/F') -WindowStyle Hidden -Wait | Out-Null
  Say "   stopped $Name (pid $ProcessId)"
  return $true
}

function Stop-Started {
  $entries = @()
  if ($script:Started.Count -gt 0) { $entries = @($script:Started | ForEach-Object { $_ }) }
  elseif (Test-Path -LiteralPath $StateFile) {
    try { $entries = @(Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json | ForEach-Object { $_ }) } catch { $entries = @() }
  }
  if ($entries.Count -eq 0) { Say '   nothing recorded as started by this script.'; return }
  [array]::Reverse($entries)
  foreach ($e in $entries) {
    # Child that actually listens on the port first, then the wrapper process we launched.
    if ($e.ListenerPid) { [void](Stop-OurProcess "$($e.Name) listener" ([int]$e.ListenerPid) ([long]$e.ListenerStart)) }
    [void](Stop-OurProcess $e.Name ([int]$e.Pid) ([long]$e.Start))
  }
  Remove-Item -LiteralPath $StateFile -Force -ErrorAction SilentlyContinue
  $script:Started.Clear()
  Start-Sleep -Milliseconds 600
  foreach ($pt in @($GuardPort, $TammPort, $ConsolePort)) {
    $o = @(Get-PortOwner $pt)
    if ($o.Count -gt 0) { Warn "port $pt is still held by $($o[0].Name) (pid $($o[0].Pid)); it was not started by this script, so it was left alone." }
  }
}

function Start-Managed([string]$Name, [string]$File, [string[]]$ArgList, [string]$WorkDir, [hashtable]$EnvMap, [int]$Port) {
  $saved = @{}
  foreach ($k in $EnvMap.Keys) { $saved[$k] = [Environment]::GetEnvironmentVariable($k, 'Process'); [Environment]::SetEnvironmentVariable($k, [string]$EnvMap[$k], 'Process') }
  try {
    $out = Join-Path $StateDir "$Name.log"
    $err = Join-Path $StateDir "$Name.err.log"
    $sp = @{ FilePath = $File; WorkingDirectory = $WorkDir; PassThru = $true; WindowStyle = 'Hidden'; RedirectStandardOutput = $out; RedirectStandardError = $err }
    if ($ArgList -and $ArgList.Count -gt 0) { $sp['ArgumentList'] = $ArgList }
    $proc = Start-Process @sp
  } finally {
    foreach ($k in $EnvMap.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k], 'Process') }
  }
  $entry = [pscustomobject]@{ Name = $Name; Pid = $proc.Id; Start = $proc.StartTime.ToFileTimeUtc(); Port = $Port; ListenerPid = 0; ListenerStart = 0; Out = $out; Err = $err }
  [void]$script:Started.Add($entry)
  Save-State
  return $entry
}

function Wait-Healthy($Entry, [string]$Label, [string]$Url, [int]$TimeoutSec) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $proc = Get-Process -Id $Entry.Pid -ErrorAction SilentlyContinue
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
    if (Test-Healthy $Url) {
      $owner = @(Get-PortOwner $Entry.Port) | Select-Object -First 1
      if ($owner) {
        $Entry.ListenerPid = $owner.Pid
        $lp = Get-Process -Id $owner.Pid -ErrorAction SilentlyContinue
        if ($lp) { try { $Entry.ListenerStart = $lp.StartTime.ToFileTimeUtc() } catch { $Entry.ListenerStart = 0 } }
        Save-State
      }
      Good ("{0} is up at {1} ({2:N1} s)" -f $Label, $Url, $sw.Elapsed.TotalSeconds)
      return
    }
    $alive = Get-Process -Id $Entry.Pid -ErrorAction SilentlyContinue
    if (-not $alive) {
      # npm/cmd wrappers can exit while a child stays up, so give a listening port one more chance
      Start-Sleep -Milliseconds 700
      if (Test-Healthy $Url) { continue }
      Bad "$Label exited before it came up."
      Say (Get-LogTail $Entry.Err); Say (Get-LogTail $Entry.Out)
      throw "$Label did not start. Logs: $($Entry.Out) and $($Entry.Err)"
    }
    Start-Sleep -Milliseconds 500
  }
  Bad "$Label did not answer $Url within $TimeoutSec s."
  Say (Get-LogTail $Entry.Err); Say (Get-LogTail $Entry.Out)
  throw "$Label did not become healthy in time. Logs: $($Entry.Out) and $($Entry.Err)"
}

# ---- -Stop --------------------------------------------------------------------------------------------------------
if ($Stop) {
  Step 'Stopping what this script started'
  Stop-Started
  Say ''
  Say 'Done. Anything else on this machine (including ports 3000, 3100, 3300) was not touched.'
  exit 0
}

# ---- main ---------------------------------------------------------------------------------------------------------
try {
  Say ''
  Write-Host 'Rasikh live TAMM demo' -ForegroundColor White
  Say 'TAMM is a MOCK. UAE PASS is SIMULATED. Guard enforcement is UNVERIFIED (see README).'

  Step 'Checks'
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCmd) { throw 'Node.js was not found on PATH. Install Node 22 or newer.' }
  $nodeVer = (& node --version).Trim()
  if ([int]($nodeVer.TrimStart('v').Split('.')[0]) -lt 22) { throw "Node $nodeVer is too old. Node 22 or newer is required." }
  Good "node $nodeVer"
  if (-not (Test-Path -LiteralPath $ServerMjs)) { throw "The console server is missing: $ServerMjs" }
  if (-not (Test-Path -LiteralPath $SmokeMjs)) { throw "The smoke test is missing: $SmokeMjs" }

  # a previous run of this script that is still alive?
  if (Test-Path -LiteralPath $StateFile) {
    $prev = @()
    try { $prev = @(Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json | ForEach-Object { $_ }) } catch { $prev = @() }
    $live = @($prev | Where-Object { (Test-Alive $null ([int]$_.Pid) ([long]$_.Start)) -or ($_.ListenerPid -and (Test-Alive $null ([int]$_.ListenerPid) ([long]$_.ListenerStart))) })
    if ($live.Count -gt 0) {
      Bad ('A previous run of this script is still running: ' + (($live | ForEach-Object { "$($_.Name) (pid $($_.Pid))" }) -join ', '))
      Say '   Run  .\start.ps1 -Stop  first, or just open the console:'
      Say "   $ConsoleUrl"
      exit 1
    }
    Remove-Item -LiteralPath $StateFile -Force -ErrorAction SilentlyContinue
  }

  # ports
  $taken = $false
  foreach ($pair in @(@('Rasikh Guard', $GuardPort), @('TAMM mock', $TammPort), @('Console', $ConsolePort))) {
    $owners = @(Get-PortOwner $pair[1])
    if ($owners.Count -gt 0) {
      $o = $owners[0]
      Bad "Port $($pair[1]) ($($pair[0])) is already in use by $($o.Name) (pid $($o.Pid)) $($o.Path)"
      $taken = $true
    } else { Good "port $($pair[1]) is free ($($pair[0]))" }
  }
  if ($taken) {
    Say ''
    Say '   Nothing was started and nothing was stopped. Close the program that owns the port yourself,'
    Say '   or, if it is a leftover from an earlier run of this script, run:  .\start.ps1 -Stop'
    exit 1
  }

  # ---- Guard binary ---------------------------------------------------------------------------------------------
  Step 'Rasikh Guard'
  $guardBin = $null
  foreach ($c in @($env:RASIKH_GUARD_BIN, (Join-Path $GuardTarget 'release\rasikh-guard.exe'), (Join-Path $GuardDir 'target\release\rasikh-guard.exe'))) {
    if ($c -and (Test-Path -LiteralPath $c)) { $guardBin = $c; break }
  }
  if ($RebuildGuard -or -not $guardBin) {
    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { throw 'No Guard binary found and cargo is not installed. Install Rust (https://rustup.rs) or set RASIKH_GUARD_BIN to a built rasikh-guard.exe.' }
    Warn "Building Rasikh Guard with cargo into $GuardTarget"
    Warn 'A cold first build compiles the vendored engine and ~150 crates: plan 2 to 6 minutes. A warm rebuild took 49 s on the dev machine.'
    $saved = [Environment]::GetEnvironmentVariable('CARGO_TARGET_DIR', 'Process')
    [Environment]::SetEnvironmentVariable('CARGO_TARGET_DIR', $GuardTarget, 'Process')
    try {
      $b = Start-Process -FilePath 'cargo' -ArgumentList @('build', '--release', '-p', 'rasikh-guard') -WorkingDirectory $GuardDir -NoNewWindow -Wait -PassThru
    } finally { [Environment]::SetEnvironmentVariable('CARGO_TARGET_DIR', $saved, 'Process') }
    if ($b.ExitCode -ne 0) { throw "cargo build failed with exit code $($b.ExitCode)." }
    $guardBin = Join-Path $GuardTarget 'release\rasikh-guard.exe'
    if (-not (Test-Path -LiteralPath $guardBin)) { throw "The build finished but $guardBin does not exist." }
  } else {
    try {
      $binTime = (Get-Item -LiteralPath $guardBin).LastWriteTime
      $newest = Get-ChildItem -LiteralPath (Join-Path $GuardDir 'sidecar\src'), (Join-Path $GuardDir 'policies') -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
      if ($newest -and $newest.LastWriteTime -gt $binTime) { Warn "The Guard binary is older than its sources ($($newest.Name)). Use -RebuildGuard if you changed Guard or its policy." }
    } catch { }
  }
  Good "binary: $guardBin"

  $guardEntry = Start-Managed 'guard' $guardBin @() $GuardDir @{ RASIKH_DEMO_MODE = '1'; RASIKH_GUARD_BIND = "127.0.0.1:$GuardPort,[::1]:$GuardPort" } $GuardPort

  # ---- TAMM mock ------------------------------------------------------------------------------------------------
  Step 'TAMM mock (MCP server, demo mode)'
  if (-not (Test-Path -LiteralPath (Join-Path $TammDir 'node_modules\tsx'))) {
    Warn 'node_modules is missing in packages/tamm-mcp: running npm ci (needs network, about 1 minute)'
    $i = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm', 'ci') -WorkingDirectory $TammDir -NoNewWindow -Wait -PassThru
    if ($i.ExitCode -ne 0) { throw "npm ci failed with exit code $($i.ExitCode)." }
  } else { Good 'node_modules present' }
  $tammEntry = Start-Managed 'tamm-mcp' 'cmd.exe' @('/c', 'npm', 'run', 'dev') $TammDir @{
    RASIKH_DEMO_MODE = '1'; RASIKH_GUARD_URL = $GuardUrl; TAMM_MCP_URL = "$TammUrl/mcp"; TAMM_MCP_HOST = '127.0.0.1'
  } $TammPort

  # ---- Console --------------------------------------------------------------------------------------------------
  Step 'Console'
  $consoleEntry = Start-Managed 'console' $nodeCmd.Source @("`"$ServerMjs`"") $PkgDir @{
    RASIKH_DEMO_MODE = '1'; RASIKH_GUARD_URL = $GuardUrl; TAMM_MCP_URL = "$TammUrl/mcp"
    TAMM_LIVE_PORT = "$ConsolePort"; TAMM_LIVE_HOST = '127.0.0.1'; PORT = "$ConsolePort"
  } $ConsolePort

  Step 'Waiting for the services'
  Wait-Healthy $guardEntry 'Rasikh Guard' "$GuardUrl/health" 30
  Wait-Healthy $tammEntry 'TAMM mock' "$TammUrl/health" 90
  Wait-Healthy $consoleEntry 'Console' "$ConsoleUrl/api/status" 30

  # ---- smoke ----------------------------------------------------------------------------------------------------
  $smokeCode = 0
  if ($NoSmoke) { Warn 'Smoke test skipped (-NoSmoke). Run it before you go on:  node scripts\smoke.mjs' }
  else {
    Step 'Smoke test (runs the three scenarios and asserts the outcomes)'
    $smokeArgs = @("`"$SmokeMjs`"")
    if ($Record) { $smokeArgs += '--record' }
    $smokeEnv = @{ TAMM_LIVE_URL = $ConsoleUrl; RASIKH_GUARD_URL = $GuardUrl; TAMM_MCP_URL = "$TammUrl/mcp" }
    $savedSmoke = @{}
    foreach ($k in $smokeEnv.Keys) { $savedSmoke[$k] = [Environment]::GetEnvironmentVariable($k, 'Process'); [Environment]::SetEnvironmentVariable($k, $smokeEnv[$k], 'Process') }
    try {
      $sp = Start-Process -FilePath $nodeCmd.Source -ArgumentList $smokeArgs -WorkingDirectory $PkgDir -NoNewWindow -Wait -PassThru
      $smokeCode = $sp.ExitCode
    } finally {
      foreach ($k in $smokeEnv.Keys) { [Environment]::SetEnvironmentVariable($k, $savedSmoke[$k], 'Process') }
    }
  }

  Say ''
  Say '------------------------------------------------------------------------------'
  if ($smokeCode -ne 0) {
    Bad "SMOKE TEST FAILED (exit code $smokeCode). Do not go on stage with this state. Services are left running so you can look."
    Say "   Logs: $StateDir"
  } else { Good 'Ready.' }
  Say ''
  Say "   Console (open this, put it on the projector):  $ConsoleUrl"
  Say "   Guard health:                                  $GuardUrl/health"
  Say "   TAMM mock health:                              $TammUrl/health"
  Say ''
  Say '   On stage: pick a scenario and press Run. If anything is down, press Replay.'
  Say '   Reset between takes: the Reset button, or  POST /api/reset  (TAMM first, then Guard).'
  Say "   Logs: $StateDir"
  Say '------------------------------------------------------------------------------'

  if ($Detach) {
    Say '   Detached. Stop later with:  .\start.ps1 -Stop'
    if ($smokeCode -ne 0) { exit 3 }
    exit 0
  }

  Say '   Press Ctrl+C here to stop Guard, the TAMM mock and the console.'
  $warned = @{}
  while ($true) {
    Start-Sleep -Seconds 2
    $upCount = 0
    foreach ($e in @($script:Started | ForEach-Object { $_ })) {
      $up = Test-Alive $null ([int]$e.Pid) ([long]$e.Start)
      if (-not $up -and $e.ListenerPid) { $up = Test-Alive $null ([int]$e.ListenerPid) ([long]$e.ListenerStart) }
      if ($up) { $upCount++ }
      elseif (-not $warned[$e.Name]) { $warned[$e.Name] = $true; Warn "$($e.Name) has stopped. Check $($e.Err). Use Replay on stage until it is back." }
    }
    if ($upCount -eq 0) { Say '   All three services have stopped (for example by -Stop in another window). Exiting.'; break }
  }
}
catch {
  Bad $_.Exception.Message
  exit 1
}
finally {
  if (-not $Detach -and -not $Stop) {
    if ($script:Started.Count -gt 0) {
      Step 'Stopping what this script started'
      Stop-Started
    }
  }
}
