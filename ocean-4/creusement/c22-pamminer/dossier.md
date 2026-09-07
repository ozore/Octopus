# Dossier de creusement — Candidat 22 : PAM-Miner
Agent : creusement c22-pamminer — 7 septembre 2026. Dossiers d'origine : agences-donnees (candidat 5, section b),
bureaux-labos (candidat 3, section b). PAM : *Passive Acoustic Monitoring*, surveillance acoustique passive.

## Trois angles candidats

1. **Couche de rédaction** : transformer les journaux de détection déjà produits par PAMGuard (gratuit) ou JASCO
   PAMlab (payant) en section de rapport réglementaire citée et prête à déposer, chose qu'aucun des deux outils de
   détection ne fait lui-même.
2. **Archive partagée mer des Salish** : construire une fois une analyse de référence sur l'archive publique ONC
   (Oceans 3.0, réseaux NEPTUNE/VENUS) et la station Boundary Pass (Transports Canada), puis la revendre à plusieurs
   bureaux qui évaluent des projets dans la même zone, au lieu que chacun ne traite que son propre déploiement.
3. **Sous-traitance à bas coût des petits bureaux généralistes** : vendre aux cabinets pluridisciplinaires (Tetra
   Tech, ERM, Ramboll, WSP, candidat 2 du dossier bureaux-labos) qui n'ont pas de bioacousticien interne, une
   capacité d'analyse acoustique complète sans passer par un sous-traitant spécialisé facturé au jour.

### Angle 1 — confirme / contredit / verdict
- Confirme : JASCO écrit elle-même que des bioacousticiens spécialisés « review audio samples and spectrograms to
  confirm the automated marine mammal detections » (vérifiée, jasco.com/pamlab) — la détection ne produit donc pas
  un rapport, seulement des détections à valider. Le dossier bureaux-labos note aussi qu'aucune « couche de rapport
  de conformité automatisé » n'a été trouvée comme produit distinct (vérifiée, dossier bureaux-labos candidat 3).
- Contredit : JASCO est intégrée verticalement, elle vend les hydrophones (OceanObserver), le logiciel de détection
  (PAMlab) et le service d'analyse (« Acoustic Data Analysis », « Acoustic Monitoring ») (vérifiée, jasco.com).
  SMRU Consulting rédige déjà des rapports techniques complets, ex. caractérisation du bruit ambiant de Burrard
  Inlet pour le programme ECHO en 2020 (vérifiée, résultat de recherche citant smruconsulting.com). Ces deux
  acteurs vendent déjà la rédaction, pas seulement la détection.
- Verdict : l'angle tient comme outil interne vendu À ces cabinets pour comprimer leurs heures facturables, pas
  comme moyen de les contourner ; recoupe en partie le candidat 1+2 (PSO/PAM Layer) déjà retenu séparément, avec
  une différence de portée (archive après coup, pas surveillance de chantier en temps réel).

### Angle 2 — confirme / contredit / verdict
- Confirme : ONC affirme que ses données sont « freely shared, used and built on without restrictions » (vérifiée,
  oceannetworks.ca/data) ; le dossier agences-donnees note qu'aucun lien entre l'archive ONC et une revue IA
  systématique par espèce n'est confirmé (supposée pour l'absence, vérifiée pour l'existence de l'archive). Les
  conditions d'autorisation imposent des suivis pluriannuels (années 1, 3, 5) répétés par chaque projet dans une
  zone souvent partagée (mer des Salish pour RBT2, programme ECHO).
- Contredit : la couverture géographique des réseaux câblés NEPTUNE/VENUS et de Boundary Pass est fixe et ne
  couvre pas forcément le site exact de chaque projet ; Woodfibre LNG (Howe Sound) et LNG Canada/Cedar LNG (chenal
  Douglas, près de Kitimat) sont loin des nœuds connus de NEPTUNE/VENUS (Strait of Georgia, Saanich Inlet, large de
  l'île de Vancouver) — l'utilité réelle de l'archive ONC pour CES projets précis n'est pas confirmée (supposée,
  couverture géographique non vérifiée nœud par nœud faute de budget de recherche restant).
- Verdict : angle solide seulement pour les projets proches d'un nœud existant (secteur RBT2/ECHO) ; pas généralisable
  aux quatre projets cités dans le mandat sans vérification site par site.

### Angle 3 — confirme / contredit / verdict
- Confirme : Woodfibre LNG mobilise jusqu'à 40 professionnels formés (observateurs de mammifères marins, experts
  hydrophones) en partenariat avec l'équipe environnementale de la Nation Squamish (vérifiée, woodfibrelng.ca,
  19 déc. 2024) — un effort humain lourd que les grands cabinets généralistes n'ont pas en interne. Un concurrent
  déjà positionné, Dynamic Ocean Consulting (basé en C.-B.), offre « real-time and autonomous underwater acoustic
  monitoring programs across Canada » avec « DFO compliance support and soundscape analysis » (vérifiée, résultat
  de recherche citant dynamicoceanconsulting.com), preuve qu'un marché de sous-traitance clé en main existe déjà.
