# Ticket 5 — Formats audio non supportés (.opus)

---

## 1. Comprendre le problème signalé

### Ce que le client observe

Les fichiers `.opus` ne peuvent pas être sélectionnés ou sont refusés par l’application, alors que les formats `.wav`, `.mp3` et `.m4a` fonctionnent.

### Reformulation factuelle

L’application empêchait l’upload et la prise en charge de certains formats audio pourtant valides, bloquant ainsi la transcription et l’exécution de la commande vocale.

---

## 2. Analyse des causes possibles

L’analyse montre deux points bloquants :

1. **Filtrage côté interface (Streamlit)**
   Le composant `st.file_uploader(..., type=[...])` limitait les formats visibles et sélectionnables à une liste fixe (`wav/mp3/m4a`), empêchant la sélection de fichiers `.opus`.

2. **Validation par extension côté backend**
   Le backend validait initialement les fichiers uniquement par extension via une whitelist restrictive, alors que le moteur de conversion (`pydub` + `ffmpeg`) est capable de décoder d’autres formats.

### Cause racine

**Gestion trop restrictive des formats audio, principalement côté interface**, empêchant l’upload de formats pourtant compatibles.

---

## 3. Ticket clair et structuré

### Demande client

Pouvoir utiliser des formats audio alternatifs (ex. `.opus`).

### Analyse de la cause racine

Le filtrage par extension bloquait la sélection et le traitement de formats pourtant décodables par la chaîne de conversion audio.

### Plan d’action

1. Supprimer le filtrage restrictif côté interface.
2. Valider les fichiers par tentative de décodage réel.
3. Convertir et normaliser systématiquement les fichiers audio avant transcription.

### Changements techniques à effectuer

* `streamlit_app.py`

  * suppression du paramètre `type` du `file_uploader`.

* `app/audio_upload.py`

  * suppression de la whitelist d’extensions,
  * validation par décodage réel,
  * conversion et normalisation systématiques en WAV mono 16 kHz / 16-bit PCM.

---

## 4. Application du changement

### Correctif appliqué

L’application accepte désormais tous les formats audio décodables par `ffmpeg`, y compris `.opus`.
Tous les fichiers sont automatiquement convertis et normalisés avant transcription.

---

## 5. Retour au client

> Bonjour,
> Nous avons corrigé le problème qui empêchait l’utilisation de certains formats audio.
> Vous pouvez désormais envoyer vos fichiers audio (y compris les formats comme `.opus`) sans difficulté.
> L’application se charge automatiquement de les préparer afin qu’ils soient correctement compris par l’assistant vocal.
>
> Vous pouvez donc utiliser vos fichiers normalement, sans action particulière de votre côté.
>
> N’hésitez pas à nous recontacter si vous rencontrez d’autres soucis ou avez des questions.