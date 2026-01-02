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

* Le backend utilise le `calendar_id` fourni pour insérer l’évènement.
* Le système fonctionne techniquement : l’évènement est bien créé.
* Cependant, le produit **ne permet pas à l’utilisateur de sélectionner explicitement son calendrier cible**.

Dans Google Calendar, un utilisateur peut disposer de plusieurs calendriers (personnel, professionnel, partagé, etc.).
En l’absence de sélection explicite, l’application peut écrire dans un calendrier valide mais différent de celui que le client consulte.

### Cause racine

**Absence de sélection explicite du calendrier cible côté interface utilisateur**, entraînant l’utilisation d’un calendrier différent de celui attendu par le client.

---

## 3. Ticket clair et structuré

### Demande du client

Le rendez-vous est créé, mais n’apparaît pas dans son agenda habituel.

### Analyse de la cause racine

L’application ne permet pas à l’utilisateur de choisir son calendrier par défaut. Elle écrit donc dans un calendrier valide mais potentiellement différent de celui consulté.

### Plan d’action

1. Lister les calendriers accessibles via l’API Google Calendar après l’authentification OAuth.
2. Permettre à l’utilisateur de sélectionner son calendrier par défaut dans l’interface.
3. Sauvegarder ce choix utilisateur.
4. Utiliser ce `calendar_id` pour toutes les créations de rendez-vous.

### Changements techniques à effectuer

* Côté interface :

  * Appeler `calendarList().list()` pour récupérer les calendriers disponibles.
  * Ajouter une sélection de calendrier (menu déroulant).
  * Stocker le `calendar_id` choisi.
* Côté backend :

  * Utiliser systématiquement le `calendar_id` sélectionné pour la création d’évènements.
  * Ou fallback sur le calendrier par défaut si aucun n’est sélectionné.

---

## 4. Application du changement

**À implémenter côté interface** :

* Récupération de la liste des calendriers Google disponibles.
* Ajout d’un sélecteur de calendrier dans l’interface.
* Transmission du `calendar_id` sélectionné au workflow.

*(Aucun correctif backend n’est nécessaire, le système fonctionne déjà correctement.)*

---

## 5. Retour au client

**Message client :**

> Bonjour,
> Votre rendez-vous a bien été créé, mais sur un autre agenda que celui que vous consultez habituellement.
> Nous avons identifié que l’application ne permettait pas encore de sélectionner explicitement votre calendrier par défaut.
> Nous allons ajouter cette possibilité afin que vos prochains rendez-vous soient créés directement dans l’agenda de votre choix.
>
> Nous vous tiendrons informé de la mise à disposition de cette amélioration.
