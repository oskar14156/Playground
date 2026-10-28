#!/usr/bin/env bash
set -euo pipefail
P=com.oskarpolster.mp4repair
adb install -r app/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell mkdir -p /sdcard/Android/data/$P/files
adb push /tmp/mp4repair-large/stress-broken.mp4 /sdcard/Android/data/$P/files/stress-broken.mp4
adb push /tmp/mp4repair-large/reference.mp4 /sdcard/Android/data/$P/files/stress-reference.mp4
adb logcat -c
adb shell am instrument -w -r -e class com.oskarpolster.mp4repair.AndroidRepairIntegrationTest#repairLargeBrokenVideoWithRealDeviceDecoderWhenFixtureProvided "$P.test/androidx.test.runner.AndroidJUnitRunner" | tee /tmp/mp4repair-large-test.log
grep -F 'OK (1 test)' /tmp/mp4repair-large-test.log
if grep -E 'FAILURES!!!|INSTRUMENTATION_CODE: 0|INSTRUMENTATION_FAILED|Process crashed' /tmp/mp4repair-large-test.log; then
  exit 1
fi
adb logcat -d -t 2000 | grep -E 'LARGE_REPAIR_PASS|FATAL EXCEPTION|OutOfMemoryError|SIGABRT' | tail -30 || true
if adb logcat -d -t 2500 | grep -E 'FATAL EXCEPTION|OutOfMemoryError|SIGABRT'; then
  echo 'FAIL: android crash while repairing large file'
  exit 1
fi
echo 'PASS: genuine large damaged MP4 rebuilt and validated on Android'
