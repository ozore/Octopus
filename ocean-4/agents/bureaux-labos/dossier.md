# Dossier — Bureaux d'études, laboratoires d'analyse et auditeurs en environnement marin

Agent : bureaux-labos. Passe d'idéation (phase intuition), 7 septembre 2026. Périmètre : bureaux d'études en
environnement marin, laboratoires d'analyse (taxonomie, eDNA — ADN environnemental —, chimie, microplastiques,
acoustique), cabinets d'évaluation d'impact, experts maritimes, auditeurs de certification.

Convention : chaque affirmation porte l'étiquette **(vérifiée : source)** quand elle vient d'une recherche/lecture
faite cette session, ou **(supposée)** quand c'est un raisonnement ou une connaissance générale non vérifiée dans
cette session. Acronymes définis à la première occurrence.

---

## (a) Population

**Qui.** Trois couches d'acheteurs, distinctes mais imbriquées :

1. **Grands bureaux d'études pluridisciplinaires** avec département environnement marin : Tetra Tech (qui a
   racheté RPS Group — **supposée**, connaissance générale non revérifiée cette session ; le site rpsgroup.com est
   toujours en ligne sous cette marque, vérifiée : rpsgroup.com), ERM, Ramboll, WSP (qui aurait racheté Golder —
   **supposée**), Stantec, AECOM. Ils vendent des études d'impact (EIE), du conseil réglementaire et pilotent des
   sous-traitants spécialisés.
2. **Laboratoires et cabinets spécialisés** : APEM Ltd (coordonne le volet invertébrés/poissons/granulométrie du
   NMBAQC — National Marine Biological Analytical Quality Control, le schéma britannique d'assurance qualité pour
   les analyses biologiques marines — vérifiée : nmbaqcs.org, apemltd.com), Marine Ecological Surveys Limited
   (MESL), Thomson Environmental Consultants (groupe RSK), Eurofins, Measurlabs, NatureMetrics (eDNA). Cefas
   (agence scientifique publique britannique) et Ifremer et ses sous-traitants (organisme français), cités dans la
   consigne de recherche, n'ont pas fait l'objet d'une recherche dédiée cette session — mention non vérifiée.
3. **Organismes certificateurs / QA** : Bureau Veritas, DNV, SCS Global Services, Intertek (audits MSC/ASC — Marine
   Stewardship Council / Aquaculture Stewardship Council, vérifiée : msc.org) ; UKAS et NATA (accréditation
   ISO/IEC 17025, norme générale de compétence des laboratoires d'essais — NATA vérifiée via eurofins.com, UKAS
   supposée).

**Combien.** Aucun chiffre agrégé trouvé et vérifié dans le budget imparti. **Estimation** (non vérifiée) : quelques
dizaines de grands bureaux multi-métiers actifs sur le marché nord-américain et européen de l'environnement marin,
et plusieurs centaines de laboratoires/cabinets spécialisés (taxonomie, chimie, eDNA, acoustique) qui leur
sous-traitent l'analyse technique.

**Ce qu'ils paient déjà ou perdent (chiffres trouvés, tous vérifiés par source citée) :**
- Contrat-cadre The Crown Estate (gestionnaire du domaine public maritime britannique) → Tetra Tech Ltd : conseil en
  études écologiques pour le prochain cycle d'attribution de baux éoliens offshore, **2,5 M£ HT / 3 M£ TTC**,
  29 oct. 2025 → 28 oct. 2028 (extension possible à 2029) (vérifiée, via résultat de recherche : find-tender.service.gov.uk, notice 086365-2025, déc. 2025 — accès direct à la fiche bloqué 403, information reprise du résumé de recherche).
- Gouvernement écossais : marché d'échantillonnage écologique (poissons, benthos, plancton) sur 4 parcs éoliens
  offshore + zones témoins, 3 phases (hiver 2025-printemps 2026, été 2026, automne 2026) (vérifiée, via résultat de
  recherche : find-tender.service.gov.uk, déc. 2025).
