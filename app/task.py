import json
import os
from litellm import completion
from tqdm import tqdm
from typing import Optional, Union

from app.helpers import HELPERS
from app.utils import stringify_prompt
from app.structs import Answerer, RankingTask, RankingTaskSpec
from app.task_storage import TaskStorage, TaskStorageConfig

class Tasks:
    def __init__(self, storage: Optional[TaskStorage] = None):
        self.storage = storage or TaskStorage()

    def create_ranking_tasks(self, task_spec: RankingTaskSpec, show_progress: bool = False) -> list[RankingTask]:
        """Create ranking tasks from a task specification"""
        tasks = []
        prompt_iterator = tqdm(task_spec.prompts, desc="Processing prompts", disable=not show_progress)
        for prompt in prompt_iterator:
            answers = []
            answerer_iterator = tqdm(task_spec.answerers, desc="Processing answerers", leave=False, disable=not show_progress)
            for answerer in answerer_iterator:
                api_response = completion(model=answerer.model, messages=prompt, **answerer.kwargs)
                answer = api_response["choices"][0]["message"]["content"] # type: ignore
                answers.append(answer)
            tasks.append(RankingTask(prompt=stringify_prompt(prompt), answers=answers, criteria=task_spec.criteria))
        return tasks

    def run_ranking_task(self, spec_name: str, show_progress: bool = False):
        """Run a ranking task from a task specification"""
        task_specs = self.storage.read_spec(spec_name)
        
        for task_spec_dict in task_specs:
            if 'answerers' in task_spec_dict:
                task_spec_dict['answerers'] = [Answerer(**answerer) for answerer in task_spec_dict['answerers']]
            task_spec = RankingTaskSpec(**task_spec_dict)
            tasks = self.create_ranking_tasks(task_spec, show_progress=show_progress)
            self.storage.write_task(task_spec.task_name, tasks)

    def run_helper(self, task_name: str, helper_name: str, task_idx: Union[int, list[int], None] = 0):
        """Run a helper on specified tasks"""
        tasks = self.storage.read_task(task_name)
        tasks = [RankingTask.from_dict(t) for t in tasks]
        
        if isinstance(task_idx, int):
            # run on a single task
            tasks = [tasks[task_idx]]
        elif isinstance(task_idx, list):
            # run on specific tasks
            tasks = [tasks[i] for i in task_idx]
        elif task_idx is None:
            # run on all tasks
            pass
        
        if helper_name not in HELPERS:
            raise ValueError(f"Invalid helper name: {helper_name}")
        helper = HELPERS[helper_name]
        for t in tasks:
            t.helpers[helper_name] = helper(t)
        self.storage.write_task(task_name, tasks)

    def delete_helper_from_task(self, task_name: str, helper_name: str) -> None:
        """Delete a helper from all tasks' helpers dictionaries."""
        tasks = self.storage.read_task(task_name)
        # Tasks is a list of dictionaries, each with a 'helpers' key
        for task in tasks:
            if 'helpers' in task and helper_name in task['helpers']:
                del task['helpers'][helper_name]
        self.storage.write_task(task_name, tasks)

    def get_task(self, task_name: str) -> dict:
        """Load and return a task from the filesystem."""
        return self.storage.read_task(task_name)

if __name__ == "__main__":
    processor = Tasks()
    processor.run_ranking_task("tasks", show_progress=True)
