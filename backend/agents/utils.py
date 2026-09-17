"""
agents/utils.py
Shared utilities for all agent modules.
"""

import json
import re


def parse_llm_json(content: str) -> dict:
    """
    Robustly parse JSON from an LLM response that may be wrapped in
    markdown code fences (```json ... ```) or contain leading/trailing text.

    Raises: json.JSONDecodeError if no valid JSON can be found.
    """
    from loguru import logger
    content = content.strip()

    # 1. Look for ```json ... ``` blocks explicitly
    import re
    json_block = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL | re.IGNORECASE)
    if json_block:
        extracted = json_block.group(1).strip()
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass  # Fall back to trying the whole string

    # 2. Try direct parse
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # 3. Extract the first {...} block found in the string
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            logger.error(f"JSON Parse Error. Raw content:\\n{content}")
            raise e

    # 4. Give up
    logger.error(f"JSON Parse Error (No JSON block found). Raw content:\\n{content}")
    raise json.JSONDecodeError("No valid JSON found in LLM response", content, 0)
