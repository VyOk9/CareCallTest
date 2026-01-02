# Ticket 3 — Transcription tronquée (audios longs > 1 minute)

---

## 1. Comprendre le problème signalé

### Ce que le client observe

Les audios longs (supérieurs à ~1 minute) sont **partiellement transcrits**, ce qui empêche le LLM de comprendre correctement la demande.

### Reformulation factuelle

La transcription renvoyée par l’application ne contient qu’une partie du contenu des fichiers audio longs, entraînant une perte d’information avant l’étape d’interprétation.

---

## 2. Analyser les causes possibles

L’analyse du workflow (upload → STT → LLM) montre que :

* La transcription est effectuée dans `AzureSpeechService.transcribe_audio`.
* La méthode utilisée initialement est `recognize_once_async()` (mode “one-shot”), qui n’est pas adaptée aux longues durées : la reconnaissance s’arrête trop tôt.

### Cause racine

Utilisation de `recognize_once_async()` (reconnaissance “one-shot”) pour des fichiers audio longs, ce qui tronque la transcription.

---

## 3. Ticket clair et structuré

### Demande du client

Les audios longs sont partiellement transcrits.

### Analyse de la cause racine

Le mode de transcription utilisé est limité et ne couvre pas correctement les longues durées.

### Plan d’action

1. Remplacer la reconnaissance “one-shot” par une reconnaissance **continue (streaming)**.
2. Agréger les segments reconnus pour obtenir une transcription complète.
3. Conserver la logique de retry.
4. Ajuster le timeout pour les audios longs (valeur par défaut augmentée).

### Changements techniques à effectuer

* Modifier `app/azure_speech_service.py` :

  * passage en `start_continuous_recognition()`
  * agrégation des résultats
  * attente de fin via un mécanisme d’évènement (ou timeout)
* Augmenter le `timeout_seconds` par défaut pour couvrir des audios longs (ex: 90s).
* Ne logger une annulation que si c’est une **vraie erreur** (ignorer `EndOfStream` qui correspond à une fin normale du fichier).

---

## 4. Appliquer le changement

### Correctif appliqué

* Passage en **reconnaissance continue (streaming)** afin de transcrire des audios longs sans coupure.
* Agrégation des segments reconnus pour reconstituer la transcription complète.
* Augmentation du timeout par défaut (90s) pour éviter une interruption sur les fichiers longs.
* Nettoyage des logs : `EndOfStream` est traité comme une fin normale, seules les erreurs réelles sont remontées.

### Point restant / amélioration

* Rendre le timeout **configurable** (ou calculé dynamiquement selon la durée du fichier) et informer l’utilisateur si un timeout survient.

---

## 5. Retour au client

**Message client :**

> Bonjour,
> Nous avons identifié que la transcription était tronquée sur les audios longs car l’application utilisait un mode de reconnaissance limité.
> Nous avons corrigé ce point en passant à une reconnaissance continue (streaming) et en augmentant le délai maximum pour couvrir les fichiers longs, ce qui permet désormais de récupérer une transcription complète.
>
> À noter : pour les fichiers exceptionnellement longs, un délai maximum reste nécessaire. Nous pouvons le rendre configurable ou l’adapter automatiquement à la durée de l’audio, et afficher un message clair si un timeout survient.
