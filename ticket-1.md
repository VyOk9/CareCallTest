# Ticket 1 — Mauvaise date de rendez-vous (décembre → janvier)

---

## 1. Compréhension du problème

### Ce que le client observe

Lorsqu’un client demande la création d’un rendez-vous en **décembre**, celui-ci est systématiquement créé en **janvier** dans son Google Agenda.

### Reformulation factuelle

Une demande vocale mentionnant un rendez-vous en décembre est interprétée par l’application comme un rendez-vous en janvier, ce qui entraîne une création d’évènement avec un mois incorrect.

---

## 2. Analyse des causes possibles

L’analyse du workflow (transcription → LLM → création d’évènement) montre que :

* La transcription Azure Speech restitue correctement le mois “décembre”.
* L’erreur apparaît après l’appel au LLM, dans la phase d’interprétation de la demande.
* Dans le fichier `openai_function_calling.py`, les instructions système envoyées au modèle contiennent la règle suivante :

> “If the user speaks about December, you must always schedule the appointment in January.”

Cette règle force le modèle à transformer toute demande contenant “décembre” en une date de janvier.

### Cause racine

La cause racine est une **instruction erronée dans le prompt système du LLM** imposant un décalage de décembre vers janvier.

---

## 3. Ticket structuré

### Demande client

Les rendez-vous demandés en décembre sont créés en janvier.

### Analyse de la cause racine

Une règle incorrecte dans le prompt système du LLM force la conversion du mois de décembre en janvier.

### Plan d’action

1. Supprimer la règle incorrecte du prompt LLM.
2. Ajouter une règle explicite indiquant que le mois mentionné par l’utilisateur ne doit jamais être modifié (décembre doit rester décembre).

### Changements techniques à effectuer

* Modifier le fichier `app/openai_function_calling.py` :

  * Supprimer l’instruction forçant “December → January”.
  * Ajouter une instruction garantissant que le mois ne doit pas être modifié.

---

## 4. Application du changement

### Correctif appliqué

```diff
system_instructions = (
    "You are an assistant that interprets user requests for calendar events. "
    f"Today's date is {current_date_str}. If the user does not specify a year, assume {current_year_str}. "
    "Use the ISO format YYYY-MM-DD for dates and HH:MM (24-hour) for times. "
    "If the user omits date or time, you must assume today's date. "
-   "If the user speaks about December, you must always schedule the appointment in January."
+   "Never change the month explicitly mentioned by the user (e.g., December must remain December). "
    "Only use the provided functions (create_event or list_events) to produce the outcome. "
    "Do not ask clarifications; fill missing details with the stated defaults."
)
```

---

## 5. Retour au client

> Bonjour,
> Nous avons identifié la cause de l’erreur qui décalait vos rendez-vous de décembre vers janvier : une règle incorrecte dans l’interprétation automatique de la demande.
> Nous avons corrigé cette règle afin que le mois indiqué dans votre commande vocale soit désormais toujours respecté.
> Vous pouvez à présent créer vos rendez-vous de décembre normalement.
>
> N’hésitez pas à nous recontacter si le problème persiste.
