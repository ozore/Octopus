# Mémoire de travail — tech-underwater-ai

Format : ligne "succès" ou "erreur" + leçon, au fil de l'eau. Budget WebSearch: 12 max pour toute la session (partagé).

## Log

- [init] Brief lu. Périmètre: vision sous-marine (datasets+modèles), photogrammétrie/3D, blanchissement/SCTLD,
  eDNA, acoustique passive, satellite/drone, sonar/ROV grand public, AIS/VMS, LLM rapports. + concurrents 2024-2026.
- [plan] 12 WebSearch max. Stratégie: regrouper par thème dense (2-3 sujets/requête), puis WebFetch libre sur
  pages officielles/GitHub/produits pour détails et sourcing précis. Compteur WebSearch tenu ci-dessous.

## Compteur WebSearch
0/12 utilisés au départ.

## Compteur WebSearch — mise à jour
12/12 WebSearch utilisés (budget épuisé). Sujets couverts par WebSearch:
1-2: CoralNet/FathomNet/BenthicNet/SQUIDLE (succès, source Nature Sci Data 2025 pour BenthicNet) + CoralSCOP/SAM (succès, github zhengziqiang/CoralSCOP, CVPR 2024)
3-4: Gaussian splatting sous-marin/photogrammétrie récifs (succès, revue arxiv 2502.20154 fév 2025) + SCTLD détection IA (résultats surtout génomique/micro-CT, peu de vision RGB pure — noté comme lacune)
5-6: eDNA marin coût/kits (résultats généraux, pas de prix précis — lacune, chiffres en estimation) + acoustique passive récifs (succès: hydrophone low-cost ~20-50 EUR, papier PMC 2025)
7-8: Allen Coral Atlas/Sentinel-2 seagrass (succès: résolution 5m coraux, 10m herbiers, limites profondeur eaux claires) + ROV/sonar grand public (succès: prix BlueROV2 ~3-6.5k$, Chasing M2 Pro 3459$, Fifish V6 2999$; peu de données spécifiques Garmin/Humminbird sur habitats benthiques — lacune, sourcé séparément)
9-10: AIS/GFW pricing (pas de prix publics trouvés — lacune, GFW gratuit pour API research/rate-limited) + concurrents ReefCloud/Coral Vita/Reefgen/Coral Maker/Ulysses/Fathom (succès, plusieurs montants de levées trouvés)
11-12: Sofar/Terradepth/Bedrock Ocean (succès partiel, Bedrock 25M$ série A-2) + Notilo Plus/Hydromea/Arribada/ReefOS/Vertical Oceans/Blue Ocean Gear (échec quasi total — passage à WebFetch direct sur sites produits)

Stratégie suite: WebFetch libre sur pages officielles (produits, datasets, github, arxiv) pour compléter sourcing précis
et dates, sans consommer de WebSearch supplémentaire.

## WebFetch — bilan
Succès: Allen Coral Atlas (methods, résolutions 3.125m Planet/10m Sentinel-2, profondeurs ~10-15m), CoralNet (7.6M sources,
5.68M images, 299M annotations, gratuit), FathomNet (MBARI, gratuit, ML-ready), BlueROV2 (prix officiel 4900$ base, 100m/300m
profondeur), CoralSCOP github (licence dans repo, CoralMask 38928 images/299557 masques, pré-entraînement 1.3M masques),
Global Fishing Watch API (gratuit avec inscription + attribution, pas de limite publiée clairement), Notilo Plus (iBubble +
Seasam ROV + Notilo Cloud IA, pas de prix public), Hydromea (LUMA/EXRAY/NAVIA, infrastructures immergées, pas récifs
naturels — pertinence limitée pour notre cas), Arribada (CIC UK, hardware open-source biologging, pas de produit récif
direct), Coral Vita (business model restauration-as-a-service + adoption dès 30$, levée 8M$ 2025), RF-DETR github (Apache
2.0 pour petits modèles, backbone DINOv2, temps réel, fine-tunable — pertinent pour détection sous-marine).

Échecs (404/403, lacunes documentées dans le dossier): naturemetrics.com/pricing, kelpwatch.org (contenu vide via fetch),
reeflifesurvey.com (403), coastalscience.noaa.gov page benthic (404), squidle.org (peu de détails), sofarocean.com/products
(404), chasing.com pages produits (404 — urls génériques introuvables). Chiffres eDNA et acoustique correctement sourcés
via WebSearch (papiers scientifiques) mais PAS de prix commerciaux publics trouvés pour kits/labo eDNA => marqués
"estimation" dans le dossier.

Leçon: pour les pages produits de startups (Chasing, Sofar, NatureMetrics, Reef Life Survey) le fetch direct échoue souvent
(404/403/anti-bot) — mieux vaut soit utiliser les résultats WebSearch existants (snippets) soit accepter la lacune plutôt
que de multiplier les tentatives (budget WebSearch déjà épuisé).

## Rédaction
Passage à la rédaction du dossier.md avec les faits collectés. Lacunes marquées explicitement. Toutes les capacités
matérielles portent "capacité vérifiée (source, date)" ou "capacité supposée" / "hypothèse non sourcée" selon les cas.

## Clôture
dossier.md rédigé (~370 lignes) avec les 6 sections requises (a-f). 12/12 WebSearch utilisés, ~20 WebFetch (environ
12 réussis, 8 échecs 404/403/vide notés ci-dessus et dans la section "lacunes" du dossier). Toutes les capacités
matérielles/logicielles étiquetées vérifiée/supposée/hypothèse non sourcée ; chiffres eDNA et quelques prix ROV
secondaires marqués "estimation". Lacune majeure signalée explicitement : pas de preuve scientifique d'une détection
SCTLD fiable par simple photo RGB (littérature = génomique/micro-CT uniquement) — à ne pas vendre comme diagnostic.
Note de transparence ajoutée : "Vertical Oceans" semble être une aquaculture de crevettes (Singapour), pas un acteur
benthique — possible erreur dans la liste de concurrents du brief.

## Résumé final (voir aussi fin de dossier.md)
5 opportunités retenues : ReefLens PNW (vision/CoralSCOP-RF-DETR sur photos de plongée existantes), SentinelWake
(GFW API + polygones habitats pour alertes chalutage/mouillage), SplatReef (Gaussian splatting sous-marin comme
preuve MRV pour crédits biodiversité), SoundReef Alert (hydrophones 50€ + IA soundscape), TrawlWatch Insurance
Feed (licence de données B2B pour assureurs/certificateurs). Priorité 3-6 mois : ReefLens PNW et SentinelWake
(barrière matérielle nulle, données/modèles ouverts déjà disponibles, accès terrain du fondateur déjà acquis).
