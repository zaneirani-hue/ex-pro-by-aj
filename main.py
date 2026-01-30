# main.py - updated: env-config, PIN hashing, configurable CORS
import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from passlib.hash import bcrypt
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EX PRO Neural Backend")

# Configurable paths and CORS
DB_PATH = os.getenv("DB_PATH", "cloud_vault.json")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")] if os.getenv("ALLOWED_ORIGINS") else ["*"]

# Enable CORS for frontend communication (restrictable via ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_db():
    if not os.path.exists(DB_PATH):
        return {"users": [], "inventories": {}}
    with open(DB_PATH, "r") as f:
        return json.load(f)

def save_db(data):
    os.makedirs(os.path.dirname(DB_PATH) or '.', exist_ok=True)
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=4)

class UserAuth(BaseModel):
    identifier: str
    pin: str

class ProductItem(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    expiryDate: Optional[str] = None
    addedDate: str
    description: str
    quantity: int

@app.post("/api/auth")
async def authenticate(auth: UserAuth):
    db = load_db()
    user = next((u for u in db["users"] if u["identifier"] == auth.identifier), None)

    if user:
        # verify hashed pin
        if bcrypt.verify(auth.pin, user["pin"]):
            return {k: v for k, v in user.items() if k != "pin"}
        raise HTTPException(status_code=401, detail="INVALID NEURAL PIN")

    # Register new user with hashed pin
    hashed = bcrypt.hash(auth.pin)
    new_user = {
        "id": f"USR_{os.urandom(4).hex()}",
        "identifier": auth.identifier,
        "name": auth.identifier.split('@')[0],
        "pin": hashed
    }
    db["users"].append(new_user)
    db["inventories"][new_user["id"]] = []
    save_db(db)
    return {k: v for k, v in new_user.items() if k != "pin"}

@app.get("/api/inventory/{user_id}")
async def get_inventory(user_id: str):
    db = load_db()
    return db["inventories"].get(user_id, [])

@app.post("/api/inventory/{user_id}")
async def update_inventory(user_id: str, items: List[ProductItem]):
    db = load_db()
    db["inventories"][user_id] = [item.dict() for item in items]
    save_db(db)
    return {"status": "SYNC_COMPLETE"}

# Optional: serve built frontend from 'dist' if present
if os.getenv("SERVE_FRONTEND_FROM_BACKEND", "false").lower() in ("1", "true", "yes"):
    if os.path.isdir("dist"):
        app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))