- Contredit : ce concurrent (Dynamic Ocean Consulting) fait précisément ce que l'angle propose, avec une équipe
  humaine sur le terrain ; un produit purement logiciel ne remplace pas l'observateur embarqué exigé par le permis
  pendant les travaux (obligation confirmée par le dossier bureaux-labos, candidat 3, 50 CFR 217 côté américain,
  équivalent canadien non vérifié précisément).
- Verdict : l'angle existe déjà comme service humain complet chez un concurrent basé en C.-B. ; un produit IA seul
  ne couvre pas l'obligation d'observateur en direct, seulement l'analyse a posteriori de l'archive.

## Angle retenu et pourquoi les deux autres tombent
**Angle 1 retenu, restreint à la rédaction de la section acoustique post-hoc** (pas la surveillance de chantier en
temps réel, qui reste humaine et réglementairement obligatoire). L'angle 2 tombe sur l'incertitude de couverture
géographique ONC pour trois des quatre projets nommés (Woodfibre, LNG Canada, Cedar LNG). L'angle 3 tombe parce
qu'un concurrent basé en C.-B. (Dynamic Ocean Consulting) vend déjà le service complet avec présence humaine, ce
qu'un logiciel seul ne remplace pas. L'angle 1 survit car même JASCO, qui vend la détection ET l'analyse, décrit
une étape de confirmation humaine distincte de la rédaction, laissant une ouverture pour automatiser spécifiquement
l'assemblage cité du texte de rapport, vendu comme outil aux cabinets (SMRU, Dynamic Ocean, JASCO elle-même, ou les
généralistes Tetra Tech/ERM/Ramboll/WSP) plutôt qu'en concurrence frontale avec eux.

## Terre à terre

**Acheteur** : coordinateur ou chargé de projet environnemental dans un cabinet déjà sous-traitant de l'analyse
acoustique (SMRU Consulting, Dynamic Ocean Consulting) ou dans un cabinet généraliste (Tetra Tech ex-RPS, ERM,
Ramboll, WSP) qui doit livrer la section acoustique d'un rapport de suivi sans bioacousticien interne. Dépense
actuelle : journée d'observateur MMO/PAM entre 200 et 700 $US selon séniorité (vérifiée, crewbase.pro, dossier
bureaux-labos) ; coût précis d'une section de rapport rédigée non trouvé (estimation, à confirmer par devis direct).
Le bon de commande de 2 000 $ est signé par ce même coordinateur, sans validation supérieure, s'il s'agit d'un test
sur un seul rapport ou une seule fenêtre temporelle.

**Fonctionnalités (ordre de vente)** :
1. Charger les journaux de détection déjà produits par PAMGuard ou PAMlab pour une fenêtre et une zone.
2. Croiser avec l'archive ONC Oceans 3.0 et Boundary Pass si le site s'y prête (vérifié géographiquement au cas
   par cas).
