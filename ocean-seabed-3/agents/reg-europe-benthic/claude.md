# Mémoire agent reg-europe-benthic

## Plan
1. Lire BRIEF.md - fait.
2. Rechercher (budget 12 WebSearch, WebFetch libre) :
   - Règlement restauration nature 2024/1991 (marin, D6, échéance 1 sept 2026)
   - MSFD D6 décision 2017/848, seuils 2024-2026
   - Plan d'action pêche 2023 (chalutage fond AMP)
   - Directive Habitats/Natura 2000 mer (évaluations appropriées)
   - Règlement pêche eaux profondes 2016/2336, VME
   - France : décret mouillage posidonie, arrêtés préfectoraux, ZMEL, Donia
   - Espagne/Italie/Grèce mouillages
   - UK : Marine Net Gain, BNG 2024, MMO byelaws chalutage MPA
   - Norvège coraux eau froide / pétrole
   - Crédits carbone bleu posidonie/herbiers Europe
   - Chiffres : sites Natura 2000 marins, ports, éoliennes offshore, yachts Méditerranée, budgets LIFE/FEAMPA
   - Acteurs/prix : bureaux d'études, logiciels, apps mouillage (Donia etc.)
3. Rédiger dossier.md (tableau, fiches, populations captives, acteurs/prix, 4-6 opportunités, références/lacunes)
4. Finaliser claude.md avec résumé 15 lignes.

## Compteur WebSearch : 12/12 (budget épuisé, tout le reste via WebFetch)

## Journal
- succès : recherche "Nature Restoration Regulation 2024/1991 marine targets" -> climate-laws.org, eunews.it, environment.ec.europa.eu confirment échéance plans nationaux 1er sept 2026 (draft) et statut 7/27 pays à l'heure.
- erreur : WebFetch sur eur-lex.europa.eu/eli/reg/2024/1991/oj a résumé une fausse date d'échéance "31 décembre 2025" pour les plans nationaux (art. 5) — contredite par 3 sources indépendantes (climate-laws.org, environment.ec.europa.eu news du 2026-09-01, eunews.it) donnant 1er septembre 2026. Leçon : le petit modèle de résumé WebFetch peut halluciner des dates sur de longs textes juridiques ; toujours croiser avec au moins une deuxième source avant de trancher. Retenu : 1er septembre 2026.
- succès : recherche D6/seafloor integrity -> confirmé seuil D6C4 (perte d'habitat ≤2%) adopté juin 2023 par les Directeurs marins ; D6C5 (perturbation physique) toujours en cours (ateliers ICES WKBENTH, dernier "WKBENTH4" publié 2026) -> pas encore de seuil formel adopté au 7/9/2026 = vraie lacune règlementaire à exploiter commercialement.
- succès : Plan d'action pêche 2023 (chalutage AMP) bien documenté par Oceana/Seas At Risk/BirdLife : échéance mars 2024 (AMP protégeant les fonds), 2030 (toutes AMP), opposition Allemagne/Espagne/Portugal/Italie/Irlande/Danemark.
- succès : premar-mediterranee.gouv.fr + boatcible.com -> détail fin des textes français (arrêté-cadre 123/2019, arrêtés départementaux 2020/2024, décret 157/2024, amendes 15k-150k€ + préjudice écologique, jugement TM Marseille 22/11/2024).
- erreur : plusieurs WebFetch 404/503 (gov.uk MPA page, marinemanagement.org.uk, andromede-oceanologie.com domaine incorrect, icomia détails pays limités) -> contourné avec sources alternatives (geographical.co.uk, mongabay, ICOMIA générique). Chiffres UK obtenus quand même (377 AMP, 38 protégées, 20 600h chalutage 2024, 13 AMP protégées mars 2024, refus interdiction totale sept 2025, ~30 000km² proposés sur 42 AMP offshore).
- erreur : Norvège — aucun texte réglementaire récent (2024-2026) trouvé spécifiquement sur les coraux d'eau froide vs pétrole ; seule donnée : pause exploration minière profonde jusqu'à 2029 et expansion continue de l'exploration pétrolière (APA 2025, 57 licences 2026). LACUNE documentée dans le dossier.
- erreur : chiffre "nombre de ports" et "nombre de parcs éoliens avec surveillance benthique obligatoire" introuvables de façon agrégée (WindEurope derrière login SSO) -> estimation raisonnée marquée comme telle dans le dossier.
- succès : chiffre WWF 179 000 bateaux mouillés sur herbiers méditerranéens en 2024 (~45% >24m), cité par Swiss Ocean Tech 2026 — bon chiffre de marché pour les opportunités produit.
- succès : FEAMPA 2021-2027 = 6,108 Md€ total (France 567 M€) ; LIFE 2021-2027 = 5,45 Md€ total (3,5 Md€ volet environnement incluant nature/biodiversité, 1,9 Md€ climat).

## Résumé final (voir dossier.md section Opportunités) — 15 lignes max
1. Marine Compliance Cockpit : suivi automatisé des obligations Natura 2000/DCSMM/Restauration pour ports et développeurs éoliens offshore (évaluations appropriées art. 6§3), IA sur imagerie ROV/sonar + base réglementaire par État membre.
2. Seafloor Loss Tracker : mesure indépendante du seuil D6C4 (perte ≤2%) et future D6C5 (perturbation) à partir d'imagerie satellite/sonar bas coût, vendu aux autorités DCSMM et ONG de contentieux (Oceana, ClientEarth) qui poursuivent les États en retard.
3. Posidonia Compliance Layer : couche de preuve horodatée (photos avant/après ancrage, IA de détection de traces de chaîne) pour ports de plaisance et ZMEL français/espagnols/italiens, exploitant l'échelle des amendes 2024-2026 et le jugement TM Marseille du 22/11/2024 qui crée une présomption de préjudice.
4. Blue Carbon MRV Posidonia : mesure et vérification automatisées (drone + IA) pour les méthodologies françaises (label bas-carbone) et espagnoles (Andalusian Carbon Standard) de crédits carbone bleu, marché naissant 2025-2026 (ARCHIPEL, ARTEMIS).
5. VME Watch : cartographie et alertes de proximité des zones fermées VME (règl. 2016/2336, exéc. 2022/1614) pour armateurs de pêche profonde et affréteurs, évite les amendes et pertes de licence.
6. National Restoration Plan Data Room : plateforme de reporting/monitoring pour consultants aidant les 20 États membres en retard sur leur plan national de restauration marine (échéance 1/9/2026 manquée) à produire les données Annexe II (posidonie, maërl, récifs) exigées par la Commission.
Premier client atteignable : bureaux d'études existants (Andromède Océanologie, Ecocéan) ou ports de plaisance méditerranéens via visio depuis Vancouver ; pas de présence physique requise pour un MVP data/logiciel.
