# Ticket 4 — Réponse LLM incohérente

---

## 1. Comprendre le problème signalé

### Ce que le client observe

La transcription affichée est correcte, mais la réponse de l’assistant contient parfois des informations qui ne correspondent pas à la demande, comme si elle répondait à un autre message.

### Reformulation factuelle

L’application reçoit une transcription valide mais le LLM interprète des éléments parasites, ce qui entraîne des réponses incohérentes par rapport à la demande initiale.

---

## 2. Analyse des causes possibles

L’analyse du pipeline (audio → transcription → LLM → agenda) montre que :

* Les fichiers audio fournis peuvent contenir plusieurs voix et du bruit de fond.
* Les audios sont fournis dans des formats hétérogènes (stéréo, différents sample rates, codecs compressés).
* Avant correctif, les fichiers n’étaient pas normalisés avant transcription.

Ces éléments provoquent une **pollution de la transcription** (mots parasites, morceaux de phrases secondaires), ce qui amène le LLM à interpréter une demande incorrecte.

### Cause racine

Absence de normalisation audio avant la transcription, entraînant une mauvaise séparation de la voix principale et des voix secondaires.

---

## 3. Ticket clair et structuré

### Demande du client

La réponse de l’assistant est incohérente par rapport à la transcription affichée.

### Analyse de la cause racine

La transcription est polluée par des voix secondaires et du bruit de fond, car les fichiers audio ne sont pas normalisés avant envoi au service de reconnaissance vocale.

### Plan d’action

1. Normaliser systématiquement tous les fichiers audio avant transcription.
2. Forcer un format compatible STT (mono, 16 kHz, PCM).
3. Conserver la logique de transcription continue.

### Changements techniques à effectuer

* Modifier `app/audio_upload.py` :

  * Conversion forcée en WAV mono 16 kHz / 16-bit PCM avant transcription.

---

## 4. Application du changement

### Correctif appliqué

Les audios sont désormais normalisés en mono 16 kHz / PCM avant transcription, ce qui améliore la clarté de la voix principale et élimine la majorité des interférences liées aux voix secondaires et au bruit de fond.

---

## 5. Retour au client

**Message client :**

> Bonjour,
> Nous avons identifié que certaines incohérences provenaient de la qualité et du format des fichiers audio transmis (présence de bruit de fond et de plusieurs voix).
> Nous avons appliqué un correctif qui normalise automatiquement vos audios avant transcription afin d’améliorer la reconnaissance de la voix principale.
> Vos commandes vocales sont désormais interprétées de manière beaucoup plus fiable.
>
> N’hésitez pas à nous recontacter si vous constatez encore un comportement anormal.