3. Rédiger la section acoustique citant chaque détection, sa source et son horodatage.
4. Signaler les détections à faible confiance pour validation humaine (pas d'auto-publication sans revue).
5. Générer une version comparant l'année en cours aux années précédentes du même site (suivi pluriannuel).
6. Exporter au format attendu par le cabinet ou le régulateur.
L'IA fait précisément : la mise en texte citée et structurée à partir de détections déjà produites par un
classificateur (PAMGuard ou JASCO), pas la détection elle-même. Vérifié : le vide de la couche rapport (source
citée ci-dessus). Supposé : que le format de sortie attendu par les régulateurs de C.-B. (Agence d'évaluation
d'impact du Canada) est suffisamment homogène pour être généré automatiquement — non confirmé faute de lecture
d'un rapport réel dans le budget imparti.

**Prix et modèle** : abonnement par site suivi, facturé à la fenêtre de rapport (ex. rapport annuel) plutôt qu'à
l'heure d'analyste ; le client revient l'année suivante car chaque site a un suivi pluriannuel obligatoire (années
1, 3, 5) et l'historique déjà structuré par PAM-Miner devient plus rapide et moins cher à comparer d'une année sur
l'autre que de recommencer avec un nouveau prestataire (Q7).

**Faisabilité depuis Vancouver** : données ONC accessibles via data.oceannetworks.ca, licence affichée comme
« freely shared, used and built on without restrictions » avec citation requise (vérifiée en partie, oceannetworks.ca
/data ; page « Data Policy » précise non atteinte, 403, à confirmer directement). Boundary Pass : opérateur
Transports Canada, accès et licence non vérifiés cette session (supposée, hérité du dossier agences-donnees).
Matériel : aucun, traitement de journaux texte/CSV déjà produits par des tiers, pas de flux audio brut à traiter
au démarrage. Blocage réel : obtenir les journaux de détection PAMGuard ou PAMlab d'un vrai projet en cours, ce qui
suppose la coopération d'un cabinet (SMRU, Dynamic Ocean, un généraliste) plutôt qu'un accès public direct.

**La preuve se retourne-t-elle contre l'acheteur** : oui, potentiellement. Woodfibre LNG est en désaccord public
avec Environnement et Changement climatique Canada sur la taille de la zone d'exclusion (7 km demandés à réduire
à 125 m) (vérifiée, theglobeandmail.com et woodfibrelng.ca) : un rapport plus précis et mieux sourcé peut
documenter des dépassements que le promoteur préférerait ne pas voir formalisés. L'architecture l'évite en
livrant toujours la sortie comme brouillon à validation humaine du client (pas de dépôt automatique au
régulateur), et en facturant le cabinet consultant plutôt que le promoteur directement, pour que la décision de
publication reste entièrement du côté du client.

**Test à moins de 2 000 $ et deux semaines** : obtenir un jeu réel de détections PAMGuard (gratuit, données
publiques ou d'essai) sur une fenêtre de 30 jours dans le secteur Boundary Pass, générer une section de rapport
citée, et la faire évaluer à l'aveugle par un bioacousticien indépendant contre un extrait d'un vrai rapport SMRU
ou JASCO publié. Critère chiffré : au moins 80 % des citations exactes (source, horodatage, espèce) jugées
correctes par l'évaluateur, sans invention de détection absente du journal source.

**Incertain** : couverture géographique réelle de NEPTUNE/VENUS pour Howe Sound et le chenal Douglas ; contenu
exact du format de section acoustique attendu par l'Agence d'évaluation d'impact du Canada ; licence précise
Boundary Pass ; volonté réelle de SMRU/JASCO/Dynamic Ocean d'acheter un outil qui réduit leurs heures facturables
plutôt que de le vivre comme une menace. Question au client (un coordinateur de cabinet généraliste type Tetra
Tech/ERM) : combien de temps et d'argent votre équipe passe-t-elle aujourd'hui à transformer un journal de
détections déjà produit en texte de rapport citable, et accepteriez-vous un outil facturé au site plutôt qu'à
l'heure d'analyste ?

## Résumé (8 lignes)
PAM-Miner cible la rédaction de la section acoustique, pas la détection : PAMGuard (gratuit) et JASCO PAMlab
(payant) détectent déjà, mais les deux nécessitent une confirmation humaine et ne rédigent pas le rapport, un vide
confirmé par les deux dossiers d'origine. Le vrai risque est que les cabinets qui dominent ce marché en
Colombie-Britannique (SMRU Consulting, JASCO, et un concurrent local direct, Dynamic Ocean Consulting) vendent
déjà l'analyse et la rédaction en bloc : le produit doit donc se vendre comme outil interne à ces cabinets, pas
comme concurrent frontal. La couverture géographique de l'archive publique ONC ne colle qu'à une partie des
projets cités (secteur RBT2/mer des Salish), pas à Howe Sound (Woodfibre) ni au chenal Douglas (LNG Canada, Cedar
LNG), ce qui limite l'angle « archive partagée revendue plusieurs fois ». Le litige public Woodfibre sur la zone
d'exclusion montre qu'un rapport plus précis peut jouer contre le promoteur ; livrer un brouillon à validation
humaine, facturé au cabinet, protège l'acheteur. Prix exact de la section de rapport aujourd'hui : introuvable
dans le budget imparti, estimation seulement via le tarif journalier MMO/PAM (200 à 700 $US). Le test proposé
compare un rapport généré à un extrait publié, avec un seuil de citations exactes à 80 %.