- Salaires taxonomistes benthiques (Royaume-Uni, 2025) : 38 616 £/an (Marine Ecology Adviser, NatureScot) à
  60-70 000+ £/an (Associate Ecologist/Director) (vérifiée : glassdoor.co.uk, accesstg.com).
- Observateurs de mammifères marins (MMO — Marine Mammal Observer) et opérateurs PAM (Passive Acoustic Monitoring,
  surveillance acoustique passive) : 200-700 $US/jour selon séniorité en 2026 (vérifiée : crewbase.pro, juil. 2026).
- Kits eDNA NatureMetrics : 335 £/kit, résultat en 6 semaines (10 jours en qPCR simple) (vérifiée :
  naturemetrics.shop).
- Analyse microplastiques : à partir de 349 $US/échantillon en tarif de base, devis nécessaire au-delà (vérifiée :
  polygonesystems.com, mesurlabs via measurlabs.com).
- Certification MSC/ASC chaîne de contrôle : cycle de 3 ans avec audits de surveillance annuels, coût variable non
  chiffré précisément dans les sources (« will vary depending on the complexity and size of your organisation »)
  (vérifiée : msc.org).

---

## (b) Cinq candidats

### 1. Copilote de tri/identification taxonomique benthique (calé sur le NMBAQC)
- **Problème** : le tri et l'identification espèce par espèce de la macrofaune benthique (échantillons de
  bennes/carottes) sont manuels et lents ; les postes de taxonomiste marin restent difficiles à pourvoir (offres
  MESL, APEM, RSK — vérifiée : environment-analyst.com, poste MESL 2015, fermé mais illustratif ; postes similaires
  listés sur Indeed/Glassdoor UK 2025-2026).
- **Acheteur nommé** : APEM Ltd (coordinateur du volet invertébrés du NMBAQC) et labos contractants MESL/RSK ;
  dépense actuelle = salaires 38-70k£+/an plus le temps de tri par échantillon.
- **Produit (une phrase)** : un assistant qui propose une identification par photo de chaque spécimen trié, avec
  score de confiance, avant validation par le taxonomiste.
- **IA précisément / pourquoi impossible avant 2024** : identification par vision multimodale en few-shot contre
  des collections de spécimens de référence déjà validées, plutôt qu'un classifieur entraîné taxon par taxon — les
  CNN (réseaux de neurones convolutifs) antérieurs à 2024 (CoralNet, iBivalves, EchoAI, FishAI) exigent un grand
  jeu d'images étiquetées par taxon et généralisent mal : FishAI plafonne à 62,6 % de précision au niveau espèce
  sur 808 espèces (vérifiée : arxiv.org/pdf/2507.21665 ; frontiersin.org/articles/10.3389/fmars.2025.1508851).
- **Données exploitables** : bibliothèques de spécimens voucher et bulletins de ring test produits par le NMBAQC
  depuis 1994 (vérifiée : nmbaqcs.org).
- **Seuil/protocole existant** : Bray-Curtis Similarity Index (BCSI, 5 paliers, de « Excellent » 100 % à « Bad »
  <85 %) et Taxonomic Discrimination Policy (TDP) — spécification déjà écrite (vérifiée : nmbaqcs.org,
  apemltd.com).
- **Existant gratuit/payant** : prototypes académiques seulement (CoralNet, iBivalves, EchoAI, FishAI) ; aucun
  outil commercial intégré au flux NMBAQC/BCSI identifié (existence des prototypes vérifiée ; absence d'outil
  commercial = supposée, recherche non exhaustive).
- **Pourquoi il revient l'année suivante** : ring tests bi-annuels obligatoires pour tout labo faisant du suivi
  benthique statutaire, plus contrats de suivi pluriannuels par site (vérifiée : nmbaqcs.org).

