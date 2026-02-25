#!/usr/bin/env python3
"""Generate and store restaurant semantic embeddings in Supabase.

Usage:
  python3 scripts/generate_embeddings.py
  python3 scripts/generate_embeddings.py --force
  python3 scripts/generate_embeddings.py --limit 20
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen


OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
OPENAI_EMBEDDING_DIMENSIONS = 1536
SUPABASE_PAGE_SIZE = 500


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def http_json(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
) -> Any:
    payload = None
    request_headers = dict(headers or {})
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")

    request = Request(url=url, method=method, headers=request_headers, data=payload)
    with urlopen(request, timeout=60) as response:
        content = response.read()
        if not content:
            return None
        return json.loads(content.decode("utf-8"))


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" .\n\t")


def value_or_values_to_text(value: Any) -> str:
    if isinstance(value, str):
        return normalize_text(value)
    if isinstance(value, dict):
        parts: list[str] = []
        for nested in value.values():
            clean = normalize_text(nested)
            if clean:
                parts.append(clean)
        return ". ".join(parts)
    return ""


def build_search_text(restaurant: dict[str, Any]) -> str:
    parts: list[str] = []

    for field in ("cuisine", "english_description", "foreigner_hook"):
        clean = normalize_text(restaurant.get(field))
        if clean:
            parts.append(clean)

    vibe_text = value_or_values_to_text(
        restaurant.get("vibe_and_atmosphere") or restaurant.get("vibe")
    )
    if vibe_text:
        parts.append(vibe_text)

    signature_dishes = restaurant.get("signature_dishes")
    if isinstance(signature_dishes, list):
        dish_parts: list[str] = []
        for dish in signature_dishes:
            if not isinstance(dish, dict):
                continue
            dish_name = normalize_text(dish.get("english_name"))
            dish_notes = normalize_text(dish.get("notes"))
            if dish_name and dish_notes:
                dish_parts.append(f"{dish_name}. {dish_notes}")
            elif dish_name:
                dish_parts.append(dish_name)
            elif dish_notes:
                dish_parts.append(dish_notes)
        if dish_parts:
            parts.append(". ".join(dish_parts))

    spice_notes = restaurant.get("spice_and_dietary_notes")
    if isinstance(spice_notes, dict):
        for key in (
            "overall_spice_level",
            "spice_details",
            "vegetarian_notes",
            "protein_notes",
            "sweetness_warning",
        ):
            clean = normalize_text(spice_notes.get(key))
            if clean:
                parts.append(clean)

    best_for = restaurant.get("best_for")
    if isinstance(best_for, list):
        tags = [normalize_text(tag) for tag in best_for if normalize_text(tag)]
        if tags:
            parts.append(", ".join(tags))

    for field in ("dining_style_note", "value_for_money", "category"):
        clean = normalize_text(restaurant.get(field))
        if clean:
            parts.append(clean)

    search_text = ". ".join(part.strip(" .") for part in parts if part).strip()
    return re.sub(r"\s+", " ", search_text)


def to_vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.10f}" for value in values) + "]"


def embed_text(openai_api_key: str, text: str) -> list[float]:
    response = http_json(
        "https://api.openai.com/v1/embeddings",
        method="POST",
        headers={
            "Authorization": f"Bearer {openai_api_key}",
        },
        body={
            "model": OPENAI_EMBEDDING_MODEL,
            "input": text,
        },
    )

    data = response.get("data") if isinstance(response, dict) else None
    if not data or not isinstance(data, list):
        raise RuntimeError(f"Invalid embeddings response: {response}")

    embedding = data[0].get("embedding")
    if not isinstance(embedding, list):
        raise RuntimeError(f"Embedding missing in response: {response}")
    if len(embedding) != OPENAI_EMBEDDING_DIMENSIONS:
        raise RuntimeError(
            f"Unexpected embedding size {len(embedding)} (expected {OPENAI_EMBEDDING_DIMENSIONS})"
        )
    return [float(value) for value in embedding]


def fetch_restaurants(supabase_url: str, service_role_key: str) -> list[dict[str, Any]]:
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Accept": "application/json",
    }

    all_rows: list[dict[str, Any]] = []
    start = 0
    while True:
        end = start + SUPABASE_PAGE_SIZE - 1
        page_headers = {**headers, "Range": f"{start}-{end}"}
        url = (
            f"{supabase_url}/rest/v1/restaurants"
            f"?select=*&order=id.asc"
        )
        page = http_json(url, headers=page_headers)
        if not page:
            break
        if not isinstance(page, list):
            raise RuntimeError(f"Unexpected Supabase response: {page}")
        all_rows.extend(page)
        if len(page) < SUPABASE_PAGE_SIZE:
            break
        start += SUPABASE_PAGE_SIZE

    return all_rows


def update_restaurant_embedding(
    supabase_url: str,
    service_role_key: str,
    *,
    restaurant_id: str,
    search_text: str,
    embedding: list[float],
) -> None:
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    url = f"{supabase_url}/rest/v1/restaurants?id=eq.{restaurant_id}"
    body = {
        "search_text": search_text,
        "embedding": to_vector_literal(embedding),
    }
    http_json(url, method="PATCH", headers=headers, body=body)


def has_existing_embedding(restaurant: dict[str, Any]) -> bool:
    value = restaurant.get("embedding")
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return len(value) > 0
    return True


def display_name(restaurant: dict[str, Any]) -> str:
    return (
        normalize_text(restaurant.get("name_en"))
        or normalize_text(restaurant.get("name_cn"))
        or normalize_text(restaurant.get("slug"))
        or normalize_text(restaurant.get("id"))
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate restaurant embeddings")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-embed restaurants even if embedding already exists",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process only first N restaurants (after filtering/skipping)",
    )
    return parser.parse_args()


def main() -> int:
    load_env_file(Path(".env.local"))
    load_env_file(Path(".env"))

    args = parse_args()

    try:
        supabase_url = require_env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
        service_role_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
        openai_api_key = require_env("OPENAI_API_KEY")
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    try:
        restaurants = fetch_restaurants(supabase_url, service_role_key)
    except Exception as error:  # noqa: BLE001
        print(f"Failed to fetch restaurants: {error}", file=sys.stderr)
        return 1

    skipped_existing = 0
    candidates: list[dict[str, Any]] = []
    for row in restaurants:
        if not args.force and has_existing_embedding(row):
            skipped_existing += 1
            continue
        candidates.append(row)

    if args.limit is not None:
        candidates = candidates[: args.limit]

    total = len(candidates)
    if total == 0:
        print(
            f"No restaurants to embed. Total rows: {len(restaurants)}, skipped existing: {skipped_existing}."
        )
        return 0

    success = 0
    failed = 0

    print(f"Starting embedding generation for {total} restaurants...")
    for index, restaurant in enumerate(candidates, start=1):
        name = display_name(restaurant)
        try:
            search_text = build_search_text(restaurant)
            if not search_text:
                raise RuntimeError("search_text is empty after field extraction")

            embedding = embed_text(openai_api_key, search_text)
            update_restaurant_embedding(
                supabase_url,
                service_role_key,
                restaurant_id=str(restaurant["id"]),
                search_text=search_text,
                embedding=embedding,
            )
            success += 1
            print(f"Embedded {index}/{total}: {name}")
        except Exception as error:  # noqa: BLE001
            failed += 1
            print(f"Failed {index}/{total}: {name} — {error}", file=sys.stderr)
            continue

    print("\nEmbedding job complete.")
    print(f"Fetched: {len(restaurants)}")
    print(f"Skipped existing embeddings: {skipped_existing}")
    print(f"Succeeded: {success}")
    print(f"Failed: {failed}")

    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
