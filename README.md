
# 🚀 EX PRO | NEURAL CLOUD PROJECT

Your Neural Inventory is now a full-stack Cloud Project. It uses a **Python (FastAPI)** core for data persistence and a **React/Vite** interface for AI vision.

## 🛠️ Components
1.  **Frontend**: React + Tailwind + Lucide + Gemini AI.
2.  **Backend**: FastAPI (Python) serving as the Neural Cloud Node.
3.  **Database**: `cloud_vault.json` (Local persistent storage, ready for Cloud migration).

## 🚀 How to Launch
### 1. Start the Neural Cloud (Python)
Ensure you have Python installed, then run:
```bash
pip install -r requirements.txt
python main.py
```
*The backend will be live at http://localhost:8000*

### 2. Start the Interface (Vite)
Open a new terminal and run:
```bash
npm install
npm run dev
```

## ☁️ Cloud Deployment
To host this on the web:
- **Backend**: Deploy `main.py` to **Render**, **Railway**, or **Heroku**.
- **Database**: Swap the JSON logic for a **MongoDB Atlas** or **Supabase** connection.
- **Frontend**: Host on **Vercel** and point the `API_BASE` in `App.tsx` to your new backend URL.

## 🔒 Security
Every user has an isolated matrix protected by a unique Neural PIN. Data is encrypted and siloed per user ID.
