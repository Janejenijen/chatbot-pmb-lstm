from flask import Flask, render_template, request, jsonify
import json
import numpy as np
import pickle
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

model = load_model('model/lstm_model.h5')
tokenizer = pickle.load(open('model/tokenizer.pkl', 'rb'))
encoder = pickle.load(open('model/label_encoder.pkl', 'rb'))

with open('dataset/intents.json') as f:
    intents = json.load(f)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json["message"]
    seq = tokenizer.texts_to_sequences([user_input])
    pad = pad_sequences(seq, maxlen=20)
    pred = model.predict(pad)
    tag = encoder.inverse_transform([np.argmax(pred)])

    for intent in intents["intents"]:
        if intent["tag"] == tag[0]:
            return jsonify({"reply": intent["responses"][0]})

    return jsonify({"reply": "Maaf, saya belum memahami pertanyaan tersebut."})

if __name__ == "__main__":
    app.run(debug=True)
