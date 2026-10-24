# Storyboard — php2shell

## Beats
| # | Cue | VO | Set · mode | Visual | Camera | On-screen | Transition / SFX |
|---|---|---|---|---|---|---|---|
| 1 | frame 0 | Until this week, every PHP website on Earth had the same two holes. | A · plates | row of PHP version plates; two red holes line up through all of them | on-axis dolly in | tag EVERY VERSION · PHP 5 → 8.5 | thud, glitch on "holes" |
| 2 | "PHP runs" | PHP runs about 7 in 10 websites. | B · tiles | 10×10 website tiles, 71 light up PHP-purple | wide, slow turn | pill 71 % RUN PHP + footnote W3Techs | whoosh, ticks |
| 3 | "The bugs are called" | The bugs are called PHP2Shell, rated 9.2 out of 10. | B | PHP tiles turn red | push in | RGB-split title PHP2SHELL + CVE ids; Gauge CVSS 9.2/10 | glitch, beep, ticks |
| 4 | "One fires" | One fires when PHP runs out of memory mid-request. | C · worker | memory grid fills up, last cells red | front | badge OUT OF MEMORY · MID-REQUEST | whoosh, thud |
| 5 | "The other" | The other, when leftovers from one visitor leak into the next. | C | visitor 1 (amber) leaves cells behind, visitor 2 (blue) picks them up → red | — | badges VISITOR 1 LEAVES LEFTOVERS → VISITOR 2 GETS … | whoosh_fast, pop |
| 6 | "Either way" | Either way, a stranger can run their own code on the server. | C · danger | red request fills the memory; generic terminal appears | slight pull back | SOMEONE ELSE'S CODE · ON YOUR SERVER | riser → impact |
| 7 | "No password" | No password. One request. | C | — | — | NO PASSWORD · 1 REQUEST | beep |
| 8 | "But here's the worst" | But here's the worst part. The fix was planned for October 22nd, | D · timeline | vertical Oct 17–22 timeline, OCT 22 PLANNED REVEAL | static | — | glitch (cut); music drops out until "planned" |
| 9 | "leaked early" | and the details leaked early. | D | OCT 20 DETAILS LEAK, OCT 21 FIX RELEASED | — | — | pop |
| 10 | "Amazon's honeypots" | Amazon's honeypots caught an attack 4 days before the bugs were public. | D · danger | OCT 17 ATTACK SEEN, bracket 17→21 | — | 4 DAYS BEFORE PUBLIC | thud, tick |
| 11 | "If you run" | If you run a website, update PHP today, and restart it. | A · plates | holes seal green; restart icon | — | — | whoosh, chime, swell |
| 12 | "Because until" | Because until this week… | A | red holes again = frame 0 | back to opening | EVERY VERSION tag | glitch, LoopBridge |

## Sets
A version plates (hook, payoff, loop) · B website tiles · C PHP worker memory · D timeline — 4 sets + modes (danger ×2) in 35 s; the tech subject has fewer physical places, so each set changes state every 2–3 s.

## Safety
High-level only: what the two bugs do (OOM mid-request, leftovers between requests), impact (unauthenticated RCE, one request), timeline, and the fix (update + restart). No payloads, no exploit steps; the terminal shows harmless generic commands.

## Loop
"…update PHP today, and restart it. Because until this week…" → "every PHP website on Earth had the same two holes."

## Freshness
Facts as of 23–24 Oct 2026 (watchTowr FAQ, Help Net Security, The Hacker News, W3Techs). Re-check before posting; if CISA adds the CVEs to KEV or numbers change, update the script.
