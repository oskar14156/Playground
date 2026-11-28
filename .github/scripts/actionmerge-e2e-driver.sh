#!/usr/bin/env bash
# Automated Android 16 (API 36) E2E driver for ActionMerge.
# Generates real GoPro & Dashcam test clips, fires ACTION_SEND_MULTIPLE,
# drives UIAutomator across Onboarding -> Home -> Settings -> Project ->
# RecordingDetail (Play Seam + Inspect Metadata) -> Export -> Paywall,
# and fails on any missing flow state, FATAL EXCEPTION, or ANR.
set -euo pipefail

APK_PATH=${1:?usage: $0 <path-to-x86_64-apk>}
PKG="com.oskarpolster.actionmerge"
PUBLIC_MEDIA_DIR="/sdcard/Movies/ActionMergeTest"
APP_MEDIA_DIR="/sdcard/Android/data/$PKG/files/ActionMergeTest"
ARTIFACTS_DIR="e2e-artifacts"
mkdir -p "$ARTIFACTS_DIR" /tmp/am-e2e-media

dump_ui() {
  local out="${1:-/tmp/ui.xml}"
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
  adb pull /sdcard/ui.xml "$out" >/dev/null 2>&1 || true
}

save_failure_diagnostics() {
  echo "Capturing E2E failure diagnostics into $ARTIFACTS_DIR..." >&2
  dump_ui "$ARTIFACTS_DIR/last-ui.xml"
  adb exec-out screencap -p > "$ARTIFACTS_DIR/last-screen.png" 2>/dev/null || true
  adb logcat -d > "$ARTIFACTS_DIR/logcat.txt" 2>/dev/null || true
}
trap 'rc=$?; if [ "$rc" -ne 0 ]; then save_failure_diagnostics; fi' EXIT

wait_id() {
  local id="$1"
  local timeout="${2:-30}"
  local elapsed=0
  while [ "$elapsed" -lt "$timeout" ]; do
    dump_ui /tmp/ui.xml
    if python3 - "$id" /tmp/ui.xml <<'PY'
import sys, xml.etree.ElementTree as ET
target, xml_path = sys.argv[1], sys.argv[2]
try:
    root = ET.parse(xml_path).getroot()
except Exception:
    sys.exit(1)
for node in root.iter('node'):
    rid = node.attrib.get('resource-id', '')
    if rid == target or rid.endswith(':' + target) or rid.endswith('/' + target) or target in rid:
        sys.exit(0)
sys.exit(1)
PY
    then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  echo "Timed out waiting for testID/resource-id matching: $id" >&2
  return 1
}

