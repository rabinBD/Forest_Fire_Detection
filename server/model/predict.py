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



# import os
# import sys
# import numpy as np
# from PIL import Image, ImageEnhance
# import tensorflow as tf
# os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# def preprocess_image(image_path):
#     """Preprocess the input image with advanced techniques."""
#     try:
#         if not os.path.exists(image_path):
#             print(f"ERROR: File not found -> {image_path}", file=sys.stderr)
#             sys.exit(1)

#         # Load and convert image
#         img = Image.open(image_path).convert('RGB')
        
#         # Resize to model input size
#         img = img.resize((224, 224))
        
#         # Enhance contrast for better feature detection
#         enhancer = ImageEnhance.Contrast(img)
#         img = enhancer.enhance(1.2)  # Slight contrast boost
        
#         # Convert to array and normalize
#         img_array = np.array(img) / 255.0
        
#         # Apply additional normalization (standardization)
#         img_array = (img_array - np.mean(img_array)) / np.std(img_array)
        
#         # Expand dimensions for model input
#         img_array = np.expand_dims(img_array, axis=0)
#         return img_array
#     except Exception as e:
#         print(f"ERROR: Failed to process image -> {str(e)}", file=sys.stderr)
#         sys.exit(1)

# def predict_fire(image_path, confidence_threshold=0.6):
#     """Predict fire in an image with confidence scoring."""
#     try:
#         # Load the pre-trained model
#         model = tf.keras.models.load_model("D:\\fireDetectionBackend\\server\\final_model_20250702_1619.h5", compile=False)
        
#         # Preprocess the image
#         img_array = preprocess_image(image_path)
        
#         # Make prediction
#         prediction = model.predict(img_array, verbose=0)
#         confidence = float(prediction[0][0])
        
#         # Apply confidence threshold
#         if confidence > confidence_threshold:
#             result = "fire"
#         else:
#             result = "nofire"
            
#         return result, confidence
#     except Exception as e:
#         print(f"ERROR: Model prediction failed -> {str(e)}", file=sys.stderr)
#         sys.exit(1)

# if __name__ == "__main__":
#     if len(sys.argv) != 2:
#         print("Usage: python predict_fire.py <image_path>", file=sys.stderr)
#         sys.exit(1)
    
#     result, confidence = predict_fire(sys.argv[1])
#     print(f"Prediction: {result}, Confidence: {confidence:.4f}")



# import os
# import sys
# import numpy as np
# from PIL import Image
# import tensorflow as tf
# os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logs

# def predict_fire(image_path):
#     model = tf.keras.models.load_model("D:\\fireDetectionBackend\\server\\model.h5", compile=False)

#     if not os.path.exists(image_path):
#         print(f"ERROR: File not found -> {image_path}", file=sys.stderr)
#         sys.exit(1)

#     # Preprocess image
#     img = Image.open(image_path).convert('RGB')
#     img = img.resize((224, 224))
#     img_array = np.array(img) / 255.0  # Normalize to [0,1]

#     # Check model input shape
#     expected_channels = model.input_shape[-1]

#     # If model expects more than 3 channels, pad with zeros
#     if img_array.shape[-1] < expected_channels:
#         pad_channels = expected_channels - img_array.shape[-1]
#         padding = np.zeros((224, 224, pad_channels))
#         img_array = np.concatenate([img_array, padding], axis=-1)
#     elif img_array.shape[-1] > expected_channels:
#         # Just in case: trim channels if image has more than needed
#         img_array = img_array[:, :, :expected_channels]

#     img_array = np.expand_dims(img_array, axis=0)  # Shape: (1, 224, 224, expected_channels)

#     # Predict
#     prediction = model.predict(img_array)
#     return "fire" if prediction[0][0] > 0.5 else "nofire"

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python predict.py <image_path>")
#         sys.exit(1)

#     result = predict_fire(sys.argv[1])
#     print(result)
