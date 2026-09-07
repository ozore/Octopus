# Mémoire de travail — agent ports-terminaux

## Mandat (résumé)
Trouver 5 problèmes réels et payés chez autorités portuaires, terminaux, pilotes, remorqueurs,
dragueurs, gestionnaires de chenaux (Am. du Nord + Europe) touchant l'océan, où l'IA 2025-2026
permet un produit impossible en 2024. Max 10 WebSearch, WebFetch libre. Écrire uniquement ici.
Livrable : dossier.md (fait, voir ce dossier).

## Compteur de recherches WebSearch
**10 / 10 utilisées — quota épuisé.** Ne plus appeler WebSearch. WebFetch reste libre.

Liste des 10 requêtes WebSearch, dans l'ordre :
1. "protected species observer" pile driving dredging day rate cost job posting 2025 → très bon (tarifs horaires, projets nommés)
2. Vancouver Fraser Port Authority ECHO program budget funding partners underwater noise whales → bon (3,2 M$ CAD Transports Canada/2 ans, 100+ partenaires)
3. "sea turtle" relocation trawling dredging contract cost USACE hopper dredge → excellent (coûts chiffrés précis)
4. Green Marine certification fee schedule cost annual verification price PDF → partiel (structure oui, montants non)
5. California biofouling regulation vessel inspection hull ports OR Transport Canada biofouling guidance → très bon
6. CanadaBuys OR MERX OR SAM.gov tender "environmental monitoring" port dredging OR hydroacoustic OR marine mammal 2025 → moyen (1 tender DFO/MPO trouvé, + tenders UK trouvés en bonus)
7. port terminal job posting "environmental coordinator" OR "compliance coordinator" Green Marine annual report data → bon (Everport, Port of Long Beach)
8. JASCO Applied Sciences OR SMRU Consulting passive acoustic monitoring ECHO program Vancouver whales contract → bon (confirme prestataires existants)
9. ThermalTracker OR AI thermal camera marine mammal detection offshore construction monitoring existing product → important (révèle concurrents : WhaleSpotter, ThermalTracker-3D, SEA.AI, Seiche)
10. AI computer vision hull biofouling rating detection startup 2025 → important (révèle concurrents : Vesselity, Atlantic Tech & Candy/HullVAR, article arxiv 2503.12875)

**Leçon clé** : les recherches 9 et 10 (concurrence) ont changé l'angle des candidats 1 et 5 — la
détection IA brute existe déjà chez des tiers ; il faut requalifier vers la couche « conformité
réglementaire automatisée » ou le segment acheteur non desservi (régulateur vs armateur). Toujours
faire une recherche "concurrents existants" AVANT de figer un candidat, pas après.

## Sources mortes / blocages techniques
- **portvancouver.com : bloqué systématiquement en WebFetch (HTTP 403)**, y compris le PDF du
  rapport annuel ECHO 2024 (URL testée : /media/documents/echo-program-annual-report-2024).
  Toutes les infos ECHO/EcoAction viennent donc de snippets de résultats WebSearch (secondaire),
  jamais d'une lecture primaire. Si une prochaine passe a du budget WebSearch, chercher le contenu
  du rapport annuel ECHO via des requêtes ciblées plutôt que WebFetch direct sur ce domaine.
- **PDF Green Marine (certification_policy.pdf) et PDF CSLC (guidance biofouling)** : WebFetch les
  a récupérés mais n'a pas pu en extraire le texte (rendu binaire/police illisible par l'outil).
  Les montants exacts des frais Green Marine et la grille de notation biofouling CSLC restent
  introuvables cette session — pas un échec de recherche, un échec d'extraction PDF.
- **www.epa.gov/vessels-marinas-and-ports/ballast-water-management** → HTTP 404 (URL devinée
  fausse). **www.fisheries.noaa.gov/national/marine-mammal-protection/protected-species-observers**
  → HTTP 404 (URL devinée fausse). Ces deux échecs sont arrivés tôt et ont fait pivoter la
  stratégie vers WebSearch plutôt que deviner des URL EPA/NOAA.
- Thème **eaux de ballast** jamais repris après ces deux 404 — quota épuisé avant d'y revenir.
  Vraie lacune, pas un choix délibéré.
- Thème **pilotes maritimes / remorqueurs** (population, appels d'offres, offres d'emploi) jamais
  cherché spécifiquement — priorité donnée aux dragueurs/PSO/biofouling qui avaient plus de signal
  a priori. Lacune assumée, documentée dans dossier.md.

## Ce qui a bien marché
- Deviner des URL institutionnelles connues (green-marine.org) et les WebFetch directement AVANT
  de dépenser du WebSearch → a fonctionné pour Green Marine, gratuit.
- Chercher les offres d'emploi réelles (ziprecruiter, schmidtmarine job board) pour obtenir des
  tarifs horaires concrets → bien plus efficace que chercher des rapports annuels pour trouver des
  chiffres de coûts.
- Chercher explicitement "existing product / startup 2025" pour chaque candidat avant de le figer
  → a évité de proposer deux candidats déjà couverts par des produits IA existants sans le savoir.
- Chercher un article scientifique récent directement par mots-clés a mené à un article de mars
  2025 avec une section limites très exploitable (arxiv 2503.12875) — correspond exactement à la
  consigne du brief sur les sections "limites" d'articles 2024-2026.

## Résumé final (pour l'agrégateur)

5 candidats livrés dans dossier.md, tous en Amérique du Nord (+ 2 pistes Europe/UK en candidat 4) :
(1) Sentinelle-PSO — vision IA jour/nuit pour observateurs de mammifères marins pendant battage de
pieux ; (2) Trawl-Predict — prévision de présence de tortues marines + sonar pour cibler le
chalutage de relocalisation en dragage USACE ; (3) Green Marine Copilot — agent LLM qui rédige
l'autoévaluation environnementale annuelle et le dossier de vérification biennale ; (4) Quiet
Fairway — version accessible du modèle ECHO/VFPA (IA + AIS + acoustique) pour les ports/estuaires
qui ne peuvent pas se payer un JASCO/SMRU sur mesure (demande confirmée par 2 appels d'offres UK
2025) ; (5) HullAudit — audit IA du biofouling déclaré, côté régulateur/port plutôt que côté
armateur (où Vesselity/HullVAR sont déjà installés). Coûts humains chiffrés et vérifiés pour PSO et
chalutage de tortues ; montants Green Marine et ECHO/JASCO non trouvés (PDF illisible, portvancouver
bloqué). Concurrents IA identifiés pour candidats 1, 4, 5 → nouveauté repositionnée sur la couche
conformité/régulateur, pas la détection brute. Lacunes principales : eaux de ballast, pilotes/
remorqueurs, montants exacts de plusieurs programmes — non couverts, quota WebSearch épuisé (10/10).
