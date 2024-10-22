from dataclasses import dataclass, field

@dataclass
class Answerer:
    model: str
    kwargs: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

@dataclass
class RankingTaskSpec:
    task_name: str
    criteria: list[str]
    prompts: list[list[dict]]
    answerers: list[Answerer]

    @classmethod
    def from_dict(cls, data: dict):
        answerers = [Answerer.from_dict(a) for a in data.get('answerers', [])]
        return cls(
            task_name=data['task_name'],
            criteria=data['criteria'],
            prompts=data['prompts'],
            answerers=answerers
        )

@dataclass
class RankingTask:
    prompt: str
    answers: list[str]
    criteria: list[str]
    helpers: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)