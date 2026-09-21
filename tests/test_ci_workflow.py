"""Guards on the CI workflow itself.

The suite in ``tests/`` is only worth anything if CI actually runs it. These
tests fail if the job that runs pytest is removed, renamed away, or quietly
stops installing what it needs — the failure modes that would otherwise turn
this whole directory into decoration.
"""

from pathlib import Path

import pytest
import yaml

WORKFLOW = Path(__file__).resolve().parents[1] / ".github" / "workflows" / "ci.yml"
PYTHON_JOB = "python-tests"


@pytest.fixture(scope="module")
def workflow() -> dict:
    if not WORKFLOW.exists():
        pytest.fail(f"CI workflow is missing: {WORKFLOW}")
    return yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))


def test_python_job_exists(workflow):
    jobs = workflow.get("jobs") or {}
    assert PYTHON_JOB in jobs, (
        f"no '{PYTHON_JOB}' job in ci.yml, so tests/ is never run by CI. "
        f"jobs present: {sorted(jobs)}"
    )


def test_python_job_is_independent_of_the_dashboard_job(workflow):
    """A Node build failure must not stop the Python tests from running.

    If ``python-tests`` gains a ``needs:`` on the dashboard job, a red
    dashboard would skip the Python suite and the missing signal would look
    like an unrelated failure.
    """
    job = workflow["jobs"][PYTHON_JOB]
    assert "needs" not in job, (
        f"'{PYTHON_JOB}' must not depend on another job; found needs: "
        f"{job.get('needs')!r}"
    )


def test_python_job_runs_pytest(workflow):
    steps = workflow["jobs"][PYTHON_JOB].get("steps") or []
    commands = " ".join(step.get("run", "") for step in steps)
    assert "pytest" in commands, (
        f"'{PYTHON_JOB}' never invokes pytest; its run steps are: {commands!r}"
    )


def test_python_job_installs_test_dependencies(workflow):
    """Pin the install step to requirements-dev.txt.

    ``tests/`` imports PyYAML as well as pytest. A job that installs only
    pytest fails at collection, which reads as a broken suite rather than a
    broken job.
    """
    steps = workflow["jobs"][PYTHON_JOB].get("steps") or []
    commands = " ".join(step.get("run", "") for step in steps)
    assert "requirements-dev.txt" in commands, (
        f"'{PYTHON_JOB}' does not install requirements-dev.txt; its run steps "
        f"are: {commands!r}"
    )


def test_python_job_triggers_on_pull_requests():
    """``on:`` is parsed from the raw text, not the loaded document.

    YAML 1.1 resolves the bare key ``on`` to the boolean ``True``, so the
    loaded mapping has no ``"on"`` key at all. Asserting against the loaded
    document here would pass whatever the file said.
    """
    text = WORKFLOW.read_text(encoding="utf-8")
    head = text.split("jobs:", 1)[0]
    assert "pull_request:" in head, (
        "ci.yml does not run on pull_request, so the suite would only be "
        "checked after merge"
    )
