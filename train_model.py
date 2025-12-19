import json
import numpy as np
import nltk
import pickle
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder

nltk.download('punkt')

# Load dataset
with open('dataset/intents.json') as f:
    data = json.load(f)

sentences = []
labels = []

for intent in data['intents']:
    for pattern in intent['patterns']:
        sentences.append(pattern)
        labels.append(intent['tag'])

# Encode labels
encoder = LabelEncoder()
encoded_labels = encoder.fit_transform(labels)

# Tokenize
tokenizer = Tokenizer()
tokenizer.fit_on_texts(sentences)
sequences = tokenizer.texts_to_sequences(sentences)
padded = pad_sequences(sequences)

# Build model
model = Sequential()
model.add(Embedding(len(tokenizer.word_index)+1, 16, input_length=padded.shape[1]))
model.add(LSTM(16))
model.add(Dense(len(set(labels)), activation='softmax'))

model.compile(loss='sparse_categorical_crossentropy',
              optimizer='adam',
              metrics=['accuracy'])

# Train
model.fit(padded, encoded_labels, epochs=100, verbose=1)

# Save model
model.save('model/lstm_model.h5')
pickle.dump(tokenizer, open('model/tokenizer.pkl', 'wb'))
pickle.dump(encoder, open('model/label_encoder.pkl', 'wb'))
