# Mémoire de travail — agent critic-tech

Rôle : CTO / architecte IA et données. Mission : évaluer techniquement les 12 idées d'IDEAS.md.
Date : 2026-09-05.

## Ce qui a fonctionné
- Lecture intégrale de `IDEAS.md` (117 l.), puis lecture ciblée de
  `agents/tech-landscape/findings.md` (169 l.) par tranches — la grille d'effort (section d) et
  le tableau des données (section c) sont les deux artefacts les plus réutilisables du dossier :
  ils ont servi de base à toutes mes estimations d'effort et de coût.
- Repère de coût retenu : 8-12 k€/mois-ingénieur chargé (source : tech-landscape, marqué comme
  estimation non sourcée). J'ai propagé cette incertitude en donnant systématiquement des
  fourchettes, jamais un point.
- Grep ciblé sur `agents/ports-shipping/findings.md` pour SafeSeaNet/GISIS/AIS : plus efficace
  que la lecture complète.
- 2 recherches web (budget autorisé : 5), toutes deux décisives :
  1. **GISIS / conteneurs perdus** : c'est **l'État du pavillon** qui téléverse dans le module
     GISIS après réception du rapport du capitaine ; le navire rapporte aux navires voisins, à
     l'État côtier et à l'État du pavillon. Il n'existe donc **pas d'API d'écriture GISIS pour un
     navire** → la promesse « déclaration en un clic conforme GISIS » de l'idée 1 est
     architecturalement fausse. Fait le plus important du rapport.
     Sources : safety4sea.com, seatrade-maritime.com, worldshipping.org, marineinspection.app.
  2. **AIS 2026** : consolidation du marché (Kpler détient MarineTraffic + FleetMon + Spire ;
     S&P a repris ORBCOMM), bascule vers des tarifs entreprise ; ordres de grandeur relevés :
     MarineTraffic 200-500 $/mois, Spire 2 000-8 000 $/mois, Datalastic à partir de 99 €/mois.
     Impact direct sur les idées 10 (NurdleRisk), 7 (WasteDeck) et 1 (DriftBox).
     Sources : usesentinel.io, datadocked.com, worldwideais.org, vesselfinder.com.

## Erreurs / frictions
- Premiers `cat` de BRIEF.md + findings.md en une seule commande : sortie tronquée et redirigée
  vers un fichier de résultats (43 Ko puis 40 Ko). Leçon : sur ce harnais, lire les gros
  markdown par tranches de 40-85 lignes avec l'outil Read plutôt que `cat` intégral.
- `grep -o ".\{0,220\}GISIS.\{0,220\}"` n'a rien renvoyé alors que `grep -il` trouvait le fichier :
  motif multi-octets/accents. Leçon : privilégier `grep -n` + `cut -c1-260`.

## Jugements structurants posés (à assumer en cas de contestation)
- **La colonne « dépendance » est un risque** : note haute = mauvais. Signalé deux fois dans le
  verdict pour éviter une lecture inversée par l'orchestrateur.
- Trois promesses techniquement infondées ont été explicitement démontées :
  (a) « déclaration GISIS en un clic » (idée 1) — le canal passe par l'État du pavillon ;
  (b) « satellite pour le score de propreté des plages » (idée 8) — Sentinel-2 à 10 m/pixel ne
      détecte que des accumulations denses de plastique flottant en mer (domaine MARIDA), pas des
      déchets sur le sable ; seul le drone tient ;
  (c) « prédiction de dérive dernier kilomètre en bassin portuaire » (idée 6) — la résolution
      Copernicus régionale (~2-3 km) est inutilisable sur 500 m de bassin.
- Deux verrous non techniques mais fatals identifiés : APIs fermées des fabricants de robots
  (idée 6) et coût d'intégration **linéaire par pays** (idées 7 et 12), qui casse la marge SaaS.
- Idée 3 (PelletGuard) : détection vision de granulés de 2-5 mm translucides = problème de
  recherche ouvert, TACO/AquaTrash ne contiennent pas de pellets. Contournement recommandé :
  détecter l'événement-proxy (big-bag éventré, raccordement non conforme) plutôt que le granulé.
- Idée 10 (NurdleRisk) : rejet statistique — quelques dizaines d'événements/an à queue lourde
  n'autorisent aucun apprentissage ; relève des valeurs extrêmes, pas du ML.

## Verdict rendu
- Fichier : `verdict.md` (nom `findings.md` volontairement évité, contrainte du mandat).
- Top 3 techno : 9 RiverEye · 8 CleanScore · 2 GearTrace.
- Bottom 3 techno : 10 NurdleRisk · 11 DiveLedger · 7 WasteDeck.
- Mention : 3 PelletGuard = plus grand écart promesse/réalité, mais SaaS sain.

## Leçons pour un prochain cycle
- Ne jamais accepter le mot « satellite » sans vérifier la résolution contre la taille de l'objet :
  c'est le raccourci le plus fréquent de ce dossier et il apparaît dans 4 idées sur 12.
- Toute idée dont l'actif est un registre tiers sans API (idée 5) doit être dé-risquée par un
  scraper jetable **avant** toute autre dépense : c'est le seul test d'existence du produit.
- Point non traité faute de mandat : la faisabilité juridique du scraping des registres de crédits
  plastique (CGU, droit sui generis des bases de données) — à confier à un agent juridique.
