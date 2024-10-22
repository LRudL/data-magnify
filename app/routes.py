import json
import os
import traceback
from functools import wraps
from flask import render_template, jsonify, request, current_app

from app.task import Tasks
from app.helpers import HELPER_TABS, HELPERS
from app.task_storage import TaskStorage

def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            error_traceback = traceback.format_exc()
            current_app.logger.error(f"Error in {f.__name__}: {str(e)}\n{error_traceback}")
            return jsonify({
                "error": str(e),
                "traceback": error_traceback if current_app.debug else None
            }), 500
    return wrapper

def init_routes(app):
    storage = TaskStorage()
    task_processor = Tasks(storage)
    
    @app.route("/")
    @handle_errors
    def index():
        # Use render_template to serve your HTML file with events data
        return render_template("index.html")
    
    @app.route("/task_names")
    @handle_errors
    def task_names():
        return jsonify([p.stem for p in storage.config.tasks_dir.glob("*.json")])
    
    @app.route("/task/<task_name>")
    @handle_errors
    def task(task_name):
        return jsonify(storage.read_task(task_name))
    
    @app.route("/run_helper/<task_name>/<helper_name>")
    @handle_errors
    def run_helper(task_name, helper_name):
        task_processor.run_helper(task_name, helper_name)
        return jsonify(storage.read_task(task_name))

    @app.route("/helper_names")
    @handle_errors
    def helper_names():
        return jsonify(list(HELPERS.keys()))

    @app.route("/delete_helper_for_task/<task_name>/<helper_name>")
    @handle_errors
    def delete_helper_for_task(task_name, helper_name):
        try:
            task_processor.delete_helper_from_task(task_name, helper_name)
            return jsonify({"message": f"Helper {helper_name} deleted successfully from task {task_name}"}), 200
        except Exception as e:
            # Get the full traceback
            error_traceback = traceback.format_exc()
            # Log the error
            current_app.logger.error(f"Error deleting helper: {str(e)}\n{error_traceback}")
            # Return detailed error in development
            return jsonify({
                "error": str(e),
                "traceback": error_traceback
            }), 500
    
    
    
