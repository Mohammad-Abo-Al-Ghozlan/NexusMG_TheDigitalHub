"""Stress test script for API load and AI concurrency."""
import asyncio
import os
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
CONCURRENT_USERS = int(os.getenv("CONCURRENT_USERS", "50"))
AI_EVALS = int(os.getenv("AI_EVALS", "10"))
REQUESTS_PER_USER = int(os.getenv("REQUESTS_PER_USER", "3"))
AUTH_TOKEN = os.getenv("AUTH_TOKEN")
TEST_EMAIL = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")
HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "30"))

AI_PAYLOAD = {
    "title": "Load Test Idea",
    "description": "Stress test payload for concurrent evaluation.",
    "problem_statement": "Validate system under load.",
    "target_audience": "QA",
    "tech_stack": ["FastAPI", "SQLAlchemy", "Redis"]
}


@dataclass
class Metrics:
    latencies_ms: List[float] = field(default_factory=list)
    status_counts: Dict[int, int] = field(default_factory=dict)
    errors: int = 0

    def record(self, duration_ms: float, status_code: Optional[int]) -> None:
        self.latencies_ms.append(duration_ms)
        if status_code is None:
            self.errors += 1
            return
        self.status_counts[status_code] = self.status_counts.get(status_code, 0) + 1
        if status_code >= 400:
            self.errors += 1


def percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    values_sorted = sorted(values)
    k = int((len(values_sorted) - 1) * pct)
    return values_sorted[k]


async def get_token(client: httpx.AsyncClient) -> str:
    if AUTH_TOKEN:
        return AUTH_TOKEN
    if not TEST_EMAIL or not TEST_PASSWORD:
        raise RuntimeError("Set AUTH_TOKEN or TEST_EMAIL/TEST_PASSWORD")
    resp = await client.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


async def timed_request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    metrics: Metrics,
    headers: Optional[Dict[str, str]] = None,
    json_body: Optional[Dict] = None
) -> None:
    start = time.perf_counter()
    status_code = None
    try:
        resp = await client.request(method, url, headers=headers, json=json_body)
        status_code = resp.status_code
    except Exception:
        pass
    duration_ms = (time.perf_counter() - start) * 1000.0
    metrics.record(duration_ms, status_code)


async def user_flow(client: httpx.AsyncClient, headers: Dict[str, str], metrics: Metrics) -> None:
    for _ in range(REQUESTS_PER_USER):
        await timed_request(client, "GET", f"{BASE_URL}/health", metrics)
        await timed_request(client, "GET", f"{BASE_URL}/api/v1/users/me", metrics, headers=headers)
        await timed_request(client, "GET", f"{BASE_URL}/api/v1/users/me/readiness", metrics, headers=headers)


async def ai_flow(client: httpx.AsyncClient, headers: Dict[str, str], metrics: Metrics) -> None:
    await timed_request(
        client,
        "POST",
        f"{BASE_URL}/api/v1/evaluations/idea/analyze",
        metrics,
        headers=headers,
        json_body=AI_PAYLOAD
    )


async def main() -> None:
    limits = httpx.Limits(max_connections=200, max_keepalive_connections=50)
    timeout = httpx.Timeout(HTTP_TIMEOUT)
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        metrics = Metrics()

        user_tasks = [user_flow(client, headers, metrics) for _ in range(CONCURRENT_USERS)]
        ai_tasks = [ai_flow(client, headers, metrics) for _ in range(AI_EVALS)]

        await asyncio.gather(*(user_tasks + ai_tasks))

        total_requests = len(metrics.latencies_ms)
        p50 = percentile(metrics.latencies_ms, 0.50)
        p95 = percentile(metrics.latencies_ms, 0.95)
        avg = sum(metrics.latencies_ms) / max(1, total_requests)
        error_rate = (metrics.errors / max(1, total_requests)) * 100.0

        print("Stress test complete")
        print(f"Total requests: {total_requests}")
        print(f"Errors: {metrics.errors} ({error_rate:.2f}%)")
        print(f"Avg latency: {avg:.2f} ms")
        print(f"P50 latency: {p50:.2f} ms")
        print(f"P95 latency: {p95:.2f} ms")
        print(f"Status counts: {metrics.status_counts}")

        if error_rate > 1.0 or p95 > 2000.0:
            print("DEGRADED: Async layer may not be correctly implemented.")
        else:
            print("OK: Load handling within expected thresholds.")


if __name__ == "__main__":
    asyncio.run(main())
