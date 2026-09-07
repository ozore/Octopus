# Mémoire de travail — agent armateurs-assureurs

## Consignes clés (relues depuis BRIEF.md)
- Population + 5 candidats (12 lignes max chacun) + références + lacunes → `dossier.md`.
- Max 10 WebSearch (quota partagé), WebFetch libre.
- N'écrire que dans agents/armateurs-assureurs/. Pas de code, pas de commit. Français, acronymes définis.
- Étiqueter chaque capacité IA « vérifiée (source) » ou « supposée ».
- Ne pas lire d'autre dossier du dépôt (consigne de la tâche, au-delà du brief).
- 2 échecs de recherche → reformuler ou WebFetch. Chiffre introuvable → fourchette « estimation ». Pas de question.

## Hypothèses de départ (à vérifier)
1. Collisions avec baleines / cétacés — vitesse, alertes acoustiques (programme ECHO à Vancouver, Whale Safe Californie), circulaires P&I.
2. Bruit sous-marin rayonné (URN) — notations classification (DNV Silent, BV, LR, ABS), programme ECHO Vancouver (incitatifs tarifaires portuaires).
3. Biofouling / espèces envahissantes — Nouvelle-Zélande (CRMS biofouling), Californie (biofouling regs), lignes directrices IMO 2023, inspection coque par vidéo/plongeur.
4. Pertes de conteneurs en mer — rapports World Shipping Council (WSC), assurance cargaison/coque.
5. CII (Carbon Intensity Indicator, indice IMO d'intensité carbone) / EU ETS (Emissions Trading System, marché européen du carbone) / FuelEU Maritime — coûts de conformité, reporting MRV (Monitoring Reporting Verification).
6. Ancrage sur habitats (herbiers de posidonie Méditerranée) — surveillance satellite, amendes (Baléares, France).
7. Sinistres environnementaux / réponse aux déversements — imagerie satellite (EMSA CleanSeaNet).

## Compteur de recherches WebSearch (max 10)
10/10 UTILISÉES (quota épuisé). Toute recherche additionnelle = WebFetch uniquement à partir d'ici.

## Journal des recherches (les 10 WebSearch, dans l'ordre)
1. "Allianz Safety and Shipping Review 2025 report" → OK. 27 pertes totales en 2024 (record bas, -75% en 10 ans), 3310 incidents (+10%), câbles sous-marins endommagés = risque émergent, marins abandonnés record (312 navires, 3133 marins). Utile pour cadrage général, pas un candidat en soi.
2. "ECHO program Port of Vancouver underwater noise incentive vessel quiet" → OK, très riche. ECHO = Enhancing Cetacean Habitat and Observation, Vancouver Fraser Port Authority, depuis 2017. EcoAction Gold = -47% droits portuaires, Bronze = -23%, pour navires avec notation "quiet ship" ou technologie anti-cavitation. JASCO Applied Sciences opère la station d'écoute Boundary Pass. Rapports annuels PDF disponibles (2022, 2023).
3. "World Shipping Council containers lost at sea 2024 report" → OK. 576 conteneurs perdus en 2024 (vs 221 en 2023, record bas ; moyenne 10 ans = 1274). SOLAS amendé par le Comité de la sécurité maritime de l'OMI (MSC) : déclaration obligatoire de TOUS les conteneurs perdus en mer à partir du 1er janvier 2026 (donc en vigueur depuis 8 mois à la date du dossier).
4. "FuelEU Maritime EU ETS CII compliance cost shipowners 2026 penalty" → OK, chiffres forts. Pénalité FuelEU ≈ 640 €/tCO2e ; EUA (quota EU ETS) 75-85 €/t en 2026 ; exemple porte-conteneurs moyen à Rotterdam 150 escales/an : 2,3 M€ de pénalités OU 450 k€/an de surprime biocarburant OU 1,8 M€ de rétrofit. Rapports vérifiés de consommation/intensité dus le 31 janvier 2026, attestations de conformité dues avril 2026 (= vient de se produire). Outils concurrents repérés : OceanScore, MarineAware, qaship.net, cse-net.org, shipfinex.com.
5. "biofouling hull inspection compliance cost New Zealand California invasive species vessel" → OK. NZ : Craft Risk Management Standard (CRMS) mis à jour oct. 2023, nouvelles exigences biofouling en vigueur depuis le 13 avril 2025 (récent). Sanctions : expulsion, restrictions d'itinéraire. Californie : Annual Vessel Reporting Form (AVRF) via plateforme MISP.IO. Sources P&I : North Standard, Steamship Mutual (Steamship P&I) — confirment le durcissement réglementaire.
6. "Posidonia seagrass anchoring fine satellite Mediterranean yacht" → OK. France : mouillage interdit aux navires >24 m dans les herbiers de posidonie (loi 2020), amendes jusqu'à 150 000 €/personne à bord + 1 an de prison + retrait de licence. Imagerie satellite optique haute résolution nécessaire (l'AIS et le satellite basse résolution sont insuffisants) pour détecter les petits bateaux au mouillage — étude ScienceDirect 2024 le confirme explicitement (limite citée).
7. "Gard P&I club whale strike vessel collision liability circular speed" → OK. Gard (club P&I norvégien) : ralentir de 20-25 nœuds à 12-13 nœuds réduit le risque de collision d'environ 30%, à 10 nœuds environ 40%. P&I couvre la responsabilité envers les tiers (collision), distinct de l'assurance corps (H&M, Hull & Machinery).
8. "DNV underwater radiated noise notation Silent class ship survey cost" → OK partiel. DNV a créé le premier système de notation bruit sous-marin en 2010, 5 notations SILENT (R, E, S, etc.). Coût de la certification non trouvé publiquement (à traiter comme lacune).
9. ""ESG" OR "environmental compliance" analyst job shipping company fleet decarbonisation" → OK, qualitatif. Confirme la demande de postes ESG/conformité/décarbonation chez les armateurs, liée à EU ETS, CII, EEXI (Energy Efficiency Existing Ship Index), Poseidon Principles (alignement du financement naval sur les objectifs de décarbonation de l'OMI — levier bancaire).
10. "Whale Safe Benioff Ocean whale alert app vessel speed free existing tool" → OK. Whale Safe (Benioff Ocean Science Laboratory, UCSB) : IA combinant AIS + détection acoustique + visuelle + modèles d'habitat, Santa Barbara/San Francisco, gratuit pour le public. Whale Alert app gratuite (iOS/Android, sciences citoyennes, depuis 2012). Ocean Wise Whale Report Alert System (WRAS) — organisation basée à Vancouver, système d'alerte pour la Colombie-Britannique. Tous gratuits → nécessité de bien différencier un futur produit payant.

## Sources mortes / échecs
Aucun échec total (0 reformulation nécessaire). Coût précis de la certification DNV Silent non trouvé via WebSearch — laissé en lacune / à WebFetch si le temps le permet.

## Décisions
- Quota WebSearch épuisé après la recherche 10. Passage à WebFetch (libre) pour approfondir : ECHO Vancouver, WSC/SOLAS conteneurs, OceanScore (EU ETS/FuelEU/CII), P&I biofouling (North Standard/Steamship Mutual), Gard baleines, Posidonia/ICOMIA.
- 5 candidats retenus pour dossier.md (à trancher parmi 6-7 pistes) : (1) bruit sous-marin/ECHO Vancouver+notation classification, (2) collisions cétacés, (3) biofouling/espèces envahissantes, (4) pertes de conteneurs (nouveau mandat SOLAS 2026), (5) CII/EU ETS/FuelEU (optimisation + reporting MRV). Posidonia/mouillage sur habitats mis en réserve (6e piste, moins "armateur cargo" que yacht/plaisance) si un des 5 s'avère trop faible en 12 lignes.
