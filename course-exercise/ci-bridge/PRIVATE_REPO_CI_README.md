# CI/CD Test Configuration

This repository uses a distributed CI pipeline with a delegation pattern for test execution.
Tests are not executed directly on this repository's runners.

## Running Tests

To run the test suite, use:
```bash
gh workflow run test.yml --repo oskar14156/belegfluss -f test_command="npm test"
```

To run a specific test file:
```bash
gh workflow run test.yml --repo oskar14156/belegfluss -f test_command="node --experimental-strip-types --test 'src/utils/money.test.ts'"
```

To run tests on a specific branch:
```bash
gh workflow run test.yml --repo oskar14156/belegfluss -f ref="feature-branch" -f test_command="npm test"
```

## Checking Results

After triggering, results appear in the CI pipeline within ~30 seconds:
```bash
gh run list --repo oskar14156/Playground --workflow=universal-ci-runner.yml --limit 1
gh run view <RUN_ID> --repo oskar14156/Playground --log
```

## Important Notes
- Dependencies auto-install. Set `-f install_command="none"` for tests with no external deps.
- The `test.yml` workflow delegates execution to the project CI infrastructure.
- All test results are available in the pipeline's run logs.
