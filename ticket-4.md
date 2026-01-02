# Ticket 4 — Réponse LLM incohérente

---

## 1. Comprendre le problème signalé

### Ce que le client observe

La transcription affichée est correcte, mais la réponse de l’assistant contient parfois des informations incohérentes, comme si elle répondait à un autre message.

### Reformulation factuelle

L’application reçoit une transcription valide, mais celle-ci est polluée par des éléments parasites, ce qui entraîne une interprétation incorrecte par le LLM.

---

## 2. Analyse des causes possibles

L’analyse du pipeline (audio → transcription → LLM → agenda) montre que :

* Les fichiers audio peuvent contenir plusieurs voix, du bruit de fond et des codecs hétérogènes.
* Avant correctif, **les fichiers étaient envoyés au STT sans normalisation préalable**.
* Cela provoquait une transcription polluée (voix secondaires, bruits, variations de sample rate), amenant le LLM à interpréter une demande incorrecte.

### Cause racine

**Absence de normalisation audio avant transcription**, entraînant une pollution de la reconnaissance vocale et une mauvaise interprétation par le LLM.

---

## 3. Ticket clair et structuré

### Demande client

La réponse de l’assistant est incohérente par rapport à la demande réelle.

### Analyse de la cause racine

Les fichiers audio n’étaient pas normalisés avant envoi au service de reconnaissance vocale.

### Plan d’action

1. Normaliser systématiquement les fichiers audio avant transcription.
2. Forcer un format STT standard (mono, 16 kHz, 16-bit PCM).
3. Conserver la reconnaissance continue.

### Changements techniques à effectuer

**`app/audio_upload.py` :**

* Conversion systématique en WAV mono 16 kHz / 16-bit PCM avant transcription.

---

## 4. Application du changement

### Correctif appliqué

Tous les fichiers audio sont désormais convertis et normalisés avant transcription, ce qui améliore significativement la qualité de la reconnaissance vocale et la fiabilité des réponses du LLM.

---

## 5. Retour au client

> Bonjour,
> Nous avons corrigé un problème qui pouvait entraîner des réponses imprécises de l’assistant lorsque la qualité du son variait ou que plusieurs personnes parlaient en même temps.
> L’application traite désormais automatiquement vos enregistrements afin de mieux comprendre la voix principale.
> Cela permet d’obtenir des réponses plus fiables et plus cohérentes.
>
> N’hésitez pas à nous recontacter si vous constatez encore un comportement inhabituel.