from litellm import completion

from app.utils import extract_criterion_short_name, get_completion

DEFAULT_MODEL = "claude-3-5-sonnet-20240620"


def summarize(text: str) -> str:
    prompt = f"Summarize the following text in a pithy, concrete, tweet-length response:\n\n{text}"
    return get_completion(
        model=DEFAULT_MODEL,
        prompt=prompt,
    )

def comparison_points(text_a: str, text_b: str) -> list[dict[str, str]]:
    """Output format:
    [{
        "feature": feature_description,
        "a": text_a_value,
        "b": text_b_value
    }, ...]
    """
    prompt = f"""
You will be given two texts and asked to list the most important differences between them: For each difference, you should say what axis / feature it is along, what property that axis / feature has in text A, and what property it has in text B. You should output in the following format:

FEATURE: [short feature description.]
A: [property of feature in text A]
B: [property of feature in text B]

For example:

FEATURE: verbosity
A: high, with lots of long sentences
B: medium, with short sentences but repeated content

FEATURE: type of structure
A: clear headings but only a small number of headings; good order
B: no headings, but implicit essay-style structure

Prioritise the FEATUREs along which the texts are most different, whether they're about style or content or something else. Imagine you had to quickly convey the main axes of difference between the texts to an articulate and intelligent person who wanted a quick, glanceable summary in order to compare them to each other effectively.

Text A:
{text_a}

Text B:
{text_b}

Your list of differences in the above format:
""".strip()

    string_response = get_completion(
        model=DEFAULT_MODEL,
        prompt=prompt,
    )

    response = []
    
    # find all lines that start with "FEATURE: ", and where the next line startsd with "A: " and the one after that with "B: "
    lines = string_response.split("\n")
    for i in range(len(lines) - 2):
        if lines[i].startswith("FEATURE: ") and lines[i+1].startswith("A: ") and lines[i+2].startswith("B: "):
            feature = lines[i][len("FEATURE: "):].strip()
            a = lines[i+1][len("A: "):].strip()
            b = lines[i+2][len("B: "):].strip()
            response.append({"feature": feature, "a": a, "b": b})
    return response
    

def criteria_quotes(prompt: str, criterion: str, text_a: str, text_b: str) -> dict[str, list[dict[str, str]]]:
    """Output format:
    {
        "Text A": [{"quote": quote_text, "comment": comment_text}, ...],
        "Text B": [{"quote": quote_text, "comment": comment_text}, ...],
    }
    
    Note that this further gets wrapped in a list like
    [{"criterion 1": {
        "Text A": [{"quote": quote_text, "comment": comment_text}, ...],
        "Text B": [{"quote": quote_text, "comment": comment_text}, ...],
    }}, ...]
    when this function is used below for multiple criteria at once.
    """
    response = {}
    for idx, text in enumerate(['A', 'B']):
        prompt = f"""
Here is a question that was posed:
"{prompt}"

The judgement criterion is:
"{criterion}"

You will now read an answer to the question above.
START ANSWER
"{text_a if idx == 0 else text_b}"
END ANSWER

Are there any particular quotes from the above answer that are especially relevant to judging the above criterion?

If so, please list them here, one per line.

You should list in the format below:

QUOTE: "The verbatim text of the quote in quotations"
COMMENT: "An optional comment about the relevance of the quote, if it's not obvious"

QUOTE: "Another quote, this time that doesn't need a comment"

Your list:
        """.strip()
        raw_string = get_completion(
            model=DEFAULT_MODEL,
            prompt=prompt,
        )
        quotes = []
        lines = raw_string.split("\n")
        num_lines = len(lines)
        for i in range(num_lines):
            if lines[i].startswith("QUOTE: "):
                quotes.append({"quote": lines[i][len("QUOTE: "):].strip(), "comment": None})
            elif lines[i].startswith("COMMENT: ") and len(quotes) > 0:
                quotes[-1]["comment"] = lines[i][len("COMMENT: "):].strip()
        response[f'Text {text}'] = quotes
    return response

HELPERS = {
    "summarize": lambda ranking_task: {"A": summarize(ranking_task.answers[0]), "B": summarize(ranking_task.answers[1])},
    "compare": lambda ranking_task: comparison_points(ranking_task.answers[0], ranking_task.answers[1]),
    "criteria_quotes": lambda ranking_task: {extract_criterion_short_name(criterion): criteria_quotes(ranking_task.prompt, criterion, ranking_task.answers[0], ranking_task.answers[1]) for criterion in ranking_task.criteria},
    "debate": lambda ranking_task: "TODO"
}

HELPER_TABS = {
    "Summary": ["summarize", "compare"],
    "Criteria": ["criteria_quotes"],
    "Debate": ["debate"],
}
