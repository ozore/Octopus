# Mémoire agent tech-detection

## Plan
Brief lu (BRIEF.md ocean-plastic-2), IDEAS.md (12 idées exclues) lu, findings.md tech-landscape lu
(déjà couvert : MARIDA/satellite, TACO/YOLO, OceanParcels, EDITO, crédits plastique — je réutilise
la grille d'effort de ce fichier, section d, sans la refaire).

Budget WebSearch : 12 max pour toute la mission. Répartition prévue :
1. sonar/sondeurs grand public + datasets sonar ouverts + ghost gear
2. petits ROV (Chasing/QYSEA/BlueROV2) + prix
3. microscopie/spectroscopie microplastiques (Nile red, FTIR, Raman) + SB 1422 + siMPle/MP-VAT/Purency
4. NIR portables (trinamiX, SCiO, Specim) prix/précision
5. drones DJI + xBD + NOAA post-storm + ERMA
6. caméras thermiques/LiDAR bon marché berges
7. capteurs particules de pneus eaux pluviales (6PPD-quinone, tire wear)
8-12: réserve pour compléments / concurrents prix

## Journal
- succès : GhostVision (MDPI 2026) trouvé directement — framework open source sonar consommateur + YOLO, 3110 images annotées. Bonne base pour brique 1.
- succès : Fish-Finders for Stewardship (U Delaware/Art Trembanis) — cas concret sonar grand public + 450 casiers retirés, 1500 acres couverts.
- succès : GGGI Signature PNW (ghostgear.org) via WebFetch — chiffres précis 2023-2025 (kg retirés par site) malgré absence de budget explicite.
- succès : siMPle via plastiverse.org bloqué (Cloudflare) mais simple-plastics.eu/about.html a donné licence gratuite + développeurs (Aalborg + AWI).
- erreur : mdpi.com/2077-1312/14/10/951 (GhostVision) renvoie 403 en WebFetch direct — contourné en gardant le résumé du WebSearch initial (suffisant).
- erreur : bill text SB 1422 (leginfo.legislature.ca.gov) ne contient pas la date "fall 2026" ni le coût par échantillon — cette date vient de sources secondaires (rouxinc.com incomplet aussi) ; marqué comme non confirmé au texte de loi.
- erreur : trinamiX solidscanner.com page tronquée par WebFetch (contenu trop long) — prix PAL One/Two non trouvés malgré 2 tentatives ; marqué hypothèse non sourcée.
- erreur : NOAA marinedebris.noaa.gov page Northwest Straits renvoie 403 en WebFetch — chiffres cumulés (5800 filets, 7500 casiers, 870 acres) recyclés depuis le résumé WebSearch qui avait pu lire le extrait.
- 12/12 WebSearch utilisés (budget agent atteint). Reste du travail fait en WebFetch libre.
- Specim IQ et FX50 : pas de prix public trouvé (marché B2B sur devis) — connu génériquement (Specim IQ ~30-40k$ estimation non sourcée cette session) à traiter avec prudence.
- Aucun capteur commercial 6PPD-quinone / particules de pneus identifié — vrai vide technologique confirmé par 2 sources (USGS Oregon, ACS ES&T Water) : méthodes labo uniquement (SPE-HPLC-MS/MS, MIMS), capteurs terrain encore au stade recherche (host-guest fluorescence).
