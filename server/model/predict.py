import os
import sys
import numpy as np
from PIL import Image
import tensorflow as tf
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def predict_fire(image_path):
    model = tf.keras.models.load_model("D:\\fireDetectionBackend\\server\\final_model_20250702_1619.h5", compile=False)

    if not os.path.exists(image_path):
        print(f"ERROR: File not found -> {image_path}", file=sys.stderr)
        sys.exit(1)

    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    prediction = model.predict(img_array)
    return "fire" if prediction[0][0] > 0.5 else "nofire"

if __name__ == "__main__":
    result = predict_fire(sys.argv[1])
    print(result)
