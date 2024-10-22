from pathlib import Path
from typing import Optional, Union
import json
from dataclasses import dataclass

@dataclass
class TaskStorageConfig:
    """Configuration for task storage locations"""
    tasks_dir: Path = Path("data/tasks")
    specs_dir: Path = Path("data/specs")

    def __post_init__(self):
        """Ensure directories exist"""
        self.tasks_dir.mkdir(parents=True, exist_ok=True)
        self.specs_dir.mkdir(parents=True, exist_ok=True)

class TaskStorage:
    """Handles all task-related file operations"""
    def __init__(self, config: Optional[TaskStorageConfig] = None):
        self.config = config or TaskStorageConfig()

    def _ensure_json_extension(self, filename: str) -> str:
        return filename if filename.endswith('.json') else f"{filename}.json"

    def get_task_path(self, task_name: str) -> Path:
        return self.config.tasks_dir / self._ensure_json_extension(task_name)

    def get_spec_path(self, spec_name: str) -> Path:
        return self.config.specs_dir / self._ensure_json_extension(spec_name)

    def read_task(self, task_name: str) -> dict:
        """Read a task file by name"""
        path = self.get_task_path(task_name)
        try:
            with path.open('r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Task file not found: {path}")

    def write_task(self, task_name: str, data: Union[dict, list]) -> None:
        """Write a task file"""
        path = self.get_task_path(task_name)
        with path.open('w') as f:
            json.dump(data, f, default=lambda o: o.__dict__, indent=2)

    def read_spec(self, spec_name: str) -> list[dict]:
        """Read a task specification file"""
        path = self.get_spec_path(spec_name)
        try:
            with path.open('r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Spec file not found: {path}")
