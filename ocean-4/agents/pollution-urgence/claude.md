# Mémoire de travail — agent pollution-urgence

## Consigne
Brief lu : /home/user/Octopus/ocean-4/BRIEF.md (2026-09-07). Aucun autre dossier du dépôt lu.
Livrable : /home/user/Octopus/ocean-4/agents/pollution-urgence/dossier.md (fait).

## Compteur WebSearch
10 / 10 utilisées (quota épuisé). WebFetch utilisé librement en complément (voir sources mortes).

## Journal des requêtes WebSearch (dans l'ordre, toutes ont donné des résultats utiles)
1. "Facility Response Plan" OR "Vessel Response Plan" consultant cost OPA 90 compliance
   -> coûts OSRO ~66 102 $US/an, drills QI ~248 $US/exercice ; cabinets identifiés (Witt O'Brien's,
   Gallagher Marine Systems, Jensen Hughes, T&T Salvage) ; PREP Guidelines 2016 (BSEE) repéré.
2. WCMRC ECRC oil spill response exercise drill Transport Canada certification requirements
   -> certification triennale, 4 OI au Canada, exercice WCMRC 2 500 t avec 200 participants/18 navires.
3. IOPC Funds claims manual processing time backlog oil spill compensation 2025
   -> cas Philippines (Terranova) en cours de traitement, volumes énormes.
4. "Ship-source Oil Pollution Fund" Canada SOPF claims administrator annual report 2024 2025
   -> SOPF = "Ship and Rail Compensation Canada", rapports annuels 2021-22/2023-24/2024-25 repérés.
5. sanitary sewer overflow SSO CSO public notification requirement 24 hours cost municipality NPDES
   -> délais de notification (24h oral, 5 jours écrit, variations par État).
6. harmful algal bloom forecast shellfish beach closure cost monitoring 2025 NOAA
   -> 82 M$/an (chiffre non daté, traité comme estimation), système NOAA à couverture partielle.
7. "oil spill" OR "spill response" startup AI computer vision detection 2025 funding
   -> OliOil.iO (Finlande), FruitPunch AI x Rijkswaterstaat, Roboflow (CV open-source), revue
   ScienceDirect 2026 (paywall).
8. Cedre Polmar plan d'urgence coût exploitant terminal pétrolier France réglementation
   -> Cedre rédige des plans pour raffineries/dépôts, pas de chiffre de coût trouvé.
9. "emergency preparedness coordinator" OR "environmental compliance analyst" spill terminal
   refinery job posting salary -> fourchettes salariales 43 k$-135 k$ US selon le poste.
10. combined sewer overflow consent decree cost city billion compliance monitoring reporting
    -> chiffres Md$ par ville (Kansas City 2,5 Md$, Houston 9 Md$, NYC ~10 Md$, Cleveland 3 Md$,
    Saint-Louis 4,7 Md$, Nashville 2,5 Md$, Louisville 1,15 Md$).

## WebFetch complémentaires (gratuits, non comptés)
Réussis : spillcontrol.org (résumé réunion IOPC nov 2025, chiffres détaillés par sinistre),
iopcfunds.org/claims (processus), wcmrc.com training-and-exercises, wcmrc.com canadian-spill-
response-regime (seuils tonnes/délais très précis), jensenhughes.com (peu de contenu exploitable),
coastalscience.noaa.gov hab-monitoring-system (limites explicites : couverture "régions
sélectionnées").
Échoués (sources mortes) :
- bsee.gov PREP Guidelines PDF -> "corrompu" pour l'outil WebFetch, contenu illisible.
- iopcfunds.org Claims Manual PDF -> idem, illisible.
- ship-rail.gc.ca rapport annuel SOPF 2023-2024 PDF -> trop volumineux (>10 Mo) pour l'outil.
- sciencedirect.com article IA/déversements 2026 -> HTTP 403 (paywall).
- fruitpunch.ai page défi -> HTTP 503 au moment de la consultation.
Leçon : pour les PDF réglementaires volumineux/scannés, WebFetch échoue souvent ; privilégier les
pages HTML (résumés tiers, blogs spécialisés type spillcontrol.org) qui citent déjà les chiffres.

## Lacunes non comblées (voir dossier.md section d pour détail)
Nombre exact d'OSRO US et d'installations sous FRP/VRP ; prix public d'un contrat de rédaction de
plan par un cabinet ; agences de l'eau françaises ; assureurs P&I clubs comme acheteurs directs ;
startups ayant échoué/pivoté (piste du brief non explorée, quota épuisé).

## Résumé final (pour l'orchestrateur)
dossier.md livré avec 5 candidats : (1) copilote de rédaction/mise à jour des plans d'urgence
FRP/VRP/Polmar, (2) générateur de rapports après-exercice (AAR/PREP) et suivi d'actions
correctives, (3) détection multimodale de nappes/rejets jusqu'au rapport de conformité, (4)
copilote d'instruction des réclamations FIPOL/SOPF, (5) prévision + notification automatique
CSO/SSO et HAB pour municipalités. Acheteurs et coûts vérifiés avec sources (OSRO ~66 k$US/an,
FIPOL £5,9 M/an de budget admin, décrets CSO de 1,15 à 10 Md$ par ville, salaires 43-135 k$US).
10/10 WebSearch consommées ; 5 PDF/pages inaccessibles (paywall, PDF corrompu, 503) listés comme
sources mortes. Capacités IA proposées majoritairement "supposées" (aucun concurrent IA-natif
direct confirmé faute de requêtes restantes) ; faits réglementaires/financiers "vérifiés" avec URL.
Candidat le moins étayé : #3 (détection), à approfondir en priorité si une nouvelle passe est
permise. Aucun code, aucun commit, écriture limitée à ce dossier comme demandé.
