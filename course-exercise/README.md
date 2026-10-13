# University exercise: 10 reproducible public CI tests

This is a **standalone, intentionally public teaching project** in the public `oskar14156/Playground` repository. It models a read-only multi-product price preview. It does **not** test the real private `appreleaser` implementation, and a green check must never be reported as proof that the private app builds or passes its tests.

## Exercise objective

Show that one atomic preview can update three price products—weekly, yearly and lifetime—across selected Apple/Google and country targets, without touching an external API, exposing secrets, or mutating the source catalog. The public module lives at `src/pricing-plan.mjs` and its exactly **10 Node.js tests** at `tests/pricing-plan.test.mjs`.

## Run locally

Requires Node.js >= 22. There are no package dependencies or required secrets.

```bash
node --check course-exercise/src/pricing-plan.mjs
node --check course-exercise/tests/pricing-plan.test.mjs
node --test course-exercise/tests/pricing-plan.test.mjs
```

Run from the **repository root**. The TAP summary should contain `# tests 10`, `# pass 10`, `# fail 0`. A workflow also asserts the exact test and pass counts so deleting tests cannot make the assignment falsely green.

## Run on GitHub

1. Open https://github.com/oskar14156/Playground/actions and enable workflows if GitHub shows a disabled fork prompt.
2. Select **Course exercise - ten public pricing tests**.
3. Select **Run workflow** and choose `course/ten-test-pricing-lab` while reviewing this exercise, or `main` after merging its pull request.
4. Open the completed run. Under **Ten public price-planning tests**, verify green steps and the actual **10/10** summary; capture the run URL or screenshot for submission.
5. Workflow files are discovered and shown for manual dispatch reliably after inclusion on the repository's default branch. If the workflow is not listed before merge, merge the course PR and run it on `main`.

The CI workflow also runs on pushes to `main` and the exercise branch when paths under `course-exercise/` change, and on relevant pull requests. Fork/organization Actions permissions may still require enabling or approval.

## Test inventory

| # | Evidence |
|---|---|
| 01 | Decimal price strings to integer cents |
| 02 | Reject malformed monetary strings and >2 decimal digits |
| 03 | Reject zero, negative and unsafe large prices |
| 04 | Require all 3 products in one change |
| 05 | Reject unexpected fourth product identifiers |
| 06 | Preview weekly + yearly + lifetime in one operation |
| 07 | Apply one batch to Apple and Google |
| 08 | Preserve unselected countries |
| 09 | Error on missing region without any source-catalog mutation |
| 10 | Reject duplicate/invalid store and country selections |

## Security and compliance boundary

- Tests are for the public module checked into this very repository, so the public runner is doing work associated with its own software project.
- **Do not** add a personal access token (PAT), deploy key, private repository checkout, or private build artifacts to this workflow.
- The module performs **zero real Apple/Google requests or price updates**. `previewOnly: true` is an explicit result indicator.
- A public repository does not make secret-bearing workflows inherently safe. Workflow definitions, logs and artifacts can be inspected by other people.
- Standard GitHub-hosted runner minutes for a public repo are normally free, but use must conform to GitHub's Actions terms and service limits; this is not an unrestricted runner for unrelated private code.

For actual `oskar14156/appreleaser` compilation and store integration tests, use a local checkout / authorized private CI (not this teaching example).

References:
- [GitHub Actions additional terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)
- [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)
