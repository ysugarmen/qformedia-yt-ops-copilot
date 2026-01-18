import json
from openai import OpenAI

from app.schemas import LlmSuggestRequest, LlmSuggestResponse


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

    if task == "pinned_comment":
        return {
            "type": "object",
            "properties": {
                "pinned_comment": {"type": "string"},
                **base_notes,
            },
            "required": ["pinned_comment", "notes"],  # <-- include notes
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

    prompt = f"""
    You are a YouTube operations assistant.
    Task: {req.task}, Video title: {req.video.title}, Video description: {req.video.description},
    Video tags: {", ".join(req.video.tags)}, Style profile: {req.styleProfile or "default concise, clear, brand-safe"}
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
    return LlmSuggestResponse.model_validate(data)

