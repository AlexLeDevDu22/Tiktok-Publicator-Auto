#! JS
FROM node:18

# Crée un dossier de travail
WORKDIR /app

# Copie les fichiers
COPY package*.json ./
RUN npm install

COPY . .

# Lancer l'app (change selon ton fichier d'entrée)
CMD ["node", "server.js"]

# Optionnel : expose le port si ton app écoute
EXPOSE 3000


#! Py
FROM selenium/standalone-chrome:latest

COPY . .
RUN apt-get update && apt-get install -y python3-pip
RUN apt-get install -y python3-dev
RUN pip install -r requirements.txt

# chrome
RUN apt-get update && apt-get install -y \
    wget unzip xvfb curl gnupg \
    && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable


CMD ["python", "tiktok-uploader.py"]