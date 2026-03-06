#!/usr/bin/env python3
"""Grade all eval outputs for prompt-engineer skill."""
import json
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

def read_file(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return ""

def check_task_statement(text):
    return bool(re.search(r"I want to .+ so that .+", text, re.IGNORECASE))

def check_english(text):
    italian_words = ["voglio", "creare", "questo", "della", "delle", "perché", "quindi"]
    lower = text.lower()
    count = sum(1 for w in italian_words if w in lower)
    return count < 2

def check_brief(text):
    fields = ["type of output", "recipient", "does not sound", "success means"]
    lower = text.lower()
    return sum(1 for f in fields if f in lower) >= 3

def check_conversation(text):
    lower = text.lower()
    has_clarify = "clarifying questions" in lower or "ask me" in lower
    has_plan = "execution plan" in lower or "5 steps" in lower
    return has_clarify and has_plan

def check_context_ref(text):
    lower = text.lower()
    return "read these files" in lower or "context.md" in lower or "context file" in lower

def check_reference_rules(text):
    return text.count("Always") >= 2 or text.count("Never") >= 2

def check_no_role(text):
    lower = text.lower()
    return "act as" not in lower and "you are a" not in lower

def check_rules_guardrail(text):
    lower = text.lower()
    return "read it fully" in lower or ("break" in lower and "rule" in lower) or "about to break" in lower

def check_no_context(text):
    lower = text.lower()
    return "context.md" not in lower and "read these files" not in lower

def check_no_reference(text):
    lower = text.lower()
    return "reference" not in lower or "here is a reference" not in lower

def grade_run(prompt_text, assertions, context_exists=False):
    results = []
    checks = {
        "has_task_statement": check_task_statement,
        "english_output": check_english,
        "has_brief_section": check_brief,
        "has_conversation_section": check_conversation,
        "has_context_reference": check_context_ref,
        "has_reference_rules": check_reference_rules,
        "no_role_assignment": check_no_role,
        "has_rules_guardrail": check_rules_guardrail,
        "no_context_files": check_no_context,
        "no_reference_section": check_no_reference,
    }
    for a in assertions:
        aid = a["id"]
        if aid == "context_file_created":
            passed = context_exists
            evidence = "context.md exists" if passed else "context.md not found"
        elif aid in checks:
            passed = checks[aid](prompt_text)
            evidence = f"Check '{aid}' {'passed' if passed else 'failed'}"
        else:
            passed = False
            evidence = f"Unknown assertion: {aid}"
        results.append({"text": a["text"], "passed": passed, "evidence": evidence})
    return results

evals = [
    ("eval-1-full-mode", ["with_skill", "without_skill"]),
    ("eval-2-quick-mode", ["with_skill", "without_skill"]),
    ("eval-3-context-creation", ["with_skill", "without_skill"]),
]

for eval_dir, variants in evals:
    meta_path = os.path.join(BASE, eval_dir, "eval_metadata.json")
    with open(meta_path) as f:
        meta = json.load(f)

    for variant in variants:
        prompt_path = os.path.join(BASE, eval_dir, variant, "outputs", "prompt.md")
        prompt_text = read_file(prompt_path)

        context_path = os.path.join(BASE, eval_dir, variant, "outputs", "context.md")
        context_exists = os.path.exists(context_path)

        grading = {
            "eval_id": meta["eval_id"],
            "eval_name": meta["eval_name"],
            "variant": variant,
            "expectations": grade_run(prompt_text, meta["assertions"], context_exists),
            "pass_rate": 0
        }
        passed = sum(1 for e in grading["expectations"] if e["passed"])
        total = len(grading["expectations"])
        grading["pass_rate"] = passed / total if total > 0 else 0

        out_path = os.path.join(BASE, eval_dir, variant, "grading.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(grading, f, indent=2)

        print(f"{eval_dir}/{variant}: {passed}/{total} ({grading['pass_rate']:.0%})")
