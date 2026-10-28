#!/usr/bin/env bash
# Real Android emulator smoke test for oskar14156/mp4repair.
# Must be invoked as ONE command by reactivecircus/android-emulator-runner,
# because it runs each line of its 'script' argument in a separate /bin/sh.
set -euo pipefail

APK=app/android/app/build/outputs/apk/debug/app-debug.apk
PACKAGE=com.oskarpolster.mp4repair

adb install -r "$APK"
adb shell am force-stop "$PACKAGE" || true
adb shell am start -n "$PACKAGE/.MainActivity"
sleep 8
adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity|ResumedActivity' || true

python3 - <<'PY'
import re
import subprocess
import time
import xml.etree.ElementTree as ET

def adb(*args, timeout=55):
    return subprocess.check_output(['adb', *args], text=True, stderr=subprocess.STDOUT, timeout=timeout)

def hierarchy():
    for _ in range(3):
        try:
            adb('shell', 'uiautomator', 'dump', '/sdcard/mp4repair-ui.xml')
            data = adb('shell', 'cat', '/sdcard/mp4repair-ui.xml')
            return ET.fromstring(data[data.index('<?xml'):])
        except (ValueError, ET.ParseError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            time.sleep(2)
    raise AssertionError('Could not read Android accessibility hierarchy')

def get_nodes():
    return list(hierarchy().iter('node'))

def screen():
    return ' | '.join(
        (e.get('text', '') + ' ' + e.get('content-desc', '')).strip()
        for e in get_nodes()
    )

def click_contains(key):
    for e in get_nodes():
        label = ' '.join((e.get('text', ''), e.get('content-desc', '')))
        if key.casefold() not in label.casefold():
            continue
        m = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', e.get('bounds', ''))
        if m:
            a, b, c, d = map(int, m.groups())
            adb('shell', 'input', 'tap', str((a+c)//2), str((b+d)//2))
            return True
    return False

for attempt in range(9):
    ui = screen()
    print('Onboarding state', attempt, ':', ui[:500], flush=True)
    if 'Try an example' in ui:
        break
    for label in ('Get started', 'Next', 'Continue', 'Done'):
        if click_contains(label):
            break
    else:
        time.sleep(3)
    time.sleep(1)

assert 'Try an example' in screen(), 'Home screen not reached'
assert click_contains('Try an example'), 'Sample button not clickable'
time.sleep(5)
print('Diagnosis UI:', screen()[:900], flush=True)
assert click_contains('Start repair'), 'Start repair button not found'
print('Starting native repair...', flush=True)

success = False
for index in range(90):
    time.sleep(2)
    ui = screen()
    if index % 10 == 0:
        print('Repair state', index, ':', ui[:600], flush=True)
    if 'REPAIR COMPLETE' in ui or 'Your video is back' in ui or 'Frames recovered' in ui:
        print('PASS: Repair completed, screen:', ui[:1500], flush=True)
        success = True
        break
    if 'Your video is ready' in ui or 'Unlock MP4 Repair Pro' in ui:
        # The paywall appears after a successful repair; close it to inspect
        # the actual ResultScreen. No purchase is made.
        if click_contains('Close'):
            time.sleep(1)
    if 'No video frames could be recovered' in ui or 'Repair failed' in ui:
        raise AssertionError('Native sample repair failed: ' + ui[:1200])

assert success, 'No completed repair result after 180s'
print('PASS: install, launch, onboarding, diagnosis, repair and result on Android.', flush=True)
PY

# Catch application crashes in the bounded recent log. An absence of logcat
# crashes alone is not proof against future OOM with very large user videos.
if adb logcat -d -t 1500 | grep -E 'FATAL EXCEPTION|OutOfMemoryError'; then
  echo "Detected a recent fatal Android crash in logcat"
  exit 1
fi
echo 'PASS: no fatal Java exception in recent emulator logcat'
