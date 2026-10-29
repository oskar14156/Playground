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

# A real extended recording is required: the bundled five-second clip
# finishes before uiautomator can find the Stop button. Generate in CI only.
# Retain the fast-start moov while truncating the final mdat; this avoids
# forcing an extra reference-picker flow, and keeps genuine video corruption.
echo 'Creating extended damaged H.264 cancellation fixture (not user data)'
mkdir -p /tmp/mp4repair-cancel
ffmpeg -hide_banner -loglevel error -nostdin -y \
  -f lavfi -i 'testsrc2=size=1280x720:rate=30:duration=12' \
  -vf 'noise=alls=8:allf=t+u' -c:v libx264 -threads 2 \
  -preset ultrafast -crf 21 -pix_fmt yuv420p \
  -movflags +faststart /tmp/mp4repair-cancel/seed.mp4
python3 - <<'PYFIXTURE'
import os
seed=os.path.getsize('/tmp/mp4repair-cancel/seed.mp4')
loops=max(1, (360_000_000 // seed)+1)
print('CANCEL FIXTURE seed bytes',seed,'stream loops',loops,flush=True)
with open('/tmp/mp4repair-cancel/loops','w') as f:f.write(str(loops))
PYFIXTURE
ffmpeg -hide_banner -loglevel error -nostdin -y \
  -stream_loop "$(cat /tmp/mp4repair-cancel/loops)" \
  -i /tmp/mp4repair-cancel/seed.mp4 -c copy -movflags +faststart \
  /tmp/mp4repair-cancel/healthy.mp4
python3 - <<'PYTRUNCATE'
import os, shutil
source='/tmp/mp4repair-cancel/healthy.mp4'
target='/tmp/mp4repair-cancel/MP4RepairCancelBroken.mp4'
length=os.path.getsize(source)
# Truncate mdat but preserve fast-start moov and the stream's codec metadata.
with open(source,'rb') as inp, open(target,'wb') as out:
    remaining=length*97//100
    while remaining:
        block=inp.read(min(4*1024*1024,remaining))
        if not block: raise AssertionError('Unexpected short fixture')
        out.write(block)
        remaining-=len(block)
size=os.path.getsize(target)
assert size>=350_000_000,(size,length)
print('CANCEL FIXTURE healthy',length,'damaged',size,flush=True)
PYTRUNCATE
rm -f /tmp/mp4repair-cancel/healthy.mp4
adb shell mkdir -p /sdcard/Download
adb push /tmp/mp4repair-cancel/MP4RepairCancelBroken.mp4 /sdcard/Download/MP4RepairCancelBroken.mp4
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
  -d file:///sdcard/Download/MP4RepairCancelBroken.mp4 || true

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
    # Some API 35/36 cold boots show a blank app tree for >30 seconds.
    # Do not consume a fixed number of attempts before onboarding is visible.
    deadline=time.monotonic()+110
    polls=0
    last=''
    while time.monotonic()<deadline:
        state=ui()
        last=state
        polls+=1
        if 'Try an example' in state:
            print('ONBOARDING HOME REACHED after polls',polls,flush=True)
            return
        if polls%4==1:
            print('ONBOARDING POLL',polls,state[-650:],flush=True)
        acted=False
        if "Quickstep isn't responding" in state:
            acted=tap('Close app')
            if acted:
                adb('shell','am','start','-n',P+'/.MainActivity')
        for label in ('Skip','Get started','Next','Continue','Done'):
            if acted or label.casefold() not in state.casefold():continue
            if tap(label):
                acted=True
                break
            if label == 'Skip':
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
    raise AssertionError('Onboarding did not reach Home after 110 seconds: '+last[-1400:])
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
    # The upgrade sheet replaces Settings, rather than stacking atop it:
    # closing returns directly to Home. A further Back would exit the app.
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

def free_result_export_requires_pro():
    # Exercise BOTH paid actions without tapping Unlock now or charging Google Play.
    # A successful native repair must remain available after the sheet closes.
    # The first repair legitimately auto-opens Pro after a short delay.
    # Dismiss it before testing manually requested Save and Share gates.
    first=ui()
    if 'Unlock MP4 Repair Pro' in first or 'Restore purchases' in first:
        assert tap('Close'),'Cannot dismiss legitimate automatic post-repair upsell'
    result=expect_any(['Frames recovered','Your video is back'],20)[1]
    assert 'Frames recovered' in result, 'Repair result vanished before Pro gate test'
    for action in ('Save in full quality to Gallery','Share'):
        assert tap(action),'Free result action missing: '+action
        offer=expect_any(['Unlock MP4 Repair Pro','Restore purchases'],20)[1]
        assert 'Unlock MP4 Repair Pro' in offer, 'Free export unexpectedly bypassed Pro gate: '+offer[:800]
        assert tap('Close'),'Cannot dismiss Pro offer opened by '+action
        restored=expect_any(['Frames recovered','Your video is back'],20)[1]
        assert 'Frames recovered' in restored, 'Closing Pro offer lost repair result'
        print('FREE RESULT PRO GATE VERIFIED',action,flush=True)
check('free-result-save-and-share-are-gated',free_result_export_requires_pro)

def background_restore():
    adb('shell','input','keyevent','3')
    time.sleep(1)
    adb('shell','am','start','-n',P+'/.MainActivity')
    _,state=expect_any(['Your video is back','Frames recovered'],20)
    assert 'Restore purchases' not in state, 'Automatic paywall appeared after background/restore'
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

def reopened_result_export_requires_pro():
    # The app deliberately dismisses RepairedFileSheet before opening Pro.
    # Closing that paywall returns Home, so reopen the saved file per action.
    for action in ('Save in full quality to Gallery','Share'):
        assert tap('SampleDamaged'), 'Cannot reopen repaired file for Pro entitlement test'
        expect_any(['Save in full quality','Share'],20)
        assert tap(action), 'Missing reopened export action: '+action
        offer=expect_any(['Unlock MP4 Repair Pro','Restore purchases'],20)[1]
        assert 'Unlock MP4 Repair Pro' in offer,'Reopened file export bypassed Pro: '+offer[:800]
        assert tap('Close'),'Cannot close reopened file Pro sheet'
        home=expect_any(['Try an example'],20)[1]
        assert 'SampleDamaged-repaired' in home, 'Repaired file lost from Home after dismissing Pro'
        print('REOPENED FILE PRO GATE VERIFIED',action,flush=True)
check('reopened-file-save-and-share-are-gated',reopened_result_export_requires_pro)

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
    # Exercise a REAL Android document import of a ~350MB truncated H.264 file.
    # The bundled five-second demo is NOT a valid live-cancellation fixture.
    filename='MP4RepairCancelBroken.mp4'
    assert tap('Choose a video file'),'Cannot open Files for cancellation clip'
    selected=False
    for attempt in range(16):
        state=ui()
        if filename.casefold() in state.casefold():
            selected=tap(filename)
            if selected:break
        if 'Downloads' in state and attempt<6:
            tap('Downloads')
        elif attempt in (5,10):
            adb('shell','input','swipe','500','1400','500','450','400')
        time.sleep(1)
    assert selected,'Synthetic 350MB damaged file absent from Android Files picker: '+ui()[:1100]
    # Android's Downloads provider sometimes resolves a tapped MP4 via its
    # system ACTION_VIEW chooser rather than immediately returning a document.
    # Select our app once and validate the real inbound-import integration.
    post_pick=ui()
    if 'Open with' in post_pick and 'Just once' in post_pick:
        print('ANDROID FILE OPEN-WITH CHOOSER',post_pick[:650],flush=True)
        assert (tap('Repair with MP4 Repair') or tap('MP4 Repair')), 'Cannot select MP4 Repair from Android Open with'
        if 'Just once' in ui():
            assert tap('Just once'), 'Cannot confirm Android chooser selection'
    # Copying the file to app-private storage is deliberately included here.
    page=expect_any(['Start repair','Choose a reference','This file could not be repaired'],180)[1]
    print('LARGE FILE DIAGNOSIS',page[:1000],flush=True)
    assert 'Start repair' in page,'Large video did not reach actionable diagnosis'
    assert tap('Start repair'),'Could not start large damaged-video repair'
    # Never accept a completed repair, paywall or failure as a substitute for
    # an actual Stop on a visibly active repair. Any such state stays RED.
    page=expect_any(['Rebuilding your video','Your video is ready','Your video is back','This file could not be repaired'],40)[1]
    assert 'Rebuilding your video' in page,'Repair finished/failed before UI cancellation could be exercised: '+page[:900]
    assert tap('Stop'),'Could not tap Stop while the real large repair was running'
    page=expect_any(['Start repair','Try an example','This file could not be repaired'],45)[1]
    assert 'Your video is back' not in page,'Cancel unexpectedly navigated to a successful result'
    assert 'This file could not be repaired' not in page,'Cancel raised a repair failure instead of recovering navigation'
    print('LIVE CANCELLATION OF LARGE DAMAGED FILE VERIFIED',page[:800],flush=True)
check('cancel-repair-and-recover-navigation',cancel_repair)

def cancelled_output_is_not_listed_and_app_recovers():
    # The in-progress UI Stop must not create a phantom successful result.
    # The native Android integration suite separately asserts output.exists() == false.
    state=ui()
    if 'Start repair' in state and 'Diagnosis' in state:
        assert tap('Back'),'Cannot leave cancelled recording diagnosis'
    home=expect_any(['Try an example'],20)[1]
    assert 'MP4RepairCancelBroken-repaired' not in home, 'Cancelled output leaked into Recents'
    adb('shell','input','keyevent','3')
    time.sleep(1)
    adb('shell','am','start','-n',P+'/.MainActivity')
    home=expect_any(['Try an example'],20)[1]
    assert 'MP4RepairCancelBroken-repaired' not in home, 'Cancelled output appeared after foreground reload'
    # Prove a fresh real native repair still works after the cancellation.
    assert tap('Try an example'),'Sample unavailable after cancellation'
    expect_any(['Video index missing'],25)
    assert tap('Start repair'),'Cannot restart native repair after cancellation'
    deadline=time.monotonic()+100
    while time.monotonic()<deadline:
        state=ui()
        if 'Your video is ready' in state or 'Unlock MP4 Repair Pro' in state:
            assert tap('Close'),'Cannot dismiss expected upsell after new repair'
        elif 'Frames recovered' in state and 'Your video is back' in state:
            print('CANCEL RECOVERY REPAIR VERIFIED',state[:600],flush=True)
            return
        elif 'This file could not be repaired' in state:
            raise AssertionError('Subsequent repair failed: '+state[:900])
        time.sleep(1)
    raise AssertionError('App did not recover for next repair after cancellation: '+ui()[:900])
check('cancelled-output-absent-and-next-repair-works',cancelled_output_is_not_listed_and_app_recovers)

print('ANDROID MATRIX FINAL',checks,flush=True)
PY

if adb logcat -d -t 1500 | grep -E 'FATAL EXCEPTION|OutOfMemoryError|SIGABRT'; then
  echo 'FAIL: Android fatal crash found'
  exit 1
fi
echo 'PASS: Android native logs have no recent fatal exception'
