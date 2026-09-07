# Dossier armateurs-assureurs — passe 4 (phase intuition)

Agent : « armateurs-assureurs ». Population couverte : armateurs et gestionnaires de flotte, sociétés de
classification, clubs P&I (Protection & Indemnity — assurance mutuelle de responsabilité civile des
armateurs), assureurs coque (H&M — Hull & Machinery) et cargaison, affréteurs et courtiers. Méthode :
10 requêtes WebSearch (quota atteint) + WebFetch libre sur les pages trouvées. Chaque capacité IA est
étiquetée **vérifiée (source)** ou **supposée**. Date de référence : 7 septembre 2026.

## (a) Population : qui paie déjà, combien, quoi

- **Armateurs et gestionnaires de flotte** : ordre de grandeur de 55 000 à 60 000 navires de commerce
  de plus de 100 GT (GT = jauge brute) engagés dans le commerce international (chiffre généralement cité
  par le secteur — **estimation, non revérifiée cette session**, quota WebSearch épuisé avant d'avoir pu
  la confirmer). Ce sont eux qui paient droits portuaires, amendes, primes et abonnements ci-dessous.
- **Sociétés de classification** (DNV, ABS — American Bureau of Shipping, BV — Bureau Veritas,
  Lloyd's Register, ClassNK, RINA…) : réunies dans l'IACS (International Association of Classification
  Societies), qui classe environ 90 % du tonnage mondial (**supposée**, connaissance générale du secteur,
  non revérifiée cette session). Elles vendent des notations (ex. bruit sous-marin) et des audits.
- **Clubs P&I** : 12 clubs mutuelles regroupés dans l'International Group of P&I Clubs, couvrant environ
  90 % du tonnage océanique mondial (**supposée**, même réserve). Gard, Skuld, North Standard, UK P&I,
  Steamship Mutual publient des circulaires de prévention des sinistres citées ci-dessous.
- **Assureurs coque/cargaison et courtiers** (Allianz Commercial, Swiss Re, AXA XL…) : publient des
  revues annuelles de sinistralité (ex. Allianz Safety and Shipping Review) utilisées par tout le secteur
  pour tarifer le risque.
- Ce qu'ils paient ou perdent déjà, **vérifié** par les recherches de cette passe : droits portuaires
  modulés jusqu'à -47 %/-23 % pour navires silencieux (Port de Vancouver) ; amendes NOAA (National
  Oceanic and Atmospheric Administration, agence américaine) pour survitesse en zone à baleines, non
  couvertes par l'assurance P&I standard (Gard) ; 300 à 640 €/tonne de CO2e de pénalité FuelEU Maritime
  et quotas EU ETS (Emissions Trading System, marché carbone européen) à 75-85 €/tonne, soit des
  scénarios de 1,1 à 2,3 M€/an par navire moyen selon deux sources indépendantes ; nettoyages de coque
  non planifiés et refus d'escale liés au biofouling (encrassement biologique de la coque) ; 576
  conteneurs perdus en mer en 2024 et nouvelle obligation de déclaration à l'OMI (Organisation maritime
  internationale) dès le 1er janvier 2026.

## (b) Cinq candidats

### 1. AcoustiCert — certification continue du bruit sous-marin rayonné (URN)
Problème : la certification « navire silencieux » (notations SILENT de DNV, équivalents BV/LR/ABS) repose sur un essai en mer ponctuel et coûteux (vérifiée : DNV a créé la première notation dès 2010, 5 notations SILENT existent — dnv.com).
Acheteur nommé : armateurs faisant escale au Port de Vancouver — dépense actuelle : droits portuaires recalculés à chaque escale, écart de -47 % (EcoAction Gold) à -23 % (Bronze) selon le niveau de bruit (vérifiée, portvancouver.com/SAFETY4SEA).
Produit (1 phrase) : un service qui écoute en continu les navires via les réseaux d'hydrophones déjà en place (JASCO Boundary Pass, Orcasound) et délivre une attestation de niveau de bruit sans essai dédié.
IA : attribution navire↔signature acoustique par recoupement AIS (Automatic Identification System, transpondeur de position) + séparation de sources sonores en milieu multi-navires ; impossible avant 2024 faute de modèles audio multimodaux assez robustes pour désenchevêtrer des signaux en environnement bruité sans jeu d'entraînement dédié.
Données exploitables : flux hydrophones existants, AIS, bathymétrie.
Protocole/seuil existant : notations SILENT (DNV) ; grille tarifaire EcoAction (Port de Vancouver).
Existant : essai en mer dédié par société de classification (payant, coût non trouvé) ; Orcasound (gratuit, communautaire, couverture limitée).
Retour annuel : grille tarifaire et zones réévaluées chaque saison ; re-certification après travaux sur coque/hélice.
Vérifié : notations SILENT, EcoAction -47/-23 %. Supposé : faisabilité technique de l'attribution acoustique multi-navires par IA à l'échelle d'un port, coût réel d'un essai dédié.

