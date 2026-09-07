# Mémoire — creusement AcoustiCert (candidat 7)

## Compteur
6/6 WebSearch utilisés (quota du brief de creusement). WebFetch : 8 tentatives, 3 réussies.

## Requêtes WebSearch qui ont marché
1. "Port of Vancouver EcoAction underwater noise notation requirements ABS DNV LR BV Rnoise" — a donné la
   liste des notations acceptées (ABS UWN, BV URN, DNV SILENT-E, LR UWN-L, RINA). Résultat clé du dossier.
2. "ECHO program Vancouver hydrophone Boundary Pass underwater noise measure each vessel free" — a confirmé
   que Boundary Pass mesure déjà 4 000-5 000 navires/an, ~10 000 navires uniques.
3. "ISO 17208-1 underwater radiated noise measurement cost sea trial class notation price" — pas de coût
   trouvé, mais a confirmé le protocole (navire coopérant, passages contrôlés, eau profonde).
4. "Transport Canada Boundary Pass listening station individual vessel noise report shipowner feedback" —
   a donné la phrase clé : « analyse automatisée en temps réel qui mesure le bruit rayonné de chaque navire
   individuellement », avec cartographie de coque pour certains navires.
5. "JASCO Applied Sciences ship noise report individual vessel owner underwater noise assessment service" —
   a révélé que JASCO (opérateur de Boundary Pass) vend aussi des mesures à la commande (ShipConsult) et
   publie sa propre méthode de notation A-D.
6. "underwater radiated noise source separation multiple simultaneous vessels AIS machine learning
   attribution" — littérature 2022-2025 active (séparateur-décodeur, deep learning), mais résultats sur
   données simulées/mono-canal, aucun déploiement commercial confirmé.

## Sources mortes / échecs WebFetch
- portvancouver.com : 403 systématique sur toute tentative directe (page ECHO, PDF EcoAction 2026), comme
  déjà noté dans le dossier d'origine. Toujours passer par le résumé WebSearch pour ce domaine.
- safety4sea.com/port-of-vancouver-promotes-quieter-ships/ : 403 en fetch direct (le dossier d'origine avait
  pu le citer via résumé WebSearch seulement — confirmé, jamais fetchable directement).
- jasco.com/boundary-pass-uls : redirige vers jasco.com/uls, page trop mince pour répondre aux questions sur
  l'accès aux données ou un service payant de rapport par navire — resté sans réponse, lacune du dossier.
- clearseas.org/insights/detecting-and-measuring-urn/ : seul WebFetch pleinement réussi sur ce sujet ; a
  donné la distinction essai actif (ranging) vs suivi passif long terme, sans coût ni mention explicite
  d'ISO 17208 ni de Boundary Pass comme alternative à l'essai en mer.

## Leçons
- Le point qui tue le candidat tel qu'imaginé au dossier d'origine : le Port de Vancouver liste nommément
  les notations de sociétés de classification acceptées pour le rabais EcoAction ; aucune trace d'une
  attestation tierce acceptée en substitut. À vérifier plus fort si repris : appeler/écrire directement au
  Port (hors budget de cette passe).
- Deuxième point qui affaiblit fort le candidat : Boundary Pass fait déjà, gratuitement (financé par
  Transports Canada), de l'attribution automatisée par navire individuel — ce n'est plus une IA qui rend
  possible quelque chose d'impossible avant 2024, c'est une infrastructure publique existante. L'angle
  différenciateur doit se déplacer vers la restitution/alerte par armateur, pas vers la mesure elle-même.
- N'a pas pu vérifier l'accès aux données brutes de Boundary Pass (licence, coût, conditions) : à
  approfondir par WebFetch de pages gouvernementales (tc.canada.ca) plutôt que jasco.com si repris.