### 2. Copilote de rédaction d'étude d'impact (EIE) et de réponse aux régulateurs
- **Problème** : rédaction/mise à jour des chapitres d'étude d'impact environnemental (EIE) et réponses point par
  point aux demandes d'information des régulateurs, répétitives et à risque d'incohérence entre chapitres
  (cycle réglementaire vérifié — cf. BOEM ci-dessous ; le caractère « fait à la main aujourd'hui » = supposée).
- **Acheteur nommé** : cabinets Tetra Tech (ex-RPS), ERM, Ramboll, WSP pour des donneurs d'ordre publics — ex. The
  Crown Estate → Tetra Tech Ltd, 2,5 M£ HT sur 3 ans (+1) pour le conseil en études écologiques (cf. section a,
  vérifiée : find-tender.service.gov.uk).
- **Produit (une phrase)** : un copilote qui rédige les chapitres d'EIE, trace les engagements de mitigation entre
  chapitres et prépare les réponses aux demandes d'information des régulateurs.
- **IA précisément / pourquoi impossible avant 2024** : LLM (modèle de langage) à grand contexte + agents outillés
  qui ingèrent des centaines de pages de guidance et de précédents, tracent les engagements chapitre par chapitre
  et résument les réponses de consultation — nécessite des fenêtres de contexte longues et un usage fiable d'outils
  agentiques apparus 2024-2026 (partiellement vérifiée : blog Savills, « AI systems can support version control,
  track mitigation commitments across chapters, flag cross-referencing errors » — accès limité au résumé de
  recherche, texte intégral bloqué 403 ; détail = supposée).
- **Données exploitables** : EIE et commentaires publics déjà déposés par projet, ex. BOEM (Bureau of Ocean Energy
  Management, agence fédérale américaine des baux énergétiques offshore) California PEIS, période de commentaires
  close le 12 fév. 2025 (vérifiée : federalregister.gov, boem.gov).
- **Seuil/protocole existant** : guides de contenu d'EIE de BOEM (National Environmental Policy Act, NEPA) et
  Habitats Regulations Assessment (HRA) au Royaume-Uni (existence vérifiée par les résultats de recherche ; détail
  du contenu = supposée).
- **Existant gratuit/payant** : aucun outil nommé identifié pour ce périmètre précis ; guidance professionnelle
  2025 de l'ISEP (Institute of Sustainability and Environmental Professionals) sur l'IA en évaluation d'impact
  repérée mais non lue en intégralité (vérifiée via extrait de recherche uniquement).
- **Pourquoi il revient l'année suivante** : chaque projet traverse plusieurs cycles de demandes d'information puis
  un suivi post-construction pluriannuel (le contrat Crown Estate court jusqu'en 2028/2029).

### 3. Agent de conformité acoustique — rapports PAM automatisés
- **Problème** : la surveillance acoustique passive (PAM) et l'observation visuelle des mammifères marins pendant
  les travaux (battage de pieux, sismique) mobilisent des observateurs payés à la journée, avec journal de
  conformité rédigé manuellement (vérifiée : crewbase.pro, 2026).
- **Acheteur nommé** : prestataires MMO/PAM type RPS (groupe Tetra Tech), qui dessert « 90% of active US offshore
  wind leases » selon son propre site, pour des maîtres d'ouvrage soumis à BOEM/NMFS (National Marine Fisheries
  Service, agence fédérale américaine de protection des mammifères marins) (vérifiée : rpsgroup.com).
- **Produit (une phrase)** : un agent qui relie les détections acoustiques aux seuils du permis et rédige
  automatiquement le journal de conformité au format attendu du régulateur.
- **IA précisément / pourquoi impossible avant 2024** : la détection elle-même n'est plus le verrou — RPS a déjà un
  algorithme propriétaire « Neptune » intégrant l'IA, et PAMGuard (gratuit) inclut des classifieurs IA/deep
  learning (vérifiée : rpsgroup.com, pamguard.org) — le verrou restant est la couche agentique qui croise le
  journal de détections avec le texte du permis (zones d'exclusion propres au site) et génère le rapport, qui
  suppose une extraction fiable de documents longs apparue 2024-2026 (supposée, raisonnement non sourcé
  directement).
- **Données exploitables** : journaux de détection déjà produits en continu par les campagnes en cours.
- **Seuil/protocole existant** : obligations de surveillance et de rapport du 50 CFR 217 (réglementation NOAA/NMFS
  sur les mammifères marins) (vérifiée par titres de résultats eCFR ; contenu détaillé non lu = supposée).
- **Existant gratuit/payant** : PAMGuard (gratuit, open source, « World leading software for the Detection,
  Classification, and Localisation of marine mammal and other animal sounds ») et Neptune de RPS (propriétaire,
  prix non communiqué) ; pas de couche de rapport de conformité automatisé trouvée en produit distinct (vérifiée
  pour les deux outils ; absence de couche rapport = supposée).
- **Pourquoi il revient l'année suivante** : chaque campagne de construction ou saison sismique exige une nouvelle
  surveillance et de nouveaux rapports.

### 4. Vision + rapport automatisé pour l'analyse microplastiques (FTIR/LDIR)
- **Problème** : le comptage/classement des particules de microplastiques par imagerie FTIR (spectroscopie
  infrarouge à transformée de Fourier) ou LDIR (Laser Direct Infrared) reste partiellement manuel, et la mise en
  forme du certificat d'analyse accrédité est chronophage (vérifiée : eurofins.com).
- **Acheteur nommé** : laboratoires type Eurofins (accrédité ISO/IEC 17025:2017, NATA — National Association of
  Testing Authorities, organisme d'accréditation australien —, 1er labo microplastiques accrédité en Australie
  pour l'eau potable en 2023, étendu à toutes matrices eau en 2024) et Measurlabs, PolyGone ; dépense actuelle : à
  partir de 349 $US/échantillon en tarif de base (vérifiée : measurlabs.com, polygonesystems.com, eurofins.com).
- **Produit (une phrase)** : un outil qui lit les images spectrales, classe chaque particule par type de polymère
  et génère directement le rapport conforme ISO/IEC 17025.
- **IA précisément / pourquoi impossible avant 2024** : vision multimodale capable d'unifier la classification à
  travers plusieurs marques d'instruments (imagerie FTIR déjà vendue par les fabricants, ex. note d'application
  Agilent référencée en recherche) puis génération automatique du certificat et de la piste d'audit qualité
  (blancs, échantillons de contrôle) — les logiciels liés aux instruments sont aujourd'hui propriétaires et
  cloisonnés par marque (existence du logiciel fabricant vérifiée ; l'unification multi-marques par IA = supposée).
- **Données exploitables** : bibliothèques spectrales de référence déjà constituées par fabricants et labos.
- **Seuil/protocole existant** : ISO/IEC 17025 (exigences générales de compétence des laboratoires d'essais et
  d'étalonnage) (vérifiée : eurofins.com).
- **Existant gratuit/payant** : logiciels d'imagerie FTIR déjà vendus par les fabricants d'instruments (payant,
  propriétaire) ; pas de couche de génération automatique de rapport ISO 17025 identifiée (vérifiée pour le
  logiciel fabricant ; absence de couche rapport = supposée).
- **Pourquoi il revient l'année suivante** : obligations de suivi de l'eau (potable/surface) qui s'étendent
  (extension réglementaire australienne 2023→2024 constatée), plus audits de surveillance ISO 17025 périodiques.

### 5. Copilote de préparation d'audit de certification (MSC/ASC, ISO 17025)
- **Problème** : préparer un audit de certification (traçabilité chaîne de contrôle, accréditation labo) demande de
  rassembler et croiser à la main des preuves hétérogènes (factures, certificats fournisseurs, journaux) avant
  chaque audit (vérifiée : msc.org, guide de certification chaîne de contrôle).
- **Acheteur nommé** : organismes certificateurs accrédités MSC/ASC — Bureau Veritas, DNV, SCS Global Services,
  Intertek — et les entreprises certifiées qui financent l'audit ; cycle de 3 ans avec audits de surveillance
  annuels, coût variable non chiffré précisément (« will vary depending on the complexity and size of your
  organisation ») (vérifiée : msc.org).
- **Produit (une phrase)** : un copilote qui compile le dossier de preuves d'un site avant l'audit et signale les
  écarts probables avant le passage de l'auditeur.
- **IA précisément / pourquoi impossible avant 2024** : agent multimodal qui lit factures scannées, certificats et
  déclarations libres, les croise avec le standard applicable (ex. MSC Chain of Custody Standard) et détecte les
  incohérences — nécessite une extraction fiable de documents non structurés et hétérogènes par des modèles
  multimodaux (entièrement supposée : aucun produit nommé trouvé faisant précisément cela ; raisonnement déduit par
  analogie avec le candidat 2).
- **Données exploitables** : standards et guides du programme chaîne de contrôle déjà publiés par le MSC/ASC.
- **Seuil/protocole existant** : MSC Chain of Custody Standard, cycle de certification à 3 ans (vérifiée :
  msc.org).
- **Existant gratuit/payant** : aucun logiciel dédié trouvé pour ce périmètre précis ; seuls des organismes
  certificateurs génériques et leurs procédures propres identifiés (vérifiée pour les organismes ; absence d'outil
  dédié = supposée).
- **Pourquoi il revient l'année suivante** : audits de surveillance chaque année sur un cycle de certification de
  3 ans, plus veille sur les mises à jour de standards.

---

## (c) Références (URL, date d'accès ou de publication)

- NMBAQC — Invertebrates : https://www.nmbaqcs.org/scheme-components/invertebrates/ (consulté 7 sept. 2026)
- NMBAQC — recherche générale (bulletins, ring tests) : https://www.nmbaqcs.org/ ; ResearchGate RTB#37 :
  https://www.researchgate.net/publication/238735118 (consulté 7 sept. 2026)
- APEM — page service NMBAQC : https://www.apemltd.com/service/nmbaqc-scheme/ (consulté 7 sept. 2026)
- Offre d'emploi MESL (Marine Ecological Surveys Limited), taxonomiste benthique marin, publiée 29-09-2015,
  clôturée 28-10-2015 (illustrative, non représentative de 2025-2026) :
  https://environment-analyst.com/uk/jobs/37424/senior-marine-benthic-taxonomist-marine-benthic-taxonomist
- Salaires marine ecology UK 2025-2026 : https://www.glassdoor.co.uk/Job/marine-ecology-jobs-SRCH_KO0,14.htm ;
  https://www.accesstg.com/job/marine-ecologist-biologist-taxonomist-ecology-and-environmental-uk-wide-4372
  (consultés 7 sept. 2026)
- NatureMetrics — boutique/prix eDNA : https://www.naturemetrics.shop/ (consulté 7 sept. 2026)
- NatureMetrics — actualités eDNA poissons : https://www.naturemetrics.com/news/edna-metabarcoding-for-non-invasive-fish-surveys
  (consulté 7 sept. 2026)
- BOEM — California Offshore Wind PEIS : https://www.boem.gov/renewable-energy/state-activities/california-offshore-wind-programmatic-environmental-impact ;
  Federal Register, avis du 14 nov. 2024 : https://www.federalregister.gov/documents/2024/11/14/2024-26424
- ecori.org — Protected Species Observers dans l'éolien offshore US :
  https://ecori.org/protected-species-observers-friends-of-marine-mammals-hired-by-offshore-wind-companies/
- Crewbase — carrières MMO/PAM et day rates 2026 :
  https://crewbase.pro/blog/2026/07/mmo-pam-operator-career-path-offshore-wind-seismic-2026 (consulté 7 sept. 2026)
- RPS Group — mitigation mammifères marins (PSO/MMO/PAM, Neptune) :
  https://www.rpsgroup.com/services/oceans-and-coastal/marine-life-mitigation-psos-mmos-and-pam/ (consulté 7 sept. 2026)
- PAMGuard : https://www.pamguard.org/ (consulté 7 sept. 2026)
- Recherche AI/species ID : arxiv.org/pdf/2507.21665 (détection automatique organismes benthiques antarctiques,
  2025) ; Frontiers in Marine Science 2025 : https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2025.1508851/full
- Savills — IA en études d'impact (résumé de recherche uniquement, page bloquée 403 en accès direct) :
  https://www.savills.co.uk/blog/article/389492/ (référence, non lue in extenso, 7 sept. 2026)
- Microplastiques — Eurofins : https://www.eurofins.com/en-au/environment-testing/speciality-analysis/microplastics/ ;
  Measurlabs : https://measurlabs.com/solutions/microplastics-testing/ ; PolyGone :
  https://www.polygonesystems.com/service (consultés 7 sept. 2026)
- MSC — après certification, chaîne de contrôle : https://www.msc.org/for-business/supply-chain/COC-resources ;
  guide de certification : https://www.msc.org/for-business/supply-chain/chain-of-custody-certification-guide
  (consultés 7 sept. 2026)
- Certificateurs MSC/ASC : Intertek (https://www.intertek.com/assurance/msc-coc/), DNV
  (https://www.dnv.com/services/msc-asc-chain-of-custody-certification/), Bureau Veritas
  (https://certification.bureauveritas.com/needs/marine-stewardship-council-msc-certificationfishery-and-chain-custody-assessment)
- Marché public — The Crown Estate / Tetra Tech, ecological surveys advisor, notice 086365-2025, et marché
  gouvernement écossais (échantillonnage écologique éolien offshore) : https://www.find-tender.service.gov.uk/
  (repris via résultats de recherche, accès direct à la fiche bloqué 403, déc. 2025)

---

## (d) Lacunes

- Aucun chiffre agrégé vérifié sur la taille totale du marché (nombre de bureaux/labos, $/€ global) — estimation
  qualitative seulement (section a).
- Coût précis d'un audit MSC/ASC ou d'une accréditation ISO/IEC 17025 non trouvé (« variable selon la taille de
  l'organisation »), à chiffrer via devis directs dans une passe ultérieure.
- Plusieurs pages sources renvoient 403 (Forbidden) en accès direct : blog Savills (IA en EIE), govmarket.uk
  (marché « UK Regulatory Mapping » Mexique — piste veille réglementaire multi-juridictions non développée faute
  d'accès), find-tender.service.gov.uk (fiche HTML). Les informations reprises viennent alors du résumé produit par
  l'outil de recherche, pas d'une lecture directe du document — fiabilité plus faible, signalée dans chaque cas.
- eDNA (ADN environnemental) laissé sans candidat dédié malgré une adoption réglementaire bien documentée
  (Environment Agency, SEPA — Scottish Environment Protection Agency —, Natural England ; source :
  naturemetrics.com/news) : le potentiel semble surtout dans la couche d'interprétation/rapport des résultats de
  metabarcoding (pas la partie humide/séquençage), non creusé faute de budget de recherche — piste prioritaire pour
  une passe suivante.
- Veille réglementaire multi-juridictions (BOEM/UK/UE) mentionnée en creux dans le candidat 2 mais pas développée
  en candidat séparé, faute de source solide trouvée dans le budget imparti (10 WebSearch).
- Cefas et Ifremer, cités dans la consigne de recherche comme sous-traitants/acteurs de référence, n'ont fait
  l'objet d'aucune recherche dédiée cette session — mention non vérifiée, à traiter en priorité si une nouvelle
  passe est possible.
- JNCC (Joint Nature Conservation Committee, organisme statutaire britannique de conservation), cité dans le
  périmètre de recherche, n'a été confirmé qu'indirectement (non nommé explicitement dans les extraits obtenus de
  la page RPS) — son rôle exact dans les seuils de mitigation acoustique reste supposé, pas vérifié directement.
- Pas de comparatif exhaustif des logiciels payants concurrents de PAMGuard, ni des prix pratiqués par les grands
  bureaux pour une EIE complète (grilles tarifaires publiques non trouvées pour ce type de prestation).
