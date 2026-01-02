# Ticket 5 — Formats audio non supportés (.opus)

---

## 1. Comprendre le problème signalé

### Ce que le client observe

Certains fichiers audio (par exemple **.opus**) ne peuvent pas être sélectionnés ou sont refusés par l’application, alors que les formats `.wav`, `.mp3` et `.m4a` fonctionnent.

### Reformulation factuelle

L’application empêche l’upload et la prise en charge de certains formats audio pourtant valides, bloquant ainsi la transcription et l’exécution de la commande vocale.

---

## 2. Analyser les causes possibles

L’analyse montre deux points bloquants :

1. **Filtrage côté interface (Streamlit)**
   Le composant `st.file_uploader(..., type=[...])` limite les formats visibles et sélectionnables à une liste fixe (`wav/mp3/m4a`), empêchant l’utilisateur de choisir des fichiers `.opus`.

2. **Liste blanche côté backend**
   Le backend validait initialement les fichiers uniquement par extension, via une whitelist restrictive.

### Cause racine

Une gestion trop restrictive des formats audio, à la fois côté interface et côté backend, alors que le moteur de conversion (`pydub` + `ffmpeg`) est capable de traiter des formats supplémentaires comme `.opus`.

---

## 3. Ticket clair et structuré

### Demande du client

Pouvoir utiliser des formats audio alternatifs (ex : `.opus`).

### Analyse de la cause racine

Le filtrage par extension empêche la sélection et le traitement de formats pourtant compatibles avec la chaîne de conversion audio.

### Plan d’action

1. Supprimer le filtrage restrictif côté interface.
2. Supprimer la validation par extension côté backend.
3. Valider les fichiers en tentant leur décodage réel.
4. Convertir et normaliser systématiquement les fichiers audio avant transcription.

### Changements techniques à effectuer

* Modifier `streamlit_app.py` :

  * supprimer ou élargir le paramètre `type` du `file_uploader`.
* Modifier `app/audio_upload.py` :

  * suppression de la whitelist d’extensions,
  * validation par tentative de décodage,
  * conversion et normalisation automatique en WAV mono 16 kHz / PCM.

---

## 4. Application du changement

### Correctif appliqué

L’application accepte désormais tous les formats audio décodables par `ffmpeg`, y compris `.opus`.
Tous les fichiers sont automatiquement convertis et normalisés avant transcription.

---

## 5. Retour au client

**Message client :**

> Bonjour,
> Les formats audio `.opus` et autres formats compatibles sont désormais pris en charge.
> Vos fichiers sont automatiquement convertis et normalisés avant transcription, ce qui garantit une meilleure qualité de reconnaissance vocale.
> Vous pouvez désormais utiliser ces formats sans restriction.
