# Chatbot PMB Universitas Katolik De La Salle Manado

Aplikasi chatbot berbasis web untuk memberikan informasi Penerimaan Mahasiswa Baru (PMB) menggunakan metode Long Short-Term Memory (LSTM).

A. Fitur
- Informasi persyaratan pendaftaran
- Jadwal PMB
- Biaya pendaftaran
- Alur pendaftaran
- Informasi umum kampus

B. Teknologi
- Python 3.11.7
- Flask 3.1.0
- TensorFlow 2.19.0
- LSTM

Folder dan file awal chatbot-pmb-lstm: 
A. dataset,
- intents.json
B. model, 
C. templates,
- index.html
D. static, 
- css: style.css
- js: chat.js
E. app.py, train_model.py, dependency.txt 

* isi folder model adalah tambahan file ketika training dijalankan

C. Cara Menjalankan 
1. Install software dan dependency
# CARA INSTALL SOFTWARE
a. buka folder project di VS Code
b. buka terminal di VS Code 
c. Pastikan Python 3.x sudah terinstall di komputer Anda. 
- Cek lewat terminal: python --version
d. Pastikan python yang dipakai VS Code benar
- di keyboard tekan:
Ctrl + Shift + P
- ketik / cari:
Python: Select Interpreter
- pilih versi python 3.x(yang sudah terinstall di komputer)

# CARA INSTALL DEPENDENCY
a. Buka dependency.txt, isi:
flask,
tensorflow,
numpy,
nltk,
scikit-learn,

b. Lalu buka Terminal di VS Code, jalankan:
pip install -r dependency.txt

2. Training model:
python train.py
4. Jalankan aplikasi:
python app.py
