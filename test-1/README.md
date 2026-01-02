# 📝 CareCall Voice Assistant

## 📚 Sommaire

📌 [Objectif](#objectif)

📌 [Fonctionnalités](#fonctionnalités)

📌 [Architecture](#architecture)

📌 [Prérequis](#prérequis)

📌 [Variables d'environnement](#variables-denvironnement)

📌 [Installation](#installation)

📌 [Utilisation](#utilisation)

📌 [Tests](#tests)

📌 [Arborescence](#arborescence)

📌 [Confidentialité](#confidentialité)

---

## 🎯 Objectif

🎙️ Fournir une application web qui écoute une commande vocale, comprend ce que souhaite l'utilisateur, puis interagit avec Google Agenda pour créer ou consulter des événements, tout en donnant une réponse claire.

---

## ✨ Fonctionnalités

🚪 Connexion Google OAuth

🎧 Ajout d'un fichier audio contenant la commande vocale

📝 Transcription de l'audio via Azure Speech to Text

🧠 Interprétation avec Azure OpenAI et appel de fonction

📆 Création d'événement Google Agenda

🔍 Consultation des événements sur une journée ou une semaine

💬 Retour utilisateur lisible exemple : « Rendez‑vous ajouté mardi à dix heures »

---

## 🏗️ Architecture

🔹 **Frontend** : Streamlit pour une interface rapide et réactive

🔹 **Backend** : Modules Python distincts qui gèrent chacune des étapes (upload, transcription, LLM, agenda)

🔹 **Orchestrateur** : `workflow_orchestrator.py` relie tout

---

## 🖥️ Prérequis

🐍 Python 3.10 ou version supérieure

🔑 Clés API Azure (Speech et OpenAI) valides

🧪 Compte Google ajouté dans la console Google Cloud (section "Utilisateurs test" de l'écran de consentement OAuth)

📁 `.env` contenant les variables d’environnement nécessaires

---

## ⚙️ Installation

1️⃣ Cloner ce dépôt puis se placer à la racine

2️⃣ `python -m venv .venv` puis activer l'environnement virtuel

3️⃣ `pip install -r requirements.tx``t`

4️⃣ Renseigner chaque variable dans un fichier `.env` (voir plus bas)

---

## 🚀 Utilisation

▶️ `streamlit run streamlit_app.py`

🌐 Une page s'ouvre automatiquement dans votre navigateur par défaut

👤 Connectez-vous via votre compte Google (autorisé au préalable dans la plateforme Google Cloud)

📂 Cliquez sur "Upload" pour charger un fichier audio (formats acceptés : WAV, MP3, M4A)

🧠 L'application transcrit l'audio, comprend l'intention, puis interagit avec votre Google Agenda

✅ Un retour clair vous est affiché (ex : "Rendez-vous créé mardi à 10h")&#x20;

---

## 🧪 Tests

🔬 Lancer les tests unitaires : `pytest tests/unit`

🔬 Lancer les tests d'intégration : `pytest tests/integration`

---

## 🔑 Variables d'environnement

```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=francecentral
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8599/
```

---

## 📂 Arborescence

```
CareCall
│
├── app
│   ├── audio_upload.py        gestion de l'upload et conversion wav
│   ├── azure_speech_service.py transcription Audio vers Texte
│   ├── google_calendar_integration.py interaction avec Agenda
│   ├── openai_function_calling.py     appel LLM et fonctions
│   └── workflow_orchestrator.py       logique centrale
│
├── streamlit_app.py            interface utilisateur
├── temp_audio                  fichiers audio temporaires
├── tests                       unitaires et intégration
└── README.md                   ce fichier
```

---
