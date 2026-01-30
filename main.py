
import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="EX PRO Neural Backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Database Path
DB_PATH = "cloud_vault.json"

def load_db():
    if not os.path.exists(DB_PATH):
        return {"users": [], "inventories": {}}
    with open(DB_PATH, "r") as f:
        return json.load(f)

def save_db(data):
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
    # Find existing user
    user = next((u for u in db["users"] if u["identifier"] == auth.identifier), None)
    
    if user:
        if user["pin"] == auth.pin:
            return user
        raise HTTPException(status_code=401, detail="INVALID NEURAL PIN")
    
    # Register new user
    new_user = {
        "id": f"USR_{os.urandom(4).hex()}",
        "identifier": auth.identifier,
        "name": auth.identifier.split('@')[0],
        "pin": auth.pin
    }
    db["users"].append(new_user)
    db["inventories"][new_user["id"]] = []
    save_db(db)
    return new_user

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

# Serve the frontend (assuming it's built in 'dist')
# app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