### 2. PreuveBaleine — dossier de conformité anti-collision cétacés généré par agent
Problème : les navires en excès de vitesse en zone à baleines reçoivent des amendes NOAA (National Oceanic and Atmospheric Administration, agence océanique américaine) non couvertes par la Rule 47 du P&I ; ~2 000 lettres d'avertissement envoyées depuis 2018, jusqu'à 20 000 baleines tuées/an par les navires selon des experts cités (vérifiée, Gard, estimation non un décompte confirmé).
Acheteur nommé : armateurs opérant sur les côtes est/ouest des États-Unis et en Méditerranée — dépense actuelle : amendes de quelques milliers à dizaines de milliers de USD, non assurées.
Produit (1 phrase) : un agent qui reconstitue, pour chaque traversée en zone sensible, un dossier de preuve (vitesse réelle vs seuil, position vs zone active) prêt à remettre à la NOAA ou à l'assureur.
IA : agent qui croise en continu AIS, zones saisonnières publiées et détections publiques (Whale Safe, WRAS — Whale Report Alert System d'Ocean Wise) et rédige la synthèse en langage naturel ; impossible avant les LLM (modèles de langage) qui rendent économique la compilation multi-sources par voyage.
Données exploitables : AIS, zones NOAA, Whale Alert/Whale Safe/WRAS (partiellement publiques).
Protocole/seuil existant : limites de vitesse (10 nœuds) et zones de gestion saisonnière NOAA.
Existant gratuit : Whale Alert (app, 2012), Whale Safe (Benioff Ocean Science Laboratory, IA déjà utilisée pour l'alerte), WRAS (Ocean Wise, Vancouver, accès restreint) — aucun ne documente après coup pour un usage réglementaire/assurantiel, à notre connaissance.
Retour annuel : zones saisonnières redéfinies chaque année ; un dossier généré par voyage.
Vérifié : non-couverture Rule 47, ~2000 lettres NOAA (Gard). Supposé : qu'un tel dossier serait accepté comme preuve par un assureur ou une autorité.

### 3. FoulingScore — notation automatique du biofouling par vision IA
Problème : le biofouling (encrassement biologique de la coque, vecteur d'espèces envahissantes) est visé par des règles qui se durcissent : CRMS (Craft Risk Management Standard) néo-zélandais renforcé depuis le 13 avril 2025, Biofouling Management Plan obligatoire en Californie depuis 2017, lignes IMO 2023 ; un navire de croisière déjà refusé au parc de Fiordland, NZ (vérifiée, North Standard/Steamship Mutual, clubs P&I).
Acheteur nommé : armateurs de porte-conteneurs/paquebots faisant escale en Nouvelle-Zélande/Californie — dépense actuelle : nettoyages non planifiés qualifiés de « costly » (montant non chiffré) et risque de refus d'escale.
Produit (1 phrase) : notation automatique (échelle FR0-FR5, Fouling Rating) à partir des vidéos d'inspection de coque déjà filmées par plongeur ou ROV (Remotely Operated Vehicle), avec génération du Biofouling Record Book exigé.
IA : vision multimodale (segmentation + classification d'images sous-marines) reconnaissant stades d'encrassement et espèces ; impossible avant 2024 faute de modèles vision-langage généralisant sur vidéo sous-marine variable sans entraînement dédié massif.
Données exploitables : vidéos d'inspection déjà obligatoires ; grilles FR0-FR5 néo-zélandaises.
Protocole/seuil existant : CRMS (NZ), Biofouling Management Plan/Record (Californie), lignes IMO 2023.
Existant : plateforme californienne MISP.IO (déclaration, pas d'analyse vidéo confirmée) ; inspection par plongeur/société spécialisée (payant, coût non trouvé).
Retour annuel : inspection requise à chaque escale à risque ou à chaque cycle de cale sèche.
Vérifié : CRMS depuis avril 2025, cas Fiordland. Supposé : précision atteignable par la vision IA pour un usage réglementaire sans validation humaine, absence d'un concurrent déjà sur ce créneau précis.

### 4. ContainerTrace — reconstruction et déclaration automatique des pertes de conteneurs
Problème : 576 conteneurs perdus en mer en 2024 (vs 221 en 2023, moyenne 10 ans 1274) ; amendement SOLAS (Safety of Life at Sea) de l'OMI rendant obligatoire la déclaration de TOUTE perte de conteneurs dès le 1er janvier 2026, en vigueur depuis 8 mois à la date de ce dossier (vérifiée, World Shipping Council — WSC, association des armateurs de porte-conteneurs).
Acheteur nommé : armateurs de porte-conteneurs long-courriers — dépense actuelle : nouvelle charge de conformité administrative (montant non chiffré, obligation trop récente) + exposition assurance cargaison.
Produit (1 phrase) : un outil qui, dès qu'une perte est suspectée, assemble automatiquement le dossier de déclaration OMI (position, météo, plan d'arrimage, numéros de conteneurs).
IA : agent lisant le plan d'arrimage (souvent PDF/scan) et croisant météo, AIS et journal de bord pour produire un rapport structuré ; impossible avant les LLM multimodaux fiables sur documents hétérogènes scannés/manuscrits.
Données exploitables : AIS, plans d'arrimage électroniques, bulletins météo, statistiques WSC agrégées.
Protocole/seuil existant : amendement SOLAS/OMI (MSC — Maritime Safety Committee), en vigueur depuis le 1er janvier 2026 ; contenu exact du formulaire non trouvé (lacune).
Existant : aucun outil dédié trouvé pour cette déclaration précise ; le WSC ne fait qu'agréger des statistiques annuelles volontaires — semble être un vide de marché.
Retour annuel : chaque incident déclenche une nouvelle déclaration ; obligation permanente dès 2026.
Vérifié : chiffres WSC, date d'entrée en vigueur. Supposé : contenu exact du formulaire, absence réelle de concurrent (recherche non exhaustive).

### 5. ArbitrageCarbone-IA — copilote agentique CII/EU ETS/FuelEU
Problème : cumul dès 2026 de trois régimes carbone — CII (Carbon Intensity Indicator, notation annuelle A-E de l'OMI), EU ETS (quotas EUA — European Union Allowance — à 75-85 €/t), FuelEU Maritime (pénalité 300-400 €/tCO2e selon ShipFinex, jusqu'à 640 €/t selon une autre source, méthodologies non harmonisées) ; rapports MRV vérifiés dus au 31 janvier 2026, attestations dues en avril 2026 (vérifiée, OceanScore/ShipFinex).
Acheteur nommé : armateurs et gestionnaires de flotte trafiquant vers/dans l'UE — dépense actuelle : scénario chiffré à 2,1-2,3 M€/an de pénalités pour un porte-conteneurs moyen, ou 1,1-1,8 M€/an de surcoût biocarburant, ou 1,5-5 M€ de rétrofit amorti en 18-24 mois (deux sources convergentes).
Produit (1 phrase) : un agent qui lit les chartes-parties (contrats d'affrètement) pour savoir qui paie quoi, simule en continu vitesse/route/carburant/pooling et recommande l'option la moins coûteuse.
IA : extraction de clauses contractuelles en langage libre (LLM) + prévision/optimisation multi-objectif sur cours EUA et primes biocarburant ; impossible avant les LLM pour lire à grande échelle des charte-parties hétérogènes non structurées.
Données exploitables : rapports MRV (Monitoring, Reporting, Verification) déjà collectés, charte-parties, cours spot EUA/biocarburant.
Protocole/seuil existant : CII, EU ETS, FuelEU Maritime — tous déjà écrits par l'OMI/l'UE.
Existant payant : OceanScore (Compliance Manager/Forecaster/Pooling Marketplace), MarineAware, qaship.net, cse-net.org — marché déjà validé mais surtout des tableaux de bord, pas d'agent décisionnel autonome confirmé (supposé, absence de mention seulement).
Retour annuel : seuils CII et trajectoire FuelEU se durcissent chaque année ; vérification annuelle obligatoire.
Vérifié : montants EUA/FuelEU/scénarios ci-dessus. Supposé : que les outils existants n'offrent pas déjà l'extraction automatique de charte-parties par LLM.

## (c) Références (URL, date de consultation : 7 septembre 2026)

- Allianz Commercial, *Safety and Shipping Review 2025* — https://commercial.allianz.com/news-and-insights/news/safety-shipping-review-2025.html (publié ~29 mai 2025)
- SAFETY4SEA, *Port of Vancouver promotes quieter ships* — https://safety4sea.com/port-of-vancouver-promotes-quieter-ships/
- Vancouver Fraser Port Authority, page *ECHO* (Enhancing Cetacean Habitat and Observation) — https://www.portvancouver.com/environment/healthy-ecosystem/echo (contenu obtenu via résumé WebSearch ; fetch direct refusé, HTTP 403)
- World Shipping Council, *World Shipping Council Releases Container Lost at Sea Report – 2025 Update* — https://www.worldshipping.org/news/world-shipping-council-releases-container-lost-at-sea-report-2025-update
- OceanScore, *Maritime Compliance Requirements 2026: EU ETS, FuelEU, UK ETS* — https://oceanscore.com/insights/maritime-compliance-requirements-2026-eu-ets-fueleu-uk-ets/
- ShipFinex, *FuelEU Maritime Compliance Costs 2026* — https://www.shipfinex.com/blog/fueleu-maritime-compliance-costs-penalties-biofuel-retrofit
- North Standard (club P&I), *Biofouling: Countries getting tough on clean hull requirements* — https://north-standard.com/insights-and-resources/resources/archive/articles/biofouling-countries-getting-tough-on-clean-hull-requirements (contenu obtenu via résumé WebSearch ; fetch direct refusé, HTTP 403)
- Steamship Mutual (club P&I), *Shipboard Biofouling Concerns and Regulations* — https://www.steamshipmutual.com/shipboard-biofouling-concerns-and-regulations
- Gard, *Know when to slow down for whales* — https://gard.no/en/insights/know-when-to-slow-down-for-whales/
- DNV, *Controlling underwater noise* — https://www.dnv.com/expert-story/maritime-impact/Controlling-underwater-noise/ (contenu obtenu via résumé WebSearch)
- Ocean Wise, *Whale Report Alert System (WRAS)* — https://ocean.org/whales/wras/
- Benioff Ocean Science Laboratory (UC Santa Barbara), *Whale Safe* — https://bosl.ucsb.edu/project/whale-safe/ (contenu obtenu via résumé WebSearch)
- IFAW, *WhaleAlert: the app preventing vessel strikes* — https://www.ifaw.org/international/campaigns/whale-alert (contenu obtenu via résumé WebSearch)
- ICOMIA, *Posidonia Oceanica & Yacht Moorings* — https://www.icomia.org/posidonia-oceanica-yacht-moorings/

### Lacunes

- Quota de 10 WebSearch atteint ; plusieurs pages n'ont pu être lues qu'à travers le résumé produit par
  WebSearch (pas de WebFetch direct réussi) : page ECHO du port de Vancouver, article biofouling de
  North Standard, page service DNV bruit sous-marin, page Whale Safe, app Whale Alert — risque de perte
  de nuance par rapport à une lecture intégrale.
- Trois pages ont renvoyé une erreur HTTP 403 en WebFetch direct : rapport annuel ECHO 2023 (PDF,
  portvancouver.com), page service DNV *underwater-noise-analysis*, résumé ScienceDirect sur la
  pression du mouillage en herbier de posidonie — contenu non récupéré, pistes non approfondies.
- Coûts précis introuvables : essai en mer dédié pour une notation SILENT, inspection de coque par
  plongeur/ROV, contenu exact du futur formulaire de déclaration OMI des pertes de conteneurs.
- Taille de la population (nombre d'armateurs, de sociétés de classification, de clubs P&I) basée sur
  des ordres de grandeur généralement admis dans le secteur, non revérifiée par une recherche dédiée
  cette session (quota épuisé avant d'y arriver) — marquée « estimation ».
- Sujets du brief non explorés faute de budget de recherche restant : eaux de ballast, rejets et
  scrubbers (épurateurs de gaz d'échappement), mouillage sur habitats hors Méditerranée, dommages aux
  câbles sous-marins (mentionnés comme risque émergent par Allianz mais non creusés) — pistes pour une
  passe ultérieure.
- Candidat écarté faute de temps pour l'étoffer à 5 : surveillance satellite du mouillage sur les
  herbiers de posidonie (amendes jusqu'à 150 000 €/personne à bord en France) — plus orienté
  plaisance/superyacht qu'armateurs de commerce, mais un acheteur (assureurs de yacht, marinas,
  affréteurs de charter) et un problème documenté existent ; à reprendre si un des 5 candidats retenus
  s'avère trop faible en validation.
- Aucune vérification de terrain (entretien avec un armateur, un club P&I ou une société de
  classification) : toutes les sources sont secondaires et publiques.