tap_id() {
  local id="$1"
  local timeout="${2:-20}"
  wait_id "$id" "$timeout"
  local coords
  local attempt=0
  while [ "$attempt" -lt 6 ]; do
    coords=$(python3 - "$id" /tmp/ui.xml <<'PY'
import re, sys, xml.etree.ElementTree as ET
target, xml_path = sys.argv[1], sys.argv[2]
root = ET.parse(xml_path).getroot()
max_y = 0
for node in root.iter('node'):
    m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
    if m:
        max_y = max(max_y, int(m.group(4)))
dock_cutoff = int(max_y * 0.82) if max_y > 0 else 1900
for node in root.iter('node'):
    rid = node.attrib.get('resource-id', '')
    if rid == target or rid.endswith(':' + target) or rid.endswith('/' + target) or target in rid:
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds', ''))
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            cy = (y1 + y2) // 2
            if cy > dock_cutoff:
                print('BELOW_FOLD')
                sys.exit(2)
            print((x1 + x2) // 2, cy)
            sys.exit(0)
sys.exit(1)
PY
    ) && break || rc=$?
    if [ "${rc:-1}" -eq 2 ] || [ "${rc:-1}" -eq 1 ]; then
      adb shell input swipe 540 1550 540 750 300
      sleep 1
      dump_ui /tmp/ui.xml
      attempt=$((attempt + 1))
    else
      break
    fi
  done
  if [ -z "${coords:-}" ] || [ "$coords" = "BELOW_FOLD" ]; then
    echo "Could not scroll to tappable element above dock: $id" >&2
    return 1
  fi
  adb shell input tap $coords
}

scroll_to_id() {
  local id="$1"
  local max_swipes="${2:-5}"
  local i=0
  while [ "$i" -lt "$max_swipes" ]; do
    if wait_id "$id" 2 2>/dev/null; then
      return 0
    fi
    adb shell input swipe 540 1550 540 750 300
    sleep 1
    i=$((i + 1))
  done
  wait_id "$id" 10
}

echo "--- Generating synthetic GoPro + Dashcam media fixtures via ffmpeg"
ffmpeg -y -f lavfi -i testsrc=size=640x360:rate=30 -f lavfi -i sine=frequency=440:sample_rate=48000 \
  -t 2 -c:v libx264 -pix_fmt yuv420p -g 15 -c:a aac /tmp/am-e2e-media/GX010042.MP4 >/dev/null 2>&1
ffmpeg -y -f lavfi -i testsrc=size=640x360:rate=30 -f lavfi -i sine=frequency=440:sample_rate=48000 \
  -ss 2 -t 2 -c:v libx264 -pix_fmt yuv420p -g 15 -c:a aac /tmp/am-e2e-media/GX020042.MP4 >/dev/null 2>&1
ffmpeg -y -f lavfi -i testsrc=size=320x180:rate=30 -t 2 -c:v libx264 -pix_fmt yuv420p -an /tmp/am-e2e-media/GX010042.LRV >/dev/null 2>&1

ffmpeg -y -f lavfi -i smptebars=size=640x360:rate=30 -f lavfi -i sine=frequency=660:sample_rate=48000 \
  -t 3 -c:v libx264 -pix_fmt yuv420p -g 15 -c:a aac /tmp/am-e2e-media/DASH_0001_F.MP4 >/dev/null 2>&1
ffmpeg -y -f lavfi -i smptebars=size=640x360:rate=30 -f lavfi -i sine=frequency=660:sample_rate=48000 \
  -ss 1 -t 3 -c:v libx264 -pix_fmt yuv420p -g 15 -c:a aac /tmp/am-e2e-media/DASH_0002_F.MP4 >/dev/null 2>&1

echo "--- Installing ActionMerge APK and pushing media fixtures"
adb logcat -c
adb install -r "$APK_PATH"
adb shell "mkdir -p $PUBLIC_MEDIA_DIR $APP_MEDIA_DIR"
for f in /tmp/am-e2e-media/*; do
  base=$(basename "$f")
  adb push "$f" "$APP_MEDIA_DIR/$base" >/dev/null
  adb push "$f" "$PUBLIC_MEDIA_DIR/$base" >/dev/null
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://$PUBLIC_MEDIA_DIR/$base" >/dev/null
done
sleep 2
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null

echo "--- Step 1: Onboarding -> Home"
wait_id "onboarding_screen" 30
tap_id "onboarding_next_button" 15
sleep 1
tap_id "onboarding_next_button" 15
sleep 1
tap_id "onboarding_next_button" 15
wait_id "home_screen" 20

echo "--- Step 2: Settings modal open, theme toggle & close"
tap_id "settings_button" 15
wait_id "settings_modal" 15
tap_id "theme_option_light" 10
sleep 1
tap_id "theme_option_dark" 10
tap_id "settings_close_button" 10
wait_id "home_screen" 15

echo "--- Step 3: Trigger cold-start multi-clip import intent with GoPro MP4s + LRV"
IMPORT_URI=$(python3 - "$APP_MEDIA_DIR" <<'PY'
import sys, urllib.parse
d = sys.argv[1]
files = [f"file://{d}/GX010042.MP4", f"file://{d}/GX020042.MP4", f"file://{d}/GX010042.LRV"]
print("actionmerge://import?" + "&".join("uri=" + urllib.parse.quote(u, safe="") for u in files))
PY
)
adb shell am force-stop "$PKG"
adb shell am start -W -a android.intent.action.VIEW -d "$IMPORT_URI" -p "$PKG" >/dev/null

echo "--- Step 4: Verify native reconstruction reaches ProjectScreen & separates LRV"
wait_id "project_screen" 60
wait_id "project_ignored_disclosure" 15
scroll_to_id "recording_card_" 4
tap_id "recording_card_" 15

echo "--- Step 5: Verify RecordingDetailScreen, Play Seam & Inspect Metadata"
wait_id "recording_detail_screen" 20
if scroll_to_id "play_seam_" 3 2>/dev/null; then
  tap_id "play_seam_" 10
  sleep 2
fi
scroll_to_id "clip_menu_button_0" 3
tap_id "clip_menu_button_0" 10
tap_id "clip_inspect_metadata_row" 10
wait_id "clip_metadata_modal" 10
adb shell input keyevent 4
wait_id "recording_detail_screen" 15

echo "--- Step 6: ExportScreen storage check & PaywallModal"
tap_id "detail_export_button" 15
wait_id "export_screen" 15
wait_id "export_available_storage_row" 10
tap_id "export_start_button" 15
wait_id "paywall_modal" 20
tap_id "paywall_close_button" 15
wait_id "export_screen" 15

echo "--- Step 7: Checking logcat for FATAL EXCEPTION or ANR"
adb logcat -d > "$ARTIFACTS_DIR/logcat-final.txt"
if grep -E "FATAL EXCEPTION|ANR in $PKG" "$ARTIFACTS_DIR/logcat-final.txt"; then
  echo "Crash or ANR detected in logcat!" >&2
  exit 1
fi
rm -rf "$ARTIFACTS_DIR"
echo "E2E Android 16 suite PASSED."
