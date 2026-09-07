# Mémoire de travail — agent critic-tech-2 (seconde passe)

Rôle : CTO / architecte IA & données. Mission : critique technique des 12 idées de
`ocean-plastic-2/IDEAS.md`, pour un fondateur SEUL développant avec Claude. Date : 2026-09-06.

## Journal

- **Succès** — Lecture intégrale de `ocean-plastic-2/IDEAS.md` (221 l.) et de `BRIEF.md` (fondateur :
  Vancouver, plongeur, bootstrap < 25 k$ CAD, solo temps plein).
- **Erreur** — `cat` intégral de `agents/tech-detection/dossier.md` (43,6 Ko) : sortie tronquée et
  redirigée vers un fichier de résultats. Leçon (déjà notée au cycle 1, redécouverte) : lire les gros
  markdown par tranches avec l'outil Read (offset/limit), jamais par `cat`.
- **Succès** — `grep -n "^#"` pour obtenir le plan d'un gros fichier avant de lire la bonne tranche :
  a permis d'isoler la grille d'effort de `ocean-plastic/agents/tech-landscape/findings.md`
  (section d, lignes 73-86) en une seule lecture.
- **Repère de coût retenu** (source : tech-landscape, marqué estimation) : 8-12 k€/mois-ingénieur
  chargé pour une ÉQUIPE. Décision structurante : je ne reprends PAS ce repère tel quel, car le
  mandat porte sur un fondateur seul non salarié. Je convertis en deux grandeurs distinctes :
  (1) l'effort en m-i « équipe » de la grille, (2) le temps calendaire solo, avec un facteur de
  conversion assumé de ~1,6 (un solo avec Claude produit vite du code mais absorbe seul l'intégration,
  le terrain, le support et la vente : ~0,6 m-i utile par mois calendaire). Documenté dans verdict.md.
- **Décision** — Le « coût MVP k$ CAD » que je chiffre EXCLUT le salaire du fondateur (il est
  bootstrap, son temps n'est pas une sortie de trésorerie) et n'inclut que : matériel du commerce,
  API/cloud, données payantes, analyses de laboratoire, déplacements, assurances/licences. C'est la
  seule lecture compatible avec la contrainte « bootstrap < 25 k$ CAD » du BRIEF.

## Recherches web (3 sur 4 autorisées)

1. **Succès, la plus décisive** — « open source parser Lowrance SL2 SL3 Humminbird Garmin RSD sonar log
   format python ». Résultat : **PINGVerter / PINGMapper** (Cameron Bodine) décodent Humminbird
   `.DAT/.SON/.IDX`, Lowrance `.sl2/.sl3`, **Garmin `.RSD`** et Cerulean ; plus `sonarlight`,
   `python-sllib`, SL3Reader. Conséquence : le poste réputé le plus dur de l'idée 1 (formats
   propriétaires) est **déjà résolu et gratuit** → c'est ce qui fait passer GhostSonar en tête.
   Effet secondaire : le **Deeper** n'a pas sa place dans la liste (sondeur vertical castable, pas de
   side-scan) → première promesse fausse identifiée.
2. **Succès** — « handheld NIR spectrometer polymer identification price 2026 ». Sous 10 k$ on ne
   trouve que du 900-1 700 nm (Sagitto ≈ 2 750 US$) : insuffisant pour PA6/PA6,6 et inopérant sur le
   plastique noir ; la plage utile (2 500 nm, NeoSpectra) est bien plus chère ; trinamiX reste sur
   devis. → invalide le « 3-8 k$ » de l'idée 10 et fixe sa note budget à 2.
3. **Succès** — « MP-VAT Nile red false positives limitations ». Écart de comptage **jusqu'à 421 %**
   entre Nile red et Raman selon la granulométrie ; faux positifs sur chitine, lignine, cuticules.
   → démonte le « 95,8 % de précision » de l'idée 7 et la reclasse en pré-criblage, pas en conformité.
4. Quatrième recherche **non utilisée** : les points restants (règles drone TC/FAA, licence AGPL
   d'Ultralytics, résolution HYCOM/Copernicus) relèvent de connaissances stables, pas d'un fait daté.

## Jugements structurants (à assumer en cas de contestation)

- **La colonne « dépendance » se lit à l'envers** (5 = mauvais). Signalé deux fois dans verdict.md.
- **Score techno = faisab. + (6 − dépendance) + IA + défendabilité + budget**, sur 25. Volontairement
  aveugle à la taille de marché et au prix de vente : ce n'est pas mon axe.
- **Coût MVP hors salaire du fondateur.** Décision assumée : il est bootstrap, son temps n'est pas une
  sortie de trésorerie. Sinon toutes les idées seraient à 100 k$+ et la colonne perdrait son pouvoir
  discriminant.
- Trois idées (6 StormDebris, 8 TireWatch, 11 FiberScore) **crèvent le plafond de 25 k$ CAD du BRIEF
  avant le premier client** — c'est le critère le plus dur du mandat et il élimine seul ces trois.
- Deux idées (3 NetPen, 12 HullCycle) sont **techniquement triviales** (CRUD) : elles ne sont pas dans
  le bottom 3 techno, mais leur risque commercial est pire que celui de TireWatch (3 clients au monde ;
  appel d'offres APER clos le 21/08/2026). Noté explicitement pour éviter une mauvaise lecture.
- **Correction produit la plus utile du rapport** : sur FloatWatch, la mousse conforme est encapsulée
  et se trouve SOUS le ponton → le drone est le mauvais capteur, l'inspection est sous-marine, ce qui
  transforme la compétence de plongeur du fondateur en barrière à l'entrée.

## Verdict rendu

- Fichier : `verdict.md` (noms `findings/report/summary/analysis` volontairement évités).
- Top 3 techno : **1 GhostSonar (23) · 4 FloatWatch (21) · 9 CoastalTrace (20)**.
- Bottom 3 techno : **6 StormDebris (9) · 11 FiberScore (9) · 8 TireWatch (12)**.
- 20 promesses corrigées : 8 fausses, 7 exagérées, 5 transversales (dont : effort m-i repris d'une
  grille « équipe » sans conversion solo, absence totale de la réglementation drone, licence AGPL
  d'Ultralytics YOLO, et « aucune concurrence » lu comme un signal négatif dans 3 cas).

## Leçon pour un prochain cycle

Le facteur le plus discriminant entre les 12 idées n'a été ni l'IA ni le marché : c'est **la nature du
chemin critique**. Quand il est logiciel, un fondateur seul avec Claude va très vite (idées 1, 2, 4, 9,
12). Quand il est chimique, métrologique ou matériel (7, 8, 10, 11), Claude n'accélère rien et le
bootstrap explose. Poser cette question en premier, avant toute notation, ferait gagner un cycle.
