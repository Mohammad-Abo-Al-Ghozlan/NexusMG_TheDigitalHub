import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.main import app

from fastapi.routing import APIRoute, Mount

def print_routes(routes, prefix=""):
    for route in routes:
        if isinstance(route, APIRoute):
            print(f"{route.methods} {prefix}{route.path}")
        elif isinstance(route, Mount):
            print_routes(route.app.routes, prefix=prefix + route.path)
        elif hasattr(route, "routes"):
            print_routes(route.routes, prefix=prefix + getattr(route, "path", ""))

print_routes(app.routes)
