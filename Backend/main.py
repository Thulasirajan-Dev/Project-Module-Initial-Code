from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIREBASE_URL = "https://whc-projects-update-default-rtdb.firebaseio.com"

@app.get("/")
def home():
    return {"message": "Backend Running"}

# GET ALL PROJECTS
@app.get("/projects")
def get_projects():
    response = requests.get(
        f"{FIREBASE_URL}/projects.json",
        timeout=10
    )
    return response.json()

# GET SINGLE PROJECT
@app.get("/projects/{project_id}")
def get_project(project_id: str):
    response = requests.get(
        f"{FIREBASE_URL}/projects/{project_id}.json",
        timeout=10
    )
    return response.json()

# CREATE / UPDATE PROJECT
@app.put("/projects/{project_id}")
def save_project(project_id: str, data: dict):
    response = requests.put(
        f"{FIREBASE_URL}/projects/{project_id}.json",
        json=data,
        timeout=10
    )
    return response.json()

# DELETE PROJECT
@app.delete("/projects/{project_id}")
def delete_project(project_id: str):
    response = requests.delete(
        f"{FIREBASE_URL}/projects/{project_id}.json",
        timeout=10
    )
    return {"success": response.status_code == 200}