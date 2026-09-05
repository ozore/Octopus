# Journal de bord — agent critic-ocean

Mission : évaluer les 12 idées de `ocean-plastic/IDEAS.md` sur 5 critères, en français, sortie dans
`verdict.md` (les noms findings/report/summary/analysis sont bloqués côté outil).

## Succès

- **Lecture d'abord, recherche ensuite.** Lire IDEAS.md + BRIEF.md + les 9 dossiers d'agents avant toute
  requête web a permis de repérer les contradictions internes (seuil pellets 1 000 vs 1 500 t/an entre
  `reg-europe`/`rivers-upstream` et IDEAS.md) et de cibler les 5 recherches sur des points réellement
  décisifs plutôt que sur de la re-vérification.
- **Grep plutôt que lecture intégrale** sur les dossiers volumineux (`divers-tourism-coastal` 459 lignes,
  `reg-usa`, `reg-asia`) : une requête grep multi-motifs a suffi à extraire prix, populations et dates.
  Leçon : réserver la lecture complète aux dossiers du cœur de compétence (ports-shipping, fishing,
  reg-europe, brands, tech).
- **Les 5 recherches web ont toutes rendu un fait décisif** :
  1. EMSWe / règlement (UE) 2019/1239 applicable au 15/08/2025 → invalide le cœur de l'idée 7 (WasteDeck) ;
     c'est la correction la plus lourde de l'étude.
  2. Règlement (UE) 2025/2365 : seuil 1 500 t/an confirmé, certification réservée aux entreprises moyennes
     et grandes, dates 26/11/2025 – 16/12/2025 – 17/12/2027 – 17/12/2028.
  3. SOLAS 2026 : l'obligé est le capitaine ; **GISIS est alimenté par l'État du pavillon** → tue la
     promesse « déclaration en un clic conforme GISIS » de l'idée 1.
  4. Art. 48 du règlement 1224/2009 : la déclaration de perte d'engin existe depuis 2010 → le « pourquoi
     maintenant » de l'idée 2 est plus faible qu'annoncé.
  5. REP engins de pêche FR : accord volontaire État/profession, **aucun éco-organisme agréé** → l'acheteur
     désigné dans l'idée 2 n'existe pas en France.
- **Expliciter le sens de la note (e)** dans le document (5 = créneau libre, 1 = déjà fait gratuitement) :
  sans cela le tableau est ininterprétable, puisque le critère est formulé à l'envers dans la consigne.
- **Assumer une réserve éditoriale** plutôt que de forcer le classement : le total place EPR Atlas dans le
  top 3 alors que son impact océan est faible (2/5). Présenter les deux classements (business vs impact) est
  plus utile à l'orchestrateur qu'un arbitrage silencieux.

## Erreurs et frictions

- **`cat` de deux dossiers d'un coup a produit 90 KB** redirigés vers un fichier de résultats, donc une
  lecture inutile. Leçon : lire un fichier à la fois avec l'outil Read (formatage + numéros de ligne), ou
  `sed -n` par tranches, jamais deux gros fichiers concaténés.
- **Piège de nommage** : `findings.md` est bloqué pour cet agent, comme il l'a été pour `rivers-upstream`
  (qui a dû produire `dossier-rivers-upstream.md`). Vérifié en amont, pas d'incident.
- **Tentation de sur-vérifier** : quatre autres points méritaient une recherche (survie de l'amende 4 % du CA
  dans le texte final pellets, publication du rapport d'évaluation 2019/883 dû au 28/06/2026, moyenne UE
  réelle de déchets/100 m après le JRC 02/2025, accès public au module GISIS conteneurs). Budget épuisé :
  listés explicitement comme « non vérifiés » en fin de `verdict.md` plutôt que tranchés au jugé.

## Leçons transférables

- Sur un sujet réglementaire, la question qui casse le plus d'idées n'est pas « le texte existe-t-il ? » mais
  **« qui est l'obligé et par quel canal la donnée circule-t-elle ? »**. Trois idées sur douze (1, 7, 8)
  s'effondrent sur cette seule question, alors que leurs références et leurs dates étaient exactes.
- Deuxième question la plus destructrice : **une infrastructure publique gratuite et obligatoire occupe-t-elle
  déjà le créneau ?** (guichet unique EMSWe, journal de pêche fourni par l'État, bases OSPAR/EMODnet/TIDES,
  Green Fins Hub du PNUE). Elle a fait chuter les idées 7, 8 et 11.
- Les pièges juridiques sectoriels ne sont jamais dans les dossiers de recherche généralistes : secret des
  données de pêche (art. 112-113 de 1224/2009), licences AIS satellite, article 101 TFUE sur la mise en
  commun de données de sinistres, règlement notations ESG 2024/3005, interdiction EASA de survol des
  rassemblements. Ils doivent venir de la connaissance métier, et être signalés comme tels.
