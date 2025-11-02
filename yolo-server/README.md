YOLO Detection Server (Flask)

Quick start (local):

1. Install Python 3.11+
2. Create venv and install deps:
   python -m venv .venv
   .venv\Scripts\activate
   python -m pip install -r requirements.txt
3. Put your model file at yolo-server\best.pt (or set YOLO_MODEL_PATH env)
4. Run the server (Windows):
   set PORT=8002
   set YOLO_MODEL_PATH=best.pt
   python server.py
   
   or with Waitress (Windows-friendly WSGI):
   set PORT=8002
   set YOLO_MODEL_PATH=best.pt
   python -m waitress --port=%PORT% yolo-server.server:app
5. Frontend env (in the React app):
   VITE_YOLO_API=http://localhost:8002/yolo/detect

Deploy to Render:
- Build Command: pip install -r yolo-server/requirements.txt
- Start Command (recommended):
   gunicorn --chdir yolo-server server:app --workers 2 --bind 0.0.0.0:$PORT
- Env Vars:
  - PORT (auto by Render)
  - YOLO_MODEL_PATH=/opt/render/project/src/yolo-server/best.pt

If ultralytics pulls PyTorch wheels that are heavy for your plan, consider using a smaller model (e.g., yolov8n.pt) or a provider with GPU.
