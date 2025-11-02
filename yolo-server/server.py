import os
from io import BytesIO
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# Optional: suppress ultralytics verbose logging
os.environ.setdefault('YOLO_VERBOSE', '0')

try:
    from ultralytics import YOLO
except Exception as e:
    YOLO = None
    print("Ultralytics import failed:", e)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['MAX_CONTENT_LENGTH'] = 4 * 1024 * 1024  # 4MB

MODEL_PATH = os.environ.get('YOLO_MODEL_PATH', 'best.pt')
_model = None

def load_model():
    """Load YOLO model if available; safe to call multiple times."""
    global _model
    if YOLO is None:
        print("Ultralytics not available.")
        _model = None
        return _model
    if _model is not None:
        return _model
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"Model file not found: {MODEL_PATH}")
            _model = None
            return _model
        _model = YOLO(MODEL_PATH)
        print(f"Loaded YOLO model: {MODEL_PATH}")
        return _model
    except Exception as e:
        print("Failed to load YOLO model:", e)
        _model = None
        return _model

# Eager attempt at import time; if it fails, we will lazy-load on first request
try:
    load_model()
except Exception as _e:
    print("Initial model load failed:", _e)

@app.get('/yolo/health')
def health():
    return jsonify({
        'ok': _model is not None,
        'model_path': MODEL_PATH,
    })

@app.post('/yolo/detect')
def detect():
    global _model
    if _model is None:
        load_model()
    if _model is None:
        return jsonify({'error': 'model not loaded'}), 503
    if not request.is_json:
        return jsonify({'error': 'Expected JSON with { image: dataURL }'}), 400
    data = request.get_json(silent=True) or {}
    data_url = data.get('image')
    if not data_url or 'base64,' not in data_url:
        return jsonify({'error': 'Invalid data URL'}), 400
    try:
        b64 = data_url.split('base64,', 1)[1]
        img = Image.open(BytesIO(base64.b64decode(b64))).convert('RGB')
        results = _model.predict(img, conf=0.25, verbose=False)
        dets = []
        if results:
            r0 = results[0]
            names = getattr(r0, 'names', {}) or {}
            boxes = getattr(r0, 'boxes', None)
            if boxes is not None:
                import numpy as np
                xyxy = boxes.xyxy.cpu().numpy().tolist()
                confs = boxes.conf.cpu().numpy().tolist()
                clss = boxes.cls.cpu().numpy().tolist()
                for (x1, y1, x2, y2), c, cl in zip(xyxy, confs, clss):
                    dets.append({
                        'x1': float(x1), 'y1': float(y1), 'x2': float(x2), 'y2': float(y2),
                        'conf': float(c), 'label': names.get(int(cl), str(int(cl)))
                    })
        return jsonify({'detections': dets})
    except Exception as e:
        print('/yolo/detect error:', e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8002'))
    app.run(host='0.0.0.0', port=port, debug=True)
