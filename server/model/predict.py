import os
import sys
import numpy as np
import cv2
import tensorflow as tf
from skimage.filters import frangi

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs

TARGET_SIZE = (224, 224)

def extract_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Could not read image: {image_path}", file=sys.stderr)
        return None

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, TARGET_SIZE)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)

    # Feature extraction
    fire_mask = cv2.inRange(hsv, (0, 120, 70), (20, 255, 255))
    edges = cv2.Canny(gray, 100, 200)
    frangi_img = frangi(gray, sigmas=range(1, 4, 1))
    ycrcb = cv2.cvtColor(img, cv2.COLOR_RGB2YCrCb)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    clahe_l = clahe.apply(lab[:, :, 0])

    # Combine features
    features = np.zeros((*TARGET_SIZE, 8), dtype=np.float16)
    features[..., :3] = img.astype(np.float16) / 255.0
    features[..., 3] = fire_mask.astype(np.float16) / 255.0
    features[..., 4] = frangi_img.astype(np.float16)
    features[..., 5] = edges.astype(np.float16) / 255.0
    features[..., 6] = ycrcb[..., 1].astype(np.float16) / 255.0
    features[..., 7] = clahe_l.astype(np.float16) / 255.0

    return np.expand_dims(features, axis=0)

def predict_fire(image_path):
    model_path = "D:\\fireDetectionBackend\\server\\model.h5"
    if not os.path.exists(model_path):
        print(f"ERROR: Model not found -> {model_path}", file=sys.stderr)
        sys.exit(1)

    model = tf.keras.models.load_model(model_path, compile=False)

    if not os.path.exists(image_path):
        print(f"ERROR: Image not found -> {image_path}", file=sys.stderr)
        sys.exit(1)

    features = extract_features(image_path)
    if features is None:
        print("ERROR: Feature extraction failed", file=sys.stderr)
        sys.exit(1)

    prediction = model.predict(features, verbose=0)[0][0]
    return "fire" if prediction > 0.5 else "nofire"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    result = predict_fire(sys.argv[1])
    print(result)



