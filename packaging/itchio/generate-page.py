#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path


def render_markdown(config: dict) -> str:
    lines: list[str] = [
        f"# {config['title']}",
        "",
        config["short_description"],
        "",
    ]

    for section in config["body_sections"]:
        lines.append(f"## {section['heading']}")
        lines.append("")
        for paragraph in section.get("paragraphs", []):
            lines.append(paragraph)
            lines.append("")
        bullets = section.get("bullets", [])
        if bullets:
            lines.extend(f"- {item}" for item in bullets)
            lines.append("")

    lines.append("## Upload channels")
    lines.append("")
    for channel in config["channels"]:
        lines.append(
            f"- `{channel['name']}` (`{channel['platform']}`): {channel['recommended_launch']}"
        )
    lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def render_checklist(config: dict) -> str:
    lines = [
        f"Page URL: {config['url']}",
        f"Title: {config['title']}",
        f"Classification: {config['classification']}",
        f"Kind: {config['kind']}",
        f"Short description: {config['short_description']}",
        f"Tags: {', '.join(config['tags'])}",
        "",
        "Browser checklist:",
    ]
    lines.extend(f"- {item}" for item in config["browser_checklist"])
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    config = json.loads((script_dir / "page-config.json").read_text())
    out_dir = script_dir / "out"
    out_dir.mkdir(parents=True, exist_ok=True)

    markdown_path = out_dir / "page-draft.md"
    metadata_path = out_dir / "page-metadata.json"
    checklist_path = out_dir / "page-checklist.txt"

    markdown_path.write_text(render_markdown(config))
    metadata_path.write_text(json.dumps(config, indent=2) + "\n")
    checklist_path.write_text(render_checklist(config))

    print(f"Wrote {markdown_path}")
    print(f"Wrote {metadata_path}")
    print(f"Wrote {checklist_path}")


if __name__ == "__main__":
    main()
