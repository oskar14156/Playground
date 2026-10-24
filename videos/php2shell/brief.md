# PHP2Shell — two holes in every PHP website
- Question: what is PHP2Shell, why is it serious, and what should site owners do?
- Length: ~38 s · Language: en · Voice: chatterbox default, block mode, pitch −1 · Music: tension
- Palette: night (tech: PHP purple #777BB4 + red for danger, green for fixed) · Captions: punch
- Audience: anyone with a website / dev-curious viewers who saw the news
- Protagonist: the "two holes" — punched through every PHP version, sealed by the patch
- Loop: "…update PHP today, and restart it. Because until this week…" → "every PHP website on Earth had the same two holes."
- Safety: explain what and why at a high level only. No exploit details, no payloads, no "how to" beyond "update + restart".
- Freshness: news from 20–23 Oct 2026; publish fast; re-check facts before posting.

## Facts
1. Two flaws, CVE-2026-109618 (RCE via out-of-memory corruption mid-request) and CVE-2026-109619 (RCE via stale global state leaking into the next request on the same worker); unauthenticated; CVSS v4.0 9.2 — https://watchtowr.com/intelligence/php-cve-2026-109618-faq/
2. "Every PHP installation that serves web requests is in scope" (FPM, mod_php, CGI, LiteSpeed, FrankenPHP); old branches incl. PHP 5 affected, no fix — same
3. Fixed: 8.5.12, 8.4.27, 8.3.36, 8.2.35 (backports for 7.4/8.0/8.1); no configuration change fully mitigates; restart workers after updating — same + https://www.helpnetsecurity.com/2026/10/21/php2shell-php-vulnerabilities-patched-cve-2026-109618-cve-2026-109619/
4. A working exploit needs a single unauthenticated request — Help Net Security (above)
5. Timeline: details leaked 20 Oct ahead of the planned 22 Oct disclosure; fixes 21 Oct; exploitation seen in the wild since 21 Oct (watchTowr) — watchTowr FAQ
6. Amazon's MadPot honeypot recorded an exploitation attempt on 17 Oct, four days before public disclosure — Help Net Security (above); https://thehackernews.com/2026/10/someone-tried-to-exploit-php2shell-4.html
7. PHP is used by ~71 % of websites whose server-side language is known (70.8 % Jul 2026, 71.9 % Mar 2026) — https://w3techs.com/technologies/overview/programming_language → "about 7 in 10 websites" + on-screen footnote

## Hooks considered
- H1 Scale/wrong-belief: "Until this week, every PHP website on Earth had the same two holes." ← picked (true as stated, loopable)
- H2 Scale shock: "7 in 10 websites run on PHP. This week, all of them got two holes."
- H3 Mid-action: "Someone attacked this bug 4 days before anyone knew it existed."
