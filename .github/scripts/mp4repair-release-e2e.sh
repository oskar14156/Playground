#!/usr/bin/env bash
# E2E regression matrix on a real Android emulator, using a Release-mode
# APK signed ONLY with the disposable development key on a CI runner.
# The original user files are never uploaded. No purchase is attempted.
set -euo pipefail

APK=app/android/app/build/outputs/apk/release/app-release.apk
PACKAGE=com.oskarpolster.mp4repair
adb install -r "$APK"
adb shell am force-stop "$PACKAGE" || true
adb logcat -c || true
adb shell am start -n "$PACKAGE/.MainActivity"
sleep 7

python3 - <<'PY'
import re, subprocess, time, xml.etree.ElementTree as ET, traceback

P='com.oskarpolster.mp4repair'
checks=[]
def adb(*args, timeout=45):
    return subprocess.check_output(['adb', *args], timeout=timeout, text=True, stderr=subprocess.STDOUT)
def nodes():
    for i in range(3):
        try:
            adb('shell','uiautomator','dump','/sdcard/ui.xml')
            xml=adb('shell','cat','/sdcard/ui.xml')
            return list(ET.fromstring(xml[xml.index('<?xml'):]).iter('node'))
        except (ValueError,ET.ParseError,subprocess.CalledProcessError,subprocess.TimeoutExpired):
            time.sleep(1)
    raise AssertionError('Android accessibility hierarchy unavailable')
def ui():
    return ' | '.join((n.get('text','')+' '+n.get('content-desc','')).strip() for n in nodes())
