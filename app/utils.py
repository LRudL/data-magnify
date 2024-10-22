
from litellm import completion


def stringify_prompt(prompt: list[dict]) -> str:
    if len(prompt) == 1:
        return prompt[0]["content"]
    else:
        assert False, "multi-message prompts not supported"

def get_completion(
    model: str,
    prompt: str,
    **kwargs
) -> str:
    """
    Wraps common LiteLLM operations into a single function:
    1. Wraps prompt in a Message object
    2. Makes the completion call
    3. Safely extracts and type-checks the response content
    
    Args:
        prompt: The text prompt to send
        model: The model identifier
        **kwargs: Additional arguments to pass to litellm.completion
    
    Returns:
        The response text, or None if extraction fails
    """
    messages = [{"role": "user", "content": prompt}]
    
    response = completion(
        model=model,
        messages=messages,
        **kwargs
    )
    
    # Safely extract content with type checking
    content = response['choices'][0]['message']['content'] # type: ignore
    if content is None:
        raise ValueError("No model response")
    return content

def extract_criterion_short_name(criterion: str) -> str:
    """Finds the thing enclosed in **-marks"""
    return criterion.split("**")[1].split("**")[0].strip()
