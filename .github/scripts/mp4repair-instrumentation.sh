#!/usr/bin/env bash
set -euo pipefail
adb install -r app/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
echo "=== Running native Kotlin/Android media integration tests ==="
adb shell am instrument -w -r com.oskarpolster.mp4repair.test/androidx.test.runner.AndroidJUnitRunner | tee /tmp/mp4repair-instrumentation.out
if grep -E 'FAILURES!!!|INSTRUMENTATION_CODE: 0|INSTRUMENTATION_FAILED|Process crashed' /tmp/mp4repair-instrumentation.out; then
  echo "Android instrumentation reported a failure"
  exit 1
fi
if ! grep -Eq 'OK \([0-9]+ tests?\)' /tmp/mp4repair-instrumentation.out; then
  echo "No completed Android instrumentation test summary"
  exit 1
fi
echo "PASS native Android instrumentation suite"