def tap(name):
    options=[]
    for n in nodes():
        label=' '.join((n.get('text',''),n.get('content-desc','')))
        if name.casefold() not in label.casefold():continue
        m=re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',n.get('bounds',''))
        if not m:continue
        x1,y1,x2,y2=map(int,m.groups())
        if x2<=x1 or y2<=y1:continue
        options.append((n.get('clickable')=='true',(x2-x1)*(y2-y1),x1,y1,x2,y2))
    if not options:
        print('NO VALID TOUCH TARGET',name, 'candidates=', [
            (n.get('text',''),n.get('content-desc',''),n.get('bounds',''))
            for n in nodes() if name.casefold() in
            (n.get('text','')+' '+n.get('content-desc','')).casefold()
        ][:12],flush=True)
        return False
    clickable,area,x1,y1,x2,y2=max(options)
    print('TAP',name,'clickable',clickable,'coords',((x1+x2)//2,(y1+y2)//2),flush=True)
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
    return True
def expect_any(names,seconds=30):
    last=''
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        last=ui()
        if "Quickstep isn't responding" in last:
            tap('Close app')
            adb('shell','am','start','-n',P+'/.MainActivity')
        for name in names:
            if name.casefold() in last.casefold():return name,last
        time.sleep(1)
    raise AssertionError('Expected any of '+str(names)+' but got: '+last[:1100])
def check(name,action):
    print('CASE START',name,flush=True)
    try:
        action()
        checks.append((name,'PASS'))
        print('CASE PASS',name,flush=True)
    except Exception as e:
        checks.append((name,'FAIL'))
        print('CASE FAIL',name,repr(e),'UI=',ui()[:1200],flush=True)
        try:
            import os
            os.makedirs('ci/.github/test-output/mp4repair',exist_ok=True)
            adb('shell','screencap','-p','/sdcard/mp4repair-test-fail.png')
            adb('pull','/sdcard/mp4repair-test-fail.png',
                'ci/.github/test-output/mp4repair/'+name+'.png')
        except Exception as screenshot_error:
            print('Unable to save screenshot:',str(screenshot_error),flush=True)
        try:
            print('MEMORY',adb('shell','dumpsys','meminfo',P)[:1400],flush=True)
            print('RECENT APP LOGS', '\n'.join(l for l in adb('logcat','-d','-t','700').splitlines() if P in l or 'ReactNativeJS' in l or 'FATAL EXCEPTION' in l)[-10000:],flush=True)
        except Exception as caught:print('Log capture issue:',caught,flush=True)
        raise

def onboarding():
    for _ in range(12):
        state=ui()
        if 'Try an example' in state:return
        acted=False
        for label in ('Skip','Get started','Next','Continue','Done'):
            if label.casefold() not in state.casefold():continue
            if tap(label):
                acted=True
                break
            if label == 'Skip':
                # Android's UIAutomator on some API 36 snapshots exposes a
                # visible Skip label with a malformed/off-screen bounds rect.
                # The fixed top-right target is a fallback only when the
                # actual Skip node is visible but impossible to tap by bounds.
                size=adb('shell','wm','size')
                matches=re.findall(r'(\d+)x(\d+)',size)
                if matches:
                    width,height=map(int,matches[-1])
                    point=(int(width*.92),int(min(190,max(115,height*.075))))
                    print('FALLBACK SKIP',point,'screen',size.strip(),flush=True)
                    adb('shell','input','tap',*map(str,point))
                    acted=True
                    break
        if not acted:time.sleep(2)
        time.sleep(.7)
    expect_any(['Try an example'],10)
check('onboarding-to-home',onboarding)

def settings():
    assert tap('Settings'),'Settings button not present'
    expect_any(['Settings','Language'],15)
    adb('shell','input','keyevent','4')
    expect_any(['Try an example'],15)
check('settings-back-navigation',settings)

def open_and_cancel_file_picker():
    before=ui()
    assert tap('Choose a video file'), 'Choose a video file button not present'
    time.sleep(2)
    opened=ui()
    assert opened != before, 'Android document picker never appeared'
    print('DOCUMENT PICKER',opened[:550],flush=True)
    adb('shell','input','keyevent','4')
    expect_any(['Try an example'],20)
check('files-picker-open-and-cancel',open_and_cancel_file_picker)

def open_and_cancel_photo_picker():
    before=ui()
    assert (tap('Choose from Gallery') or tap('Choose from Photos')), 'Gallery picker entry not present'
    time.sleep(2)
    opened=ui()
    assert opened != before, 'Android photo picker never appeared'
    print('PHOTO PICKER',opened[:550],flush=True)
    adb('shell','input','keyevent','4')
    expect_any(['Try an example'],20)
check('photos-picker-open-and-cancel',open_and_cancel_photo_picker)

def pro_paywall_without_purchase():
    assert tap('Settings'), 'Settings entry absent'
    expect_any(['Unlock Pro'],15)
    assert tap('Unlock Pro'), 'Upgrade entry absent'
    expect_any(['Restore purchases','Unlock now','Your video is ready'],25)
    print('PRO PAYWALL (NO PURCHASE)',ui()[:800],flush=True)
    assert tap('Close'), 'Paywall could not be dismissed'
    expect_any(['Settings','MP4 Repair Pro'],15)
    adb('shell','input','keyevent','4')
    expect_any(['Try an example'],20)
check('paywall-open-and-dismiss-no-purchase',pro_paywall_without_purchase)

def diagnosis():
    assert tap('Try an example'),'sample button missing'
    found,page=expect_any(['Video index missing','Diagnosis'],25)
    if 'Video index missing' not in page:found,page=expect_any(['Video index missing'],20)
    assert 'SampleDamaged.mp4' in page,page[:700]
    print('DIAGNOSIS',page[:800],flush=True)
    # Let reference evaluation complete before pressing Repair.
    time.sleep(2)
check('sample-diagnosis',diagnosis)

def repair():
    assert tap('Start repair'),'start button missing'
    progress_seen=False
    for i in range(90):
        state=ui()
        if i % 8 == 0:print('REPAIR',i,state[:750],flush=True)
        if 'Rebuilding your video' in state or 'Writing the repaired' in state:
            progress_seen=True
        if 'Your video is ready' in state or 'Unlock MP4 Repair Pro' in state:
            tap('Close')
            time.sleep(1)
        if 'Your video is back' in state or 'Frames recovered' in state:
            print('REPAIR RESULT',state[:1200],flush=True)
            assert 'Preview' in state or 'Frames recovered' in state
            return
        if 'This file could not be repaired' in state or 'No video frames' in state:
            raise AssertionError('Native repair failed: '+state[:1400])
        if i==8 and 'Diagnosis' in state and 'Start repair' in state:
            print('STUCK DIAGNOSIS; APP LOGS:', '\n'.join(l for l in adb('logcat','-d','-t','700').splitlines() if 'ReactNativeJS' in l or 'AndroidRuntime' in l)[-5000:],flush=True)
        time.sleep(1)
    raise AssertionError('No successful result; last UI: '+ui()[:1200])
check('real-native-sample-repair',repair)

def background_restore():
    adb('shell','input','keyevent','3')
    time.sleep(1)
    adb('shell','am','start','-n',P+'/.MainActivity')
    expect_any(['Your video is back','Frames recovered','Your video is ready'],20)
check('background-and-resume-preview',background_restore)

def result_to_home():
    assert tap('Repair another video'),'Result action missing'
    state=expect_any(['Try an example'],20)[1]
    assert 'REPAIRED VIDEOS' in state.upper() or 'SampleDamaged' in state
check('result-back-to-home',result_to_home)

def reopen():
    # Most recent repaired file must be reachable from home.
    state=ui()
    print('HOME AFTER REPAIR',state[:900],flush=True)
    if 'SampleDamaged' not in state:
        raise AssertionError('Repaired file was not listed on Home')
    assert tap('SampleDamaged'),'Repaired file list row not actionable'
    expect_any(['Preview','Save in full quality','Share','Delete from app'],15)
    adb('shell','input','keyevent','4')
    expect_any(['Try an example'],20)
check('reopen-repaired-video-and-back',reopen)

def second_sample():
    assert tap('Try an example'),'Try an example missing after repair'
    expect_any(['Video index missing'],25)
    assert tap('Start repair')
    # Progress alone is not evidence of a second successful repair.
    deadline=time.monotonic()+100
    while time.monotonic()<deadline:
        state=ui()
        if 'Your video is ready' in state or 'Unlock MP4 Repair Pro' in state:
            tap('Close')
        elif 'Your video is back' in state or 'Frames recovered' in state:
            return
        elif 'This file could not be repaired' in state:
            raise AssertionError('Second repair failed: '+state[:1100])
        time.sleep(1)
    raise AssertionError('Second repair never reached the result screen: '+ui()[:1100])
check('second-repair-complete',second_sample)

def repeated_preview_lifecycle():
    # Each *new* repair deliberately offers Pro once. A test that arrives at
    # the result before the 2.4s upsell must dismiss that legitimate modal
    # rather than mistaking it for a broken result navigation button.
    state=ui()
    if 'Restore purchases' in state and 'Your video is ready' in state:
        print('Dismissing expected second-repair paywall',flush=True)
        assert tap('Close'), 'Cannot dismiss expected Pro sheet'
        time.sleep(1)
    assert tap('Repair another video'),'Cannot return home for preview stress'
    expect_any(['Try an example'],20)
    for n in range(6):
        assert tap('SampleDamaged'), 'Cannot open saved recording pass '+str(n)
        expect_any(['Preview','Share','Save in full quality'],20)
        adb('shell','input','keyevent','3')
        time.sleep(.5)
        adb('shell','am','start','-n',P+'/.MainActivity')
        expect_any(['Preview','Share','Save in full quality'],20)
        adb('shell','input','keyevent','4')
        expect_any(['Try an example'],20)
        print('Preview lifecycle cycle',n+1,'of 6 PASS',flush=True)
check('six-reopen-and-background-cycles',repeated_preview_lifecycle)

def cancel_repair():
    assert tap('Try an example'),'Cannot start cancellation scenario'
    expect_any(['Video index missing'],25)
    assert tap('Start repair')
    page=expect_any(['Rebuilding your video'],20)[1]
    assert tap('Stop'),'Could not tap cancellation'
    # A cancellation is not a crash; it must navigate safely out of progress.
    expect_any(['Try an example','Video index missing','This file could not be repaired'],30)
check('cancel-repair-and-recover-navigation',cancel_repair)

print('ANDROID MATRIX FINAL',checks,flush=True)
PY

if adb logcat -d -t 1500 | grep -E 'FATAL EXCEPTION|OutOfMemoryError|SIGABRT'; then
  echo 'FAIL: Android fatal crash found'
  exit 1
fi
echo 'PASS: Android native logs have no recent fatal exception'
