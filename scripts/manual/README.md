# Manual scripts

These are ad-hoc scripts a developer runs by hand against a live system. They
are **not** tests and are not collected by pytest.

They were previously named `test_*.py` and sat at the repository root, where
pytest would have collected and executed them at import time. Each one:

- hardcodes a Windows path (`sys.path.insert(0, r'X:\second-brain-kb')`), so it
  only imports on one developer's machine;
- has side effects on import — writes files, runs shell commands, or calls a
  live agent.

Run them deliberately, from the repository root, with the project's runtime
dependencies installed:

    python scripts/manual/test_mcp_tools.py

Automated tests live in `tests/` and must stay import-safe and side-effect free.
