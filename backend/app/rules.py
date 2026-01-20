
RULES = [
    {
        "id": "title_length",
        "severity": "warn",
        "description": "Title should be <= 70 characters",
    },
    {
        "id": "required_sections",
        "severity": "warn",
        "description": "Description should contain required sections (Links/Credits/Disclaimer)",
    },
    {
        "id": "hashtag_limit",
        "severity": "warn",
        "description": "Max 3 hashtags in description",
    },
    {
        "id": "chapters_start",
        "severity": "warn",
        "description": "If timestamps exist, first chapter should start at 00:00",
    },
    {
        "id": "forbidden_words",
        "severity": "warn",
        "description": "Description/title should not include forbidden words (configurable)",
    },
]
