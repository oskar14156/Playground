@AGENTS.md

## Claude Code notes
- The skills in `.claude/skills/` load automatically (`reel-director`, `reel-build`, `remotion-*`).
- Voice the owner picked (2026-10-24): Chatterbox built-in voice, block mode, cfg 0.4 /
  exaggeration 0.6, 1 semitone lower (`--pitch -1`, the chatterbox default). Watch voice.py's
  `check:` line for misspoken words and re-run with another `--seed`.
- On 2026-10-23 Chatterbox on the GPU (MPS) took 9 GB while the disk was full and macOS froze
  → watchdog reboot. That is why voice.py runs on CPU in a child process with a memory guard.
- edge-tts sometimes answers with no audio; voice.py retries. Its `rate=` option is broken,
  so speed is applied with ffmpeg atempo.
