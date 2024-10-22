from flask import Flask
import json


def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.secret_key = "Your_secret_key_here"

    from .routes import init_routes

    init_routes(app)

    return app
