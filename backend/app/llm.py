import json
from openai import OpenAI

from app.schemas import LlmSuggestRequest, LlmSuggestResponse


def _parse_ts_to_seconds(ts: str) -> int | None:
    """
    Accepts 'MM:SS' or 'HH:MM:SS'. Returns seconds or None if invalid.
    """
    try:
        parts = [int(p) for p in ts.strip().split(":")]
        if len(parts) == 2:
            mm, ss = parts
            if mm < 0 or ss < 0 or ss >= 60:
                return None
            return mm * 60 + ss
        if len(parts) == 3:
            hh, mm, ss = parts
            if hh < 0 or mm < 0 or ss < 0 or mm >= 60 or ss >= 60:
                return None
            return hh * 3600 + mm * 60 + ss
        return None
    except Exception:
        return None



def _schema_for_task(task: str) -> dict:
    base_notes = {
        "notes": {"type": "array", "items": {"type": "string"}}
    }

    if task == "chapters":
        return {
            "type": "object",
            "properties": {
                "chapters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "time": {"type": "string"},
                            "title": {"type": "string"},
                        },
                        "required": ["time", "title"],
                        "additionalProperties": False,
                    },
                },
                **base_notes,
            },
            "required": ["chapters", "notes"],  # <-- include notes
            "additionalProperties": False,
        }

    # rewrite_description
    return {
        "type": "object",
        "properties": {
            "description": {"type": "string"},
            **base_notes,
        },
        "required": ["description", "notes"],  # <-- include notes
        "additionalProperties": False,
    }



def suggest(client: OpenAI, model: str, req: LlmSuggestRequest) -> LlmSuggestResponse:
    schema = _schema_for_task(req.task)
    dur = req.video.durationSeconds

    
    prompt = f"""
    You are a YouTube operations assistant.

    Task: {req.task}
    Video title: {req.video.title}
    Video description: {req.video.description}
    Video tags: {", ".join(req.video.tags)}
    Video duration seconds: {dur if dur is not None else "unknown"}
    Style profile: {req.styleProfile or "default concise, clear, brand-safe"}

    If task is "chapters":
    - Use timestamps that fit within the video duration.
    - Do NOT output any timestamp greater than the duration.
    - For very short videos (< 60s), output 1-3 chapters max.
    - The first chapter should start at 00:00.

    Return ONLY valid JSON that matches the provided schema.
    """.strip()

    resp = client.responses.create(
        model=model,
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "yt_ops_suggest",
                "strict": True,
                "schema": schema,
            }
        },
    )

    data = json.loads(resp.output_text)
    out = LlmSuggestResponse.model_validate(data)

    # server-side safety check
    if req.task == "chapters" and out.chapters and dur is not None:
        kept = []
        dropped = 0

        for ch in out.chapters:
            sec = _parse_ts_to_seconds(ch.time)
            if sec is None or sec < 0 or sec > dur:
                dropped += 1
                continue
            kept.append(ch)
        
        # Sort + de-dup by time
        kept.sort(key=lambda c: _parse_ts_to_seconds(c.time) or 0)
        dedup = []
        seen = set()
        for ch in kept:
            s = _parse_ts_to_seconds(ch.time) or 0
            if s in seen:
                continue
            seen.add(s)
            dedup.append(ch)
        
        # Short-video cap (assignment-friendly)
        if dur < 60 and len(dedup) > 3:
            dedup = dedup[:3]
            out.notes.append("Trimmed chapters to max 3 because duration < 60s.")

        if dropped:
            out.notes.append(f"Removed {dropped} chapter(s) outside duration (>{dur}s) or invalid timestamps.")
        
        out.chapters = dedup
    
    return out
