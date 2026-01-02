# Ticket 2 — Rendez-vous créé sur le mauvais calendrier

---

## 1. Comprendre le problème signalé

### Ce que le client observe

Le rendez-vous est bien créé par l’application, mais il **n’apparaît pas dans l’agenda habituel** du client.

### Reformulation factuelle

L’application crée correctement un évènement Google Calendar, mais celui-ci est inséré dans un calendrier différent de celui que le client consulte habituellement.

---

## 2. Analyse des causes possibles

L’analyse du workflow (transcription → LLM → création Google Agenda) montre que :

* L’interface transmettait toujours `calendar_id="primary"` au backend.
* Les utilisateurs disposent souvent de plusieurs calendriers (personnel, professionnel, partagés).
* L’évènement était donc créé dans un calendrier valide mais **pas nécessairement celui consulté par le client**.

### Cause racine

**Le `calendar_id` était hardcodé à `"primary"` dans `streamlit_app.py`, empêchant l’utilisateur de choisir son calendrier cible.**

---

## 3. Ticket clair et structuré

### Demande client

Le rendez-vous est créé, mais il n’apparaît pas dans son agenda habituel.

### Analyse de la cause racine

L’application forçait l’utilisation du calendrier `"primary"` sans laisser le choix à l’utilisateur.

### Plan d’action

1. Lister tous les calendriers disponibles via l’API Google Calendar.
2. Ajouter un sélecteur de calendrier dans l’interface.
3. Passer le `calendar_id` sélectionné au workflow.
4. Inclure le `calendar_id` dans la clé de cache de l’interface pour relancer le workflow lors d’un changement de calendrier.

### Changements techniques à effectuer

**Côté interface (`streamlit_app.py`) :**

* Récupération des calendriers via `calendarList().list()`.
* Ajout d’un menu déroulant de sélection.
* Passage de `selected_calendar_id` au workflow.
* Clé de cache basée sur `calendar_id + hash du fichier`.

---

## 4. Application du changement

### Correctif appliqué

L’interface permet désormais de sélectionner explicitement le calendrier cible.
Le `calendar_id` choisi est transmis au backend et inclus dans la clé de cache, garantissant que chaque calendrier reçoit ses propres créations d’évènements.

---

## 5. Retour au client

> Bonjour,
> Nous avons corrigé un problème qui pouvait faire apparaître vos rendez-vous dans un autre agenda que celui que vous consultez habituellement.
> Vous pouvez désormais choisir directement l’agenda dans lequel vos rendez-vous seront créés.
>
> Vos prochains rendez-vous apparaîtront donc exactement là où vous le souhaitez.
>
> N’hésitez pas à nous recontacter si vous avez d’autres questions ou besoins.