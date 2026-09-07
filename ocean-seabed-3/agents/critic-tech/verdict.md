# Verdict technologique : les douze idées « Fonds marins » (passe 3)

Agent : critic-tech (architecte logiciel et data, vision par ordinateur, télédétection, géomatique) · 7 septembre 2026.
Pièces lues : `ocean-seabed-3/BRIEF.md`, `IDEAS.md`, les huit `agents/*/dossier.md` (en particulier
`tech-underwater-ai/dossier.md`), et `ocean-plastic-2/agents/critic-tech/verdict.md` pour le niveau d'exigence.
**Zéro recherche web** (contrainte du mandat) : je travaille sur pièces et sur mon expertise, et je signale
explicitement chaque point où je contredis un dossier.

---

## Avertissement de méthode (à lire avant le tableau)

> **Aucun chiffre d'effort, de coût ou de note ci-dessous n'est sourcé.** Ce sont des jugements d'ingénieur.
> Les faits techniques (jeux de données, licences, prix matériel, limites de méthode) viennent des huit dossiers,
> et quand je les contredis je le dis en toutes lettres.

**Effort m-i contre calendrier solo.** L'« effort » est en mois-ingénieur au sens d'une équipe de 2 à 4 personnes,
pour rester comparable aux chiffres d'`IDEAS.md`. Hypothèse assumée pour la conversion : **un fondateur seul avec
Claude produit environ 0,6 m-i utile par mois calendaire**. Claude accélère fortement le code (pipelines, parsing,
SIG, gabarits de rapport, tableaux de bord : facteur 2 à 3) et **n'accélère pas du tout** : la collecte terrain,
l'annotation, l'intégration matérielle en milieu salin, la négociation d'accès aux données du client, la vente et
l'attente réglementaire. Sur les idées 2, 3, 5, 7 et 10, le chemin critique n'est pas du code et le facteur tombe
à 0,3 ou 0,4. **Traduction directe : « 4 à 6 mois-ingénieur » dans `IDEAS.md` signifie 8 à 14 mois calendaires
pour ce fondateur.** Aucune des douze idées n'est livrable et facturable en moins de 6 mois dans sa forme complète ;
plusieurs le sont en version amputée, et je dis laquelle.

**Coût de poche k$ CAD** = sorties de trésorerie sur 12 mois, hors salaire du fondateur : matériel du commerce,
cloud et GPU, API et licences, analyses de laboratoire, temps bateau, traversiers et déplacements, assurance
responsabilité civile et professionnelle, frais juridiques. C'est la seule lecture compatible avec le plafond de
25 k$ CAD du brief.

**Conventions de notation (1 à 5, cinq axes, total sur 25).** Les cinq axes se lisent tous dans le même sens :
5 est toujours bon.

| Axe | 1 signifie | 5 signifie |
|---|---|---|
| **Faisabilité solo < 6 mois** | rien de facturable avant 12 mois | quelque chose de facturable avant 6 mois, seul |
| **Maturité des briques** | modèles de recherche, licences floues, matériel sur devis | données ouvertes, modèles sous licence permissive, matériel du commerce documenté et daté |
| **Coût de poche / 25 k$** | crève le plafond avant le premier client | moins de 5 k$ CAD sur 12 mois |
| **Barrière technique réelle** | un développeur compétent refait tout en 3 mois | corpus ou méthode non rétro-constructible sans refaire le terrain |
| **Risque technique masqué** | un verrou physique ou juridique non identifié peut tuer le produit | pas de verrou caché : les risques sont connus et bornés |

---

## Tableau de synthèse

| # | Idée | Faisab. < 6 m | Maturité | Coût / 25 k$ | Barrière | Risque masqué | **Note /25** | Effort m-i | Coût k$ CAD | Risque masqué principal |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| 5 | **SedimentIQ** | 5 | 4 | 5 | 3 | 3 | **20** | 3-5 | 3-7 | La vidéo d'entraînement documente la non-conformité du client : il ne la cédera pas facilement |
| 4 | **ReefInjury** | 4 | 4 | 4 | 4 | 3 | **19** | 4-6 | 6-12 | Plonger contre rémunération en Floride depuis Vancouver : permis de sanctuaire, statut de plongeur, assurance |
| 9 | **DiveAtlas** | 4 | 4 | 5 | 4 | 2 | **19** | 4-6 | 3-8 | L'indice acoustique de santé n'est pas transposable aux récifs tempérés bruyants du Salish |
| 7 | **BenthicPipe** | 3 | 4 | 5 | 3 | 3 | **18** | 5-8 | 3-8 | L'IA vidéo n'attaque pas le gros du coût du relevé (taxonomie de laboratoire sur bennes, sous AQ NMBAQC) |
| 8 | **SpongeSentinel** | 5 | 4 | 5 | 1 | 2 | **17** | 2-4 | 2-6 (30 avec AIS satellite) | Conditions d'usage de l'API GFW : gratuité pour recherche et impact, pas pour revendre des alertes |
| 12 | **SeafloorLedger** | 4 | 4 | 5 | 2 | 2 | **17** | 3-5 | 2-5 | Le seuil D6C5 n'est pas adopté : publier un dépassement, c'est inventer le seuil |
| 11 | **ColonyTrack** | 2 | 3 | 4 | 5 | 2 | **16** | 6-9 | 6-11 | La SfM échoue sur les branches fines des Acropora, l'espèce même de la restauration floridienne |
| 1 | **ScarMap** | 3 | 3 | 4 | 3 | 2 | **15** | 5-8 | 6-12 | La variance saisonnière de la zostère dépasse le signal d'ancrage qu'on prétend mesurer |
| 6 | **KelpPulse** | 3 | 3 | 4 | 3 | 2 | **15** | 5-8 | 6-12 | Les barrens d'oursins, seule chose que le client veut voir, sont invisibles depuis l'air et l'espace |
| 10 | **OffsetLedger** | 3 | 3 | 3 | 3 | 2 | **14** | 5-8 | 9-16 | Le payeur (le promoteur) n'a aucun intérêt à une mesure indépendante plus dure que la sienne |
| 2 | **PosidoniaProof** | 3 | 3 | 3 | 2 | 2 | **13** | 5-7 | 9-16 | Les cartes d'herbiers (Donia, Medtrix) appartiennent à Andromède : sans licence, pas de produit |
| 3 | **PlumeWatch** | 3 | 3 | 2 | 3 | 2 | **13** | 5-8 | 14-26 | Une station de turbidité télémétrée réelle coûte 4 à 8 k$, pas 500 à 2 000 $, et s'encrasse en 5 à 10 jours |

*La note est strictement technologique : elle ignore la taille du marché, le prix de vente et l'appétence des
acheteurs, que critic-vc et critic-ocean jugent mieux que moi. Une idée peut être techniquement propre et
commercialement morte : c'est le cas de DiveAtlas, et je le dis dans sa fiche.*

---

## Fiches par idée

### 5. SedimentIQ, note 20 : la seule idée où le protocole du régulateur EST la spécification du modèle

**Notes** : faisabilité 5, maturité 4, coût 5, barrière 3, risque masqué 3.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : aucun côté client (on consomme la vidéo ROV que le bureau d'études tourne déjà) ; côté fondateur, un GPU (RTX 4090 d'occasion, 2 000 à 2 800 $ CAD) ou du cloud à la demande.
2. *Capteurs* : caméra du ROV existant, plus les deux pointeurs laser parallèles déjà présents sur la plupart des ROV d'inspection aquacole (ils donnent l'échelle de l'image).
3. *Modèle* : segmentation sémantique 3 classes (tapis de Beggiatoa, complexe d'opportunistes, substrat) par SAM2 amorcé pour la préannotation puis un DeepLabv3+ ou Mask2Former affiné sur 800 à 1 500 images ; RF-DETR (Apache 2.0) inutile ici, ce n'est pas un problème de boîtes.
4. *Pipeline* : extraction ffmpeg par segment de transect, inférence, agrégation du pourcentage de couverture par segment, application de la règle MPO (plus de 10 % sur plus de 4 des 6 segments, bande 100 à 124 m), sortie binaire de dépassement.
5. *Stockage* : PostGIS (site, cycle de production, transect, segment, image) plus objets vidéo sur S3 compatible ; trajectoire de récupération par site sur plusieurs années.
6. *Interface* : revue humaine image par image (l'IA propose, l'analyste confirme, chaque correction réentraîne), plus un générateur de rapport au gabarit MPO.
7. *Construit avec Claude* : la totalité du logiciel, y compris l'outil d'annotation, l'agrégation par segment et le gabarit de rapport. C'est un chantier de code pur.
8. *Acheté* : GPU, hébergement, et surtout du **temps d'annotation expert** (un biologiste benthique à la journée pour valider la vérité terrain).

**Effort 3 à 5 m-i, coût 3 à 7 k$ CAD.** C'est l'idée la plus légère des douze.
**Promesses à corriger.** (a) « rapport au format MPO **ou** SEPA » : le seuil MPO (couverture visuelle par segment) et le régime SEPA (modélisation de zone d'effet, notation propre, bennes) sont deux protocoles distincts. Le modèle est lié au protocole : l'Écosse est un nouveau jeu d'annotation, pas un export. (b) Le produit ne remplace pas le régulateur : le MPO accepte la vidéo et le jugement d'une personne qualifiée, pas votre modèle. Positionner en accélérateur d'annotation et en générateur de rapport, jamais en substitut de conformité.
**Risque masqué n°1** : la vidéo d'entraînement documente les dépassements du client. Trois producteurs (Mowi, Grieg, Cermaq) et deux ou trois bureaux d'études tiennent tout le corpus, et cette vidéo est une pièce potentiellement opposable. **Sans accord écrit d'usage pour l'entraînement, il n'y a pas d'actif.** Second risque, calendaire : les cages ouvertes ferment en Colombie-Britannique après 2029 ; l'actif doit donc être porté vers l'Écosse ou le Chili, ce qui coûte un nouveau corpus.
**Dérisquage, 2 semaines, moins de 1 000 $.** Obtenir de Dynamic Ocean Consulting (30 minutes de Vancouver) ou de Hatfield trois à cinq vidéos de fonds durs **déjà annotées selon le protocole MPO**, donc avec la vérité terrain du bureau d'études. Annoter 800 images, entraîner, comparer le pourcentage de couverture par segment. Seuil de décision : écart absolu inférieur à 3 points sur les 6 segments **et** accord parfait sur la décision binaire de dépassement. Le vrai test n'est pas le modèle, c'est l'accord de mise à disposition : s'il est refusé, l'idée meurt là, en deux semaines et pour 200 $ de GPU.

### 4. ReefInjury, note 19 : la mesure la plus défendable du mandat, à condition de sortir le splatting

**Notes** : faisabilité 4, maturité 4, coût 4, barrière 4, risque masqué 3.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : deux GoPro Hero sur une barre rigide plus deux torches vidéo (2 000 à 3 000 $ CAD), et **deux barres d'échelle rigides gravées** (100 $, c'est la pièce la plus importante du kit).
2. *Capteurs* : appareil photo seul ; ni ROV ni sonar dans le MVP (le BlueROV2 à 4 900 $ US est une dépense d'image, pas de mesure, sur un site à moins de 20 m).
3. *Modèle* : segmentation assistée (SAM2 amorcé par clic, CoralSCOP affiné en secours) pour pré-délimiter la zone blessée ; la délimitation finale est humaine.
4. *Pipeline* : SfM COLMAP ou Metashape Standard (179 $, licence perpétuelle), nuage dense, maillage, orthomosaïque géoréférencée par les barres d'échelle, mesure de surface avec **budget d'erreur publié**.
5. *Stockage* : PostGIS plus modèles 3D versionnés ; base d'incidents comparables (surface, espèces, comté, barème appliqué) qui devient l'actif.
6. *Interface* : éditeur de polygone de blessure avec double validation, puis calculateur du barème Fla. Stat. §403.93345 (150 $ jusqu'à 1 m², 300 $/m² de 1 à 10 m², 1 000 $/m² au-delà, majorations et multiplicateurs de récidive, plafond 250 000 $).
7. *Construit avec Claude* : orchestration SfM, outil de délimitation, calculateur de barème, gabarit de rapport d'expertise, base de comparables.
8. *Acheté* : caméras, torches, barres d'échelle, Metashape, assurance responsabilité professionnelle et plongée, et l'accès terrain (opérateur local).

**Effort 4 à 6 m-i, coût 6 à 12 k$ CAD.**
**Promesses à corriger.** (a) « Gaussian splatting sous-marin » comme méthode de mesure : le 3DGS est une représentation de **rendu**, pas de métrologie. Il ne produit ni surface maillée validée ni budget d'erreur, et en extraire une géométrie (SuGaR, 2DGS) réintroduit toute l'erreur qu'on cherchait à éviter. Le splatting reste excellent pour la visualisation client. La mesure vient de la SfM classique avec barres d'échelle. (b) CoralSCOP pour distinguer « corail vivant, mort, substrat cassé » : CoralSCOP sépare corail et non-corail, forme de croissance et genre, sur des photo-quadrats tropicaux ; la classe « squelette fraîchement cassé » n'existe dans aucun jeu ouvert. (c) Pour une pièce opposable, l'IA pré-trie et l'humain délimite, avec taux d'erreur connu et publié (logique Daubert, déjà établie dans la passe 2).
**Risque masqué n°1, non technique et lourd** : travailler contre rémunération dans le Florida Keys NMS suppose un permis de sanctuaire, et plonger professionnellement aux États-Unis suppose soit un statut de plongeur scientifique sous organisation membre, soit la conformité plongée commerciale, plus une assurance. Un fondateur canadien seul ne remplit rien de tout cela. Correction d'architecture : **le produit est le logiciel et le protocole, licenciés à des opérateurs locaux qui capturent** ; le fondateur ne plonge pas en Floride. Second risque : le FDEP est « lead trustee », un prestataire ne peut pas servir l'État et l'armateur dans le même dossier.
**Dérisquage, 2 semaines, moins de 1 000 $.** Deux sorties sur un site connu près de Vancouver (Whytecliff Park, ou l'épave du HMCS Annapolis), deux barres d'échelle, 300 à 600 photos par capture. Mesurer cinq surfaces au ruban en plongée, les comparer au modèle, **et refaire la capture une seconde fois pour mesurer la répétabilité inter-campagne**. Seuil : erreur inférieure à 5 % sur la surface et dispersion inter-captures inférieure à 3 %. En dessous, le rapport n'est pas opposable et l'idée n'existe pas.

### 9. DiveAtlas, note 19 : le meilleur actif de données du mandat, sur le pire client du mandat

**Notes** : faisabilité 4, maturité 4, coût 5, barrière 4, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : cadres de photo-quadrat de 50 cm imprimés ou en PVC (20 $ pièce), caméras déjà possédées par les plongeurs. Aucun achat lourd.
2. *Capteurs* : photo-quadrat avec échelle physique dans le champ, plus profondeur et température du profondimètre. **Pas d'hydrophone dans le MVP** (voir promesses).
3. *Modèle* : classifieur d'espèces indicatrices et envahissantes affiné (dorsale DINOv2 via RF-DETR, Apache 2.0) sur un corpus local, avec l'API iNaturalist comme référence de comparaison obligatoire.
4. *Pipeline* : saisie hors ligne, synchronisation, contrôle qualité automatique (netteté, présence du cadre, géolocalisation plausible), inférence, file de validation humaine.
5. *Stockage* : PostGIS, atlas régional par site et par saison, corpus d'images annotées du Pacifique Nord-Ouest en eaux froides : **c'est le seul actif, et il n'est pas rétro-constructible sans refaire les plongées**.
6. *Interface* : application mobile de saisie post-plongée, carte publique, tableau de bord gestionnaire, règles d'alerte sur espèces à surveiller (crabe vert européen, tuniciers).
7. *Construit avec Claude* : l'application, la synchronisation hors ligne, le contrôle qualité, l'entraînement, l'atlas, les alertes.
8. *Acheté* : cadres, temps bateau, GPU modeste, et de la formation de plongeurs (le poste que Claude n'accélère pas).

**Effort 4 à 6 m-i, coût 3 à 8 k$ CAD.**
**Promesses à corriger.** (a) **Je contredis ici le dossier `tech-underwater-ai`** (fiche 5 et opportunité SoundReef) : la littérature d'indices acoustiques de santé récifale est tropicale et repose sur le chœur des crevettes-pistolets et des poissons, absent des récifs tempérés du Salish. Sur l'un des corridors maritimes les plus bruyants d'Amérique du Nord, un hydrophone à 50 € performant mal sous 200 Hz mesure le trafic maritime, pas la santé du fond. La brique acoustique est un produit différent (bruit anthropique), pas un indice de santé. (b) Une bouée permanente exige une autorisation au titre de la Loi sur les eaux navigables canadiennes : plusieurs semaines de délai, absentes du document. (c) Un photo-quadrat de plongeur bénévole sans échelle dans le champ ne produit pas un pourcentage de couverture comparable : le cadre est obligatoire, pas optionnel.
**Risque masqué n°1** : iNaturalist couvre déjà les taxons marins du Pacifique Nord-Ouest avec un modèle gratuit et une API. Si votre classifieur ne bat pas iNaturalist sur vos 20 taxons indicateurs, votre brique IA n'est pas l'actif, et le produit se réduit au protocole plus la base : honnête, mais copiable. Second risque, commercial et non technique : les clubs sont des associations bénévoles peu solvables ; le corpus se finance par la licence aux agences, pas par l'abonnement club.
**Dérisquage, 2 semaines, moins de 700 $.** Deux sorties avec les deux clubs, 400 photo-quadrats sur deux sites, **double annotation par deux plongeurs** et calcul du kappa inter-annotateurs, puis comparaison d'un classifieur affiné contre l'API iNaturalist sur les mêmes images. Seuil : si le kappa humain est inférieur à 0,6, le protocole n'est pas assez serré ; si iNaturalist fait aussi bien que votre modèle, la valeur est le protocole et la base, et le discours IA doit être révisé.

### 7. BenthicPipe, note 18 : le meilleur socle de données ouvertes, sur la mauvaise ligne budgétaire

**Notes** : faisabilité 3, maturité 4, coût 5, barrière 3, risque masqué 3.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : aucun. C'est la seule idée entièrement logicielle avec SeafloorLedger.
2. *Capteurs* : vidéo tractée (DDV) et ROV fournies par le bureau d'études, avec leur fichier de navigation (USBL ou GPS de surface).
3. *Modèle* : dorsale pré-entraînée sur BenthicNet (887 533 annotations, taxonomie WoRMS, publication ouverte), affinée sur le corpus du premier client ; SAM2 pour la segmentation de substrat.
4. *Pipeline* : **la brique difficile et sous-estimée est la fusion vidéo-navigation** (recaler l'horodatage image sur la position, corriger la dérive), pas le modèle ; puis échantillonnage d'images, classification, calcul de pourcentage de substrat, proposition de biotope EUNIS ou MNCR.
5. *Stockage* : PostGIS, corpus client cloisonné par contrat, versionnage des modèles par client.
6. *Interface* : atelier d'annotation semi-automatique (l'analyste corrige, chaque correction réentraîne), export au schéma MMO et BOEM, comparaison avant, pendant, après.
7. *Construit avec Claude* : ingestion, fusion navigation, atelier d'annotation, mappings de taxonomie, exports réglementaires.
8. *Acheté* : GPU, et un audit d'annotation payant par un taxonomiste reconnu (c'est ce qui rend l'outil vendable, pas la précision brute).

**Effort 5 à 8 m-i, coût 3 à 8 k$ CAD.**
**Promesses à corriger.** (a) **Je contredis le dossier `industry-benthic-surveys`** dans l'usage qu'`IDEAS.md` en fait : les 1,2 M£ d'un relevé benthique par GW ne sont pas majoritairement de l'annotation vidéo. L'essentiel est la taxonomie de laboratoire sur bennes (macrofaune identifiée à l'espèce par des taxonomistes, sous assurance qualité par ring-test), plus le temps navire. La ligne adressable est la DDV et le ROV seuls, une minorité du total : le calcul de marché doit être refait. (b) L'attribution d'un biotope EUNIS ou MNCR combine substrat, énergie, profondeur et cortège d'espèces : ce n'est pas une classification image par image. Le modèle propose, l'analyste tranche. (c) La norme MMO du 16/07/2025 standardise la **méthode** de collecte et de stockage, elle n'impose pas un format de sortie qu'un logiciel pourrait remplir automatiquement : la promesse « export au format MMO » doit être validée sur une Marine Licence réelle avant d'être vendue.
**Risque masqué n°1** : les licences des jeux d'entraînement ne sont jamais auditées dans `IDEAS.md`. Le dossier technique note lui-même que CoralNet, FathomNet et SQUIDLE+ n'affichent pas de licence explicite, et une partie des imageries agrégées dans BenthicNet vient de sources en clauses non commerciales. **Entraîner un modèle vendu en SaaS sur de la donnée NC est une erreur coûteuse à corriger après la première facture.** Second risque : BOEM a résilié les Wind Energy Areas en juillet 2025, donc le marché américain est gelé et il ne reste que le Royaume-Uni, où Fugro et APEM développent en interne.
**Dérisquage, 2 semaines, moins de 800 $.** Obtenir d'un bureau d'études britannique deux heures de vidéo DDV **avec sa feuille d'annotation d'analyste**. Prédire, puis calculer le kappa de Cohen contre l'analyste. Seuil : kappa supérieur à 0,6 sur le substrat et supérieur à 0,4 sur les taxons indicateurs, sinon on ne vend qu'un lecteur vidéo. En parallèle, une question écrite au schéma d'assurance qualité britannique : une annotation assistée par modèle est-elle recevable, et sous quelles conditions ? La réponse vaut plus que six semaines de code.

### 8. SpongeSentinel, note 17 : deux semaines de code, aucune barrière, et un problème de conditions d'usage

**Notes** : faisabilité 5, maturité 4, coût 5, barrière 1, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : aucun pour le MVP. Un récepteur AIS de quai (dAISy ou équivalent, 150 à 400 $ CAD) uniquement pour les zones côtières proches (Rockfish Conservation Areas près de Steveston).
2. *Capteurs* : flux AIS, terrestre pour la côte, satellite (payant) pour le large.
3. *Modèle* : aucun modèle profond nécessaire. Classement de comportement par règles et arbre de décision sur vitesse, cap, persistance et sinuosité dans le polygone : la méthode est publiée depuis 2018 et se reproduit en une semaine.
4. *Pipeline* : ingestion AIS, appariement spatial PostGIS contre les polygones, détection d'entrée et de séjour, alerte, journal exportable horodaté.
5. *Stockage* : PostGIS avec historique complet des pistes ; le seul actif possible est **l'historique d'incidents accumulé**, pas les polygones (publics via données ouvertes MPO, EMODnet, base VME de la CIEM).
6. *Interface* : carte, règles d'alerte par zone, notification courriel et SMS, export de dossier de preuve.
7. *Construit avec Claude* : la totalité, en 6 à 10 semaines.
8. *Acheté* : l'accès aux données AIS si le régime gratuit ne couvre pas l'usage (voir ci-dessous), et rien d'autre.

**Effort 2 à 4 m-i, coût 2 à 6 k$ CAD, ou 12 à 30 k$ si l'AIS satellite devient obligatoire.**
**Promesses à corriger.** (a) « API Global Fishing Watch gratuite, 70 000 navires » comme socle d'un abonnement à 150 à 800 $ par mois : la gratuité de GFW est accordée pour un usage de recherche et d'impact avec attribution, et revendre des alertes dérivées est un usage commercial qui n'est pas couvert par ce régime. Le dossier technique note lui-même que les quotas cités (50 000 requêtes par jour) viennent d'une source tierce non recoupée. **À trancher par écrit avec GFW avant la première facture.** (b) « récepteur AIS local (AISHub) » pour surveiller Hecate Strait : un récepteur côtier porte 40 à 70 km en VHF, les récifs d'éponges sont à 60 à 150 km au large. Il faut de l'AIS satellite, payant, et AISHub fonctionne par réciprocité non commerciale. (c) « option SAR commercial (ICEYE) pour les navires sans AIS » : une scène programmée coûte de l'ordre de plusieurs centaines à quelques milliers de dollars, et détecter un navire de 15 m par mer formée demande un traitement de fouillis de mer sérieux. Le SAR est un contrôle ponctuel, pas une couche de surveillance continue.
**Risque masqué n°1** : l'AIS détecte les navires conformes, pas les contrevenants. L'amende de 33 596 $ de mai 2024 vient d'un contrôle du MPO, pas d'une alerte AIS. Second risque, décisif : la flotte de poisson de fond de Colombie-Britannique est déjà sous VMS et sous surveillance électronique à bord. **Le client dispose d'une donnée meilleure que la vôtre.** Barrière notée 1 en connaissance de cause : tout est public, la méthode est publiée, un développeur compétent refait le produit en six semaines.
**Dérisquage, 2 semaines, moins de 500 $.** Zéro matériel. (1) Écrire à GFW et obtenir par écrit si un produit d'alerte payant entre dans les conditions gratuites, et demander un devis d'AIS satellite. (2) Rejouer 24 mois d'AIS sur l'AMP de Hecate Strait et **compter les incursions réellement détectables**. Seuil : moins de 5 à 10 incursions par an, il n'y a pas d'alerte à vendre ; réponse négative de GFW, le coût de la donnée détruit le prix de 150 à 800 $ par mois. Dans les deux cas la décision tombe en deux semaines.

### 12. SeafloorLedger, note 17 : une méthode publique, un seuil manquant, un client qui est un concurrent

**Notes** : faisabilité 4, maturité 4, coût 5, barrière 2, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : aucun.
2. *Capteurs* : aucun. Données AIS (GFW), produits d'empreinte de chalutage de la CIEM déjà publiés, cartes d'habitats EMODnet et EUNIS, périmètres Natura 2000.
3. *Modèle* : aucun apprentissage nécessaire. Calcul d'un ratio de surface balayée (swept area ratio) par maille et par polygone, méthode publiée et reproductible.
4. *Pipeline* : ingestion, appariement engin et largeur balayée, agrégation par zone d'évaluation et par habitat de l'annexe II, séries temporelles 2018 à 2026.
5. *Stockage* : PostGIS, indicateurs par zone, versionnage des sources (la traçabilité est le produit).
6. *Interface* : tableaux d'indicateurs, cartes, générateur de rapport au gabarit de la Commission, export des données brutes pour la partie adverse (c'est ce qui rend le rapport crédible).
7. *Construit avec Claude* : la totalité du calcul, des cartes et du rapport.
8. *Acheté* : rien, sauf du calcul cloud et éventuellement un flux AIS de meilleure couverture.

**Effort 3 à 5 m-i, coût 2 à 5 k$ CAD.**
**Promesses à corriger.** (a) « détection de changement satellite **et sonar** pour les habitats peu profonds » : les traces de chalut ne sont lisibles qu'en rétrodiffusion sidescan ou multifaisceaux, matériel dont le fondateur ne dispose pas et qui suppose du temps navire à plusieurs milliers de dollars par jour ; et Sentinel-2 ne voit pas une perturbation benthique. **Cette jambe est à supprimer intégralement** : le produit est un croisement AIS contre cartes d'habitats. (b) « indicateurs D6C3 et D6C4 par zone d'évaluation » vendus comme mesure de perturbation : le dossier `reg-europe-benthic` établit que le seuil de perturbation D6C5 n'est **pas adopté** au 07/09/2026. Publier un dépassement revient à inventer le seuil, ce que la partie adverse attaquera en premier. Mesurer l'étendue de la pression physique, s'arrêter avant le verdict d'état écologique. (c) Biais de couverture jamais mentionné : l'AIS n'est obligatoire qu'au-delà d'une taille de navire, donc les petits chalutiers et dragues côtiers, précisément ceux qui opèrent dans les sites Natura 2000 littoraux, sont systématiquement sous-comptés. Ce biais doit figurer dans le rapport, sinon le rapport est attaquable.
**Risque masqué n°1** : toute la donnée est publique et déjà assemblée par la CIEM, le JRC et EMODnet. La barrière est la méthode et la comparabilité, c'est-à-dire du contenu, copiable. Second risque : Oceana Europe, présenté comme premier client, dispose d'une équipe de données interne et publie ce type d'analyse. **C'est un concurrent, pas un client.** Troisième risque : à 10 à 30 k$ le rapport de contentieux, c'est du conseil au projet, pas un SaaS ; le revenu ne capitalise pas.
**Dérisquage, 2 semaines, moins de 300 $.** Pur travail de bureau. Reproduire, sur une aire marine protégée anglaise, l'empreinte de chalutage à partir des données publiques et la confronter au chiffre déjà publié par une ONG (les 20 000 heures de chalutage en AMP britanniques en 2024 citées dans le dossier européen). Seuil binaire : si vous retrouvez le chiffre à 20 % près, la méthode est juste et sans barrière ; si vous ne le retrouvez pas, la méthode est fausse. En parallèle, demander à deux ONG de contentieux si elles sous-traitent ou font en interne. La réponse décide de l'existence de la société.

### 11. ColonyTrack, note 16 : la seule vraie barrière technique du mandat, et le seul verrou physique non résolu

**Notes** : faisabilité 2, maturité 3, coût 4, barrière 5, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : deux GoPro ou une Insta360 en caisson, deux torches, deux barres d'échelle rigides, une charte colorimétrique immergeable et des **piquets repères permanents** (l'ancrage géométrique, sans lequel rien n'est comparable dans le temps).
2. *Capteurs* : vidéo en balayage régulier à 1 à 1,5 m d'altitude, plus profondeur ; pas de ROV.
3. *Modèle* : segmentation de colonies (CoralSCOP affiné), OCR des étiquettes numérotées déjà posées par les restaurateurs, et re-identification visuelle **en secours seulement**.
4. *Pipeline* : SfM COLMAP ou Metashape, recalage multi-temporel par ICP sur les piquets repères, différence de modèles, extraction de surface projetée et de volume avec barres d'erreur.
5. *Stockage* : base longitudinale par colonie (identifiant, position, surface, volume, état, campagne) : c'est un actif cumulatif qu'un concurrent ne peut pas fabriquer rétroactivement.
6. *Interface* : visionneuse 3D pour le sponsor (là, et uniquement là, le Gaussian splatting a sa place, explicitement étiqueté non métrique), tableau de survie et de croissance, gabarits NFWF et CRCP.
7. *Construit avec Claude* : pipeline SfM, recalage, mesure, OCR, base longitudinale, rapports.
8. *Acheté* : caméras et torches, Metashape (licence Standard), GPU cloud, un déplacement en Floride, assurances.

**Effort 6 à 9 m-i, coût 6 à 11 k$ CAD.** Aucune version facturable avant 10 à 14 mois calendaires en solo : c'est la note 2 en faisabilité.
**Promesses à corriger.** (a) « mesure de croissance par splatting » : faux tel qu'écrit, voir la fiche 4. La SfM classique mesure correctement l'extension annuelle de colonies **massives et encroûtantes** (les Acropora cervicornis poussent de 5 à 15 cm par an, donc le signal existe), mais elle échoue sur les branches fines et auto-occultantes, qui dominent précisément la restauration floridienne. La promesse doit être restreinte par forme de croissance, pas vendue en bloc. (b) « re-identification visuelle des colonies entre campagnes » en 5 à 7 mois : à un an d'écart, avec croissance, blanchissement, épiphytes et éclairage différent, la re-ID purement visuelle est un sujet de recherche. L'architecture réaliste est repère permanent, mosaïque géoréférencée, OCR d'étiquette, la vision en dernier recours. (c) Le « pourcentage blanchi » n'est pas comparable entre campagnes sans charte colorimétrique dans le champ : la constance chromatique sous l'eau varie avec la profondeur et l'éclairage. (d) Bon point à conserver : `IDEAS.md` exclut déjà correctement le diagnostic SCTLD par photo, conformément au dossier technique. Ne pas le réintroduire par la porte du « tri précoce » sans taux d'erreur mesuré.
**Risque masqué n°1** : le bruit de mesure. Si deux captures successives du **même objet inchangé** donnent des volumes qui diffèrent de plus de 5 %, aucune croissance annuelle n'est mesurable, et tout le produit tombe. C'est un test, pas une opinion, et il coûte 700 $ à Vancouver.
**Dérisquage, 2 semaines, moins de 800 $.** Capturer deux fois, à quelques jours d'intervalle, un même massif fixe et non modifié à Whytecliff ou sur une plaque de plaquettes marquées, avec barres d'échelle et charte de couleur. Mesurer la reproductibilité de la surface projetée et du volume entre deux modèles SfM du même objet. Seuil : bruit inférieur à 5 % du volume et à 3 % de la surface. Comparer sur la même scène SfM et 3DGS pour documenter noir sur blanc lequel mesure et lequel décore.

### 1. ScarMap, note 15 : la bonne cible, le mauvais capteur

**Notes** : faisabilité 3, maturité 3, coût 4, barrière 3, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : drone DJI Mini 4 Pro (moins de 250 g, règles Transport Canada allégées, environ 1 100 $ CAD) ou Air 3, filtre polarisant circulaire (anti-réflexion de surface, indispensable), cibles de calage au sol.
2. *Capteurs* : caméra RGB du drone à marée basse extrême ; en subtidal, caméra tractée ou plongée. **Pas de satellite dans le MVP.**
3. *Modèle* : segmentation (SAM2 amorcé, puis U-Net ou DeepLab sur orthomosaïque 4 bandes) pour délimiter herbier et cicatrice ; RF-DETR est le mauvais outil, une cicatrice est un polygone sinueux dont on veut la surface, pas une boîte.
4. *Pipeline* : orthomosaïque (OpenDroneMap ou Metashape) à 2 à 5 cm par pixel, normalisation radiométrique entre vols, détection de changement contrainte par la marée et la phénologie.
5. *Stockage* : PostGIS, polygones d'herbiers et de cicatrices datés, métadonnées de marée, de turbidité et d'heure solaire (sans elles, deux relevés ne sont pas comparables).
6. *Interface* : tableau de bord gestionnaire, rapport annuel, plus une couche de geofencing exportable vers une application plaisancier (la partie triviale).
7. *Construit avec Claude* : pipeline orthomosaïque, segmentation, détection de changement, tableau de bord, rapport, application.
8. *Acheté* : drone, filtre, certificat et assurance RPAS, traversiers et temps bateau, **et surtout les autorisations de vol**.

**Effort 5 à 8 m-i, coût 6 à 12 k$ CAD.**
**Promesses à corriger.** (a) « détection de cicatrices d'ancre » sur Sentinel-2 (10 m) et Planet (3 m) : une cicatrice fait 1 à 3 m de large. À travers 3 à 8 m d'eau, avec réflexion de surface, marée et turbidité variables, c'est physiquement impossible. Le satellite sert au mieux à délimiter grossièrement des herbiers en eau claire. (b) « capacité vérifiée jusqu'à 10 m de profondeur » : ce chiffre de l'Allen Coral Atlas vaut pour des eaux tropicales claires. En mer des Salish (panache du Fraser, blooms printaniers), la limite utile tombe à 0 à 2 m, et seulement à marée basse. Le dossier technique pose la restriction, `IDEAS.md` l'a perdue en route. (c) « mesurer si les cicatrices se referment entre deux relevés » : la canopée de zostère varie énormément d'une saison à l'autre. **La variance naturelle dépasse le signal d'ancrage** tant que les deux relevés ne sont pas appariés en marée, en heure solaire et en phénologie. (d) Contrainte absente du document : Parcs Canada interdit l'usage de drones dans les parcs nationaux sans permis, ce qui vise directement la Gulf Islands National Park Reserve, premier terrain cité.
**Risque masqué n°1** : côté canadien il n'y a **aucune obligation**, seulement des recommandations (le dossier `canada-pnw-benthic` est explicite). Sans obligation, le gestionnaire achète un rapport, pas un abonnement. Côté floridien, le suivi des cicatrices d'herbiers se fait depuis vingt-cinq ans par photographie aérienne sous contrat d'agence : l'absence de concurrent commercial n'est pas un vide, c'est un marché internalisé.
**Dérisquage, 2 semaines, moins de 1 500 $.** Deux grandes marées basses d'été à Montague Harbour et Winter Cove, deux orthomosaïques à 2 cm par pixel, puis vérification en apnée ou en plongée de dix cicatrices au ruban. Mesurer trois choses : le pourcentage de cicatrices vues du ciel, l'écart de surface entre mesure aérienne et mesure en eau, et la répétabilité entre deux vols à une semaine d'écart. Seuil : moins de 50 % détecté ou plus de 30 % d'écart, la voie optique aérienne sort et le produit devient un produit de plongée et de ROV, à repositionner et à repricer.

### 6. KelpPulse, note 15 : le satellite voit la canopée, le client veut voir les oursins

**Notes** : faisabilité 3, maturité 3, coût 4, barrière 3, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : drone (1 100 à 2 500 $ CAD) pour l'intertidal à marée zéro ; caméra tractée ou plongée pour le subtidal.
2. *Capteurs* : Sentinel-2 et Landsat (gratuits, via un catalogue infonuagique), drone RGB, vidéo de transect.
3. *Modèle* : indice de canopée par démélange spectral et seuillage, puis classifieur affiné (kelp de surface, zostère intertidale, sable, roche) ; comptage d'oursins par détection sur vidéo de transect (là seulement l'IA a du sens).
4. *Pipeline* : **filtre d'acquisition marée et courant** appliqué avant toute analyse (une image acquise à courant fort ne montre pas la canopée qui est immergée), normalisation radiométrique, série temporelle par lit.
5. *Stockage* : PostGIS, surface de canopée par lit et par date, incertitude explicite par date.
6. *Interface* : cartes de tendance, alertes de perte, générateur de rapport biennal au format demandé par la loi de Washington.
7. *Construit avec Claude* : ingestion, filtre marée, indices, séries temporelles, rapports.
8. *Acheté* : drone, certificat et assurance RPAS, temps bateau, calcul.

**Effort 5 à 8 m-i, coût 6 à 12 k$ CAD.**
**Promesses à corriger.** (a) « détection automatique des barrens d'oursins » depuis le satellite et le drone : les barrens sont à 5 à 20 m de fond en eau verte. Ni Sentinel-2, ni Planet, ni un drone ne les voient. Seules la vidéo ROV ou de plongée, et éventuellement la rétrodiffusion multifaisceaux, y accèdent. C'est la fonction que le client veut le plus, et c'est celle qui n'existe pas dans l'architecture proposée. (b) Cartographie de la zostère par Sentinel-2 en mer des Salish, appuyée sur la carte mondiale publiée en 2026 : ce produit mondial est dominé par des eaux claires ; en estuaire tempéré turbide, la classe zostère n'est pas séparable à 10 m. **Ici je rejoins le dossier `canada-pnw-benthic`, qui écrit bien « capacité supposée », et je contredis `IDEAS.md`, qui l'a promue en capacité acquise.** (c) Nereocystis a une canopée fine, saisonnière (juillet à octobre) et **immergée par le courant** : la variance intra-saison d'un même lit peut dépasser la tendance interannuelle qu'on prétend vendre. Sans filtre marée et courant, la série temporelle mesure la marée. (d) Washington DNR conduit des survols aériens annuels du kelp depuis 1989 : c'est une série de trente-cinq ans en interne, on ne la concurrence pas, on s'y branche.
**Risque masqué n°1** : le produit vendable est le suivi de canopée de surface d'une seule espèce, alors que les objectifs de la loi de Washington portent sur kelp **et** zostère, dont la zostère subtidale que le capteur ne voit pas. Le produit ne peut pas remplir le rapport biennal seul.
**Dérisquage, 2 semaines, moins de 400 $.** Aucune acquisition. Reprendre dix ans d'archive Landsat et Sentinel-2 sur trois lits de bull kelp de Howe Sound déjà cartographiés par Ocean Wise ou Hakai, calculer la surface de canopée par date, comparer aux cartes existantes, et **quantifier la dispersion intra-saison à date de marée comparable**. Seuil : si la dispersion intra-saison dépasse la tendance interannuelle, le produit satellite ne mesure rien de vendable et il faut basculer sur le drone et le transect.

### 10. OffsetLedger, note 14 : le bon cadre réglementaire, le mauvais payeur, et deux briques qui ne tiennent pas

**Notes** : faisabilité 3, maturité 3, coût 3, barrière 3, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : ROV léger (Chasing M2 Pro à environ 3 500 $ US, ou QYSEA V-EVO à environ 1 400 $ US, moins cher et suffisant à moins de 30 m) et repères permanents de transect.
2. *Capteurs* : vidéo de transect répété sur repères fixes. **Ni caméra fixe, ni eDNA dans le MVP** (voir promesses).
3. *Modèle* : segmentation de couverture de zostère et d'espèces indicatrices affinée sur corpus local ; le même corpus que DiveAtlas, ce qui est un vrai argument de mutualisation.
4. *Pipeline* : capture géoréférencée, contrôle qualité, segmentation, pourcentage de couverture par parcelle et par campagne, comparaison à l'objectif du plan de compensation.
5. *Stockage* : PostGIS par parcelle et par campagne, registre de crédits d'habitat, pièces horodatées et géoréférencées, chaîne de conservation.
6. *Interface* : registre, tableau de bord multi-projets, générateur de rapport au format MPO ou USACE.
7. *Construit avec Claude* : registre, chaîne de conservation, segmentation, gabarits de rapport.
8. *Acheté* : ROV, temps bateau, plongée, assurance, déplacements sur la côte.

**Effort 5 à 8 m-i, coût 9 à 16 k$ CAD.**
**Promesses à corriger.** (a) « caméras fixes » sous-marines pour suivre la reprise : en mer des Salish, un hublot se biosalit en 2 à 4 semaines l'été et la visibilité tombe sous 1 m pendant la crue du Fraser et les blooms. Une station non gardée sans essuie-glace ni plongeur de maintenance ne produit pas de série exploitable. Remplacer par des transects répétés sur repères permanents. (b) « eDNA sous-traité 150 à 500 $ par échantillon » : le dossier technique marque lui-même ce prix « estimation », faute de page tarifaire trouvée. Surtout, un échantillon utile ce sont 3 à 5 réplicats plus des blancs de terrain, la bibliothèque de référence des invertébrés du Pacifique Nord-Est est incomplète, et le MPO n'accepte pas l'eDNA comme métrique de conformité de compensation. **Sortir l'eDNA du MVP** : coût certain, valeur réglementaire nulle. (c) Le registre de crédits et les gabarits de rapport sont du CRUD plus une bibliothèque de contenu : fastidieux, copiable, ce n'est pas une barrière technologique.
**Risque masqué n°1, et il est structurel** : le suivi est payé par le promoteur, dont la garantie financière est saisissable si la compensation échoue. **Il n'a aucun intérêt à une mesure indépendante plus dure que celle de son bureau d'études.** L'acheteur d'une preuve indépendante serait le MPO ou l'autorité portuaire, c'est-à-dire un cycle de vente public long, incompatible avec « du revenu vite ». Correction de positionnement : vendre au bureau d'études comme outil d'efficacité, pas au promoteur comme preuve d'indépendance.
**Dérisquage, 2 semaines, moins de 400 $.** Zéro matériel. Obtenir de Project Watershed ou de SeaChange **un rapport de suivi de compensation réel**, et vérifier champ par champ la proportion dérivable d'un modèle de données unique. Seuil : au moins 90 % des champs dérivables, sinon ce n'est qu'un carnet de terrain de plus. En parallèle, poser par écrit au bureau régional Pacifique du MPO la seule question qui décide : qui paie le suivi, sur quelle ligne, et une mesure tierce est-elle recevable ou seulement tolérée ?

### 2. PosidoniaProof, note 13 : une preuve qui n'en est pas une, sur une carte qui ne vous appartient pas

**Notes** : faisabilité 3, maturité 3, coût 3, barrière 2, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : récepteur AIS avec antenne VHF (150 à 400 $ CAD), Raspberry Pi et routeur 4G, une caméra marine PTZ sur mât (800 à 2 000 $ CAD), alimentation solaire.
2. *Capteurs* : AIS pour la position et l'identité, caméra pour la corroboration visuelle et l'horodatage ; la caméra ne mesure pas la position.
3. *Modèle* : détection et suivi de navires (RF-DETR affiné), plus un moteur géométrique de cercle d'évitage (position AIS, longueur de chaîne estimée, profondeur) qui produit une **zone probable d'ancre**, pas un point.
4. *Pipeline* : appariement continu AIS contre polygones d'herbiers, détection de séjour, constitution d'un dossier horodaté et signé, avec incertitude explicite.
5. *Stockage* : PostGIS, rétention courte des images brutes (30 jours), rétention longue des seules métadonnées.
6. *Interface* : tableau de bord gestionnaire de ZMEL, export de dossier pour l'autorité et pour l'assureur.
7. *Construit avec Claude* : ingestion AIS, géométrie d'évitage, détection vidéo, dossier de preuve, tableau de bord.
8. *Acheté* : matériel de site, hébergement, **licence des cartes d'herbiers**, conseil juridique français (protection des données et valeur probante).

**Effort 5 à 7 m-i, coût 9 à 16 k$ CAD (deux déplacements en France inclus).**
**Promesses à corriger.** (a) « constat horodaté, géolocalisé et signé, exploitable devant le Tribunal maritime » : en droit français, seuls des agents assermentés et commissionnés dressent un procès-verbal. Un journal privé est un **signalement** et un élément de preuve remis à l'autorité ou à l'assureur, jamais un constat. La promesse doit être réécrite, sinon elle est fausse dès la première contestation. (b) La position d'ancre déduite de l'AIS : l'AIS donne la position de l'antenne GPS du navire, pas de l'ancre. Avec 40 à 80 m de chaîne et l'évitage, l'incertitude sur l'ancre est de l'ordre du rayon d'évitage, à comparer à un polygone d'herbier levé à 5 ou 10 m près. La seule affirmation solide est « le navire entier était à l'intérieur du polygone, marge comprise ». (c) Le RGPD n'est pas « un risque », c'est une architecture imposée : filmer un plan d'eau accessible au public pour détecter des infractions sur des navires identifiés est un traitement de données personnelles, qui appelle une analyse d'impact, une durée de conservation courte, un cadrage excluant plages et quais, un registre, et une information des personnes. Deux à quatre semaines de travail et une ligne de coût, pas une note de bas de page.
**Risque masqué n°1, et il est éliminatoire** : les cartes d'herbiers de Méditerranée française (Donia, Medtrix) sont produites et détenues par Andromède Océanologie, qui est aussi l'éditeur de l'application concurrente. **Sans licence commerciale de cette couche, il n'y a pas de produit**, et le détenteur de la donnée est le concurrent. Second risque : les contrevenants les plus nombreux sur les herbiers peu profonds sont des unités sans AIS.
**Dérisquage, 2 semaines, moins de 1 200 $.** Aucune acquisition en France. (1) Demander par écrit à Andromède ou Medtrix les conditions d'une licence commerciale des couches posidonie : la réponse décide de tout. (2) Une heure d'avocat maritime français sur la valeur probante d'un journal privé. (3) À Vancouver, poser un récepteur AIS à 150 $ à False Creek et mesurer, sur dix mouillages réels, l'écart entre position AIS et position d'ancre relevée au GPS. Seuil : si l'écart médian dépasse la taille d'un polygone d'herbier typique, la promesse de preuve tombe et le produit devient un outil de gestion de bouées.

### 3. PlumeWatch, note 13 : le seul MVP qui crève le plafond de 25 k$, pour une mesure que le régulateur n'acceptera pas

**Notes** : faisabilité 3, maturité 3, coût 2, barrière 3, risque masqué 2.
**Architecture MVP en 8 lignes.**
1. *Matériel du commerce* : par station, un capteur néphélométrique à essuie-glace, un enregistreur, un panneau solaire, une liaison LTE et un mouillage : 4 000 à 8 000 $ CAD, pas 500 à 2 000 $.
2. *Capteurs* : turbidité in situ à haute fréquence, plus Sentinel-2 pour l'extension du panache.
3. *Modèle* : pas d'apprentissage profond. Correction atmosphérique et retrait de matière en suspension (chaîne de type ACOLITE), plus un moteur de règles sur le seuil du permis (9 NTU au-dessus du bruit de fond, 5 à 10 NTU près des coraux et herbiers).
4. *Pipeline* : ingestion continue in situ, fusion avec l'image quand elle existe, comparaison au seuil, alerte au capitaine de la drague, journal horodaté.
5. *Stockage* : séries temporelles (base orientée temps) plus PostGIS pour l'emprise du panache.
6. *Interface* : alerte temps réel, tableau de bord chantier, rapport exportable pour l'USACE et le NMFS.
7. *Construit avec Claude* : chaîne satellite, moteur de seuils, alertes, rapports.
8. *Acheté* : les stations, le mouillage, le temps bateau de pose et de relève, l'entretien anti-biosalissure, l'assurance et le remplacement de matériel perdu.

**Effort 5 à 8 m-i, coût 14 à 26 k$ CAD pour trois stations : hors budget bootstrap dès le premier chantier.**
**Promesses à corriger.** (a) « bouées de turbidité du commerce, 500 à 2 000 $ pièce » : une station télémétrée réelle avec essuie-glace coûte 4 à 8 k$ CAD, et **sans essuie-glace l'optique s'encrasse en 5 à 10 jours en Floride l'été**, ce qui produit une dérive de mesure indétectable pour l'utilisateur. L'écart au chiffre annoncé est d'un facteur 3 à 5, entretien non compris. (b) « comparaison automatique au seuil du permis » à partir du satellite : Sentinel-2 revisite tous les 5 jours en théorie, moins la couverture nuageuse, soit 1 à 3 images exploitables par mois en Floride l'été, alors que le seuil se mesure en continu à des points de conformité fixes. Le satellite **documente l'extension d'un panache**, il ne mesure pas une conformité NTU. C'est d'ailleurs exactement ce qu'ont fait les plaignants de Port Everglades. (c) « pilote sur le dragage d'entretien du Fraser » : le Fraser charrie naturellement une charge sédimentaire massive, la détection de panache par télédétection y est sans objet. Choisir un site en eau claire. (d) La mesure de conformité USACE suppose des instruments approuvés, étalonnés sur étalons formazine traçables, avec assurance qualité et souvent un observateur environnemental à bord : **votre station ne sera pas l'instrument de conformité**. Vendre l'alerte opérationnelle, pas le registre réglementaire.
**Risque masqué n°1** : le matériel est en mer, sur un chantier, dans le trafic. Perte, vandalisme, abordage et vol sont des lignes de coût récurrentes qu'aucune fiche ne prévoit. Second risque, commercial : le dragueur ne veut pas d'une preuve contre lui, et le port a déjà un observateur sous contrat.
**Dérisquage, 2 semaines, moins de 300 $.** Aucune bouée. Reconstituer a posteriori le panache de Port Everglades de juillet 2025 sur Sentinel-2 et **compter les jours de la fenêtre de dragage disposant d'une image exploitable**. Seuil : moins de 3 images utilisables par mois, la brique satellite ne peut pas être vendue comme surveillance, seulement comme chronique. En parallèle, demander un devis réel de station de turbidité télémétrée avec essuie-glace : le chiffre reçu tranche la viabilité du prix de 1 000 à 5 000 $ par mois par chantier.

---

## Classement technique

| Rang | Idée | Note /25 | Lecture en une ligne |
|---|---|:--:|---|
| 1 | **SedimentIQ (5)** | 20 | Le protocole du régulateur est la spécification du modèle : rare et précieux |
| 2 | **ReefInjury (4)** | 19 | Mesure de surface, pas de volume : le seul livrable métrologiquement défendable |
| 3 | **DiveAtlas (9)** | 19 | Le corpus local est un vrai actif, mais il faut couper la jambe acoustique |
| 4 | **BenthicPipe (7)** | 18 | Meilleur socle ouvert (BenthicNet), mauvaise ligne budgétaire visée |
| 5 | **SpongeSentinel (8)** | 17 | Six semaines de code, aucune barrière, et un problème de conditions d'usage |
| 6 | **SeafloorLedger (12)** | 17 | Méthode publique, seuil manquant, premier client qui est un concurrent |
| 7 | **ColonyTrack (11)** | 16 | La seule barrière à 5 du mandat, et un verrou physique non testé |
| 8 | **ScarMap (1)** | 15 | Bonne cible, mauvais capteur : ni satellite, ni obligation canadienne |
| 9 | **KelpPulse (6)** | 15 | Le satellite voit la canopée, le client veut voir les oursins |
| 10 | **OffsetLedger (10)** | 14 | Le payeur n'a pas intérêt à la mesure qu'on lui vend |
| 11 | **PosidoniaProof (2)** | 13 | La carte d'herbiers appartient au concurrent, et le constat n'en est pas un |
| 12 | **PlumeWatch (3)** | 13 | Seule idée qui crève le plafond de 25 k$ avant le premier client |

---

## Les trois idées les plus défendables techniquement

1. **SedimentIQ (20).** C'est la seule idée des douze où le régulateur a déjà écrit la spécification du modèle : couverture de Beggiatoa et d'opportunistes, six segments, seuil à 10 % sur plus de 4 segments, bande 100 à 124 m. Une cible visuellement distincte (tapis blanc filamenteux), un protocole quantitatif, une vérité terrain qui existe déjà chez le bureau d'études, zéro matériel à acheter, un client à trente minutes de Vancouver et une sortie binaire que l'on peut valider objectivement. Le corpus annoté par site et par cycle de production devient une base longitudinale qu'un concurrent ne peut pas reconstituer. Le seul verrou est contractuel, pas technique, et il se teste en deux semaines.
2. **ReefInjury (19).** La grandeur à mesurer est une **surface**, pas un volume ni une croissance, et c'est ce qui change tout : la photogrammétrie avec barres d'échelle mesure une surface avec un budget d'erreur publiable, ce qui est exactement ce qu'un rapport opposable exige. Le barème floridien est chiffré au mètre carré dans un texte adopté, donc la valeur du livrable est calculable. La compétence de plongeur du fondateur sert à valider ses propres mesures, ce qui est un avantage de production et pas seulement de réseau. À condition de retirer le splatting du discours de mesure et de licencier le logiciel à des opérateurs locaux plutôt que de plonger soi-même en Floride.
3. **DiveAtlas (19).** Coût matériel quasi nul, faisabilité la plus haute après SedimentIQ, et surtout **la seule barrière du mandat qui se construit avec du temps plutôt qu'avec de l'argent** : un corpus annoté d'espèces benthiques du Pacifique Nord-Est en eaux froides et turbides, que les jeux ouverts (tropicaux) ne couvrent pas et qu'un concurrent arrivant en 2028 ne peut pas fabriquer rétroactivement. Réserve explicite, et elle est lourde : couper l'hydrophone du MVP, imposer le cadre de quadrat, et accepter que le revenu vienne de la licence de données aux agences, pas de l'abonnement des clubs.

*Mention. **BenthicPipe (18)** est l'idée la mieux dotée en données ouvertes du mandat (BenthicNet, taxonomie WoRMS, publication ouverte) et sa cible a une obligation datée. Elle sort du podium pour deux raisons : elle vise une ligne budgétaire minoritaire du relevé, et son marché américain est gelé depuis juillet 2025. À traiter comme un module de SedimentIQ (même pipeline vidéo, autre gabarit) plutôt que comme une société séparée.*

*Contre-mention. **ColonyTrack (11)** obtient la seule note de 5 en barrière technique de tout le mandat, et se classe pourtant septième : c'est la démonstration que la défendabilité ne suffit pas quand la faisabilité solo est à 2 et que le verrou physique central (le bruit de mesure entre deux captures) n'a jamais été testé. Si le test de répétabilité à 800 $ passe, cette idée remonte de trois places d'un coup.*

---

## Les vingt promesses à corriger dans le rapport final

**Fausses (à retirer du discours).**

1. **Idée 1, cicatrices d'ancre détectées par Sentinel-2 et Planet.** Une cicatrice fait 1 à 3 m de large ; les capteurs font 10 m et 3 m par pixel, à travers 3 à 8 m d'eau turbide. Physiquement impossible. Correction : drone à marée basse extrême, 2 à 5 cm par pixel, filtre polarisant, vérification en plongée. Le satellite ne délimite que des herbiers, en eau claire.
2. **Idée 1, « capacité vérifiée jusqu'à 10 m de profondeur ».** Chiffre tropical de l'Allen Coral Atlas appliqué à la mer des Salish. En eau turbide, la limite utile est 0 à 2 m et seulement à marée basse. Le dossier technique pose la restriction, `IDEAS.md` l'a supprimée.
3. **Idée 1, RF-DETR pour mesurer une cicatrice.** RF-DETR est un détecteur de boîtes ; une cicatrice est un polygone sinueux dont on veut la surface. Outil correct : segmentation (SAM2 amorcé, U-Net ou DeepLab sur orthomosaïque).
4. **Idée 2, « constat exploitable devant le Tribunal maritime ».** En droit français, seuls des agents assermentés et commissionnés dressent un procès-verbal. Un journal privé est un signalement remis à l'autorité ou à l'assureur. Réécrire la promesse.
5. **Idée 2, position d'ancrage déduite de l'AIS.** L'AIS donne la position de l'antenne GPS, pas de l'ancre ; avec 40 à 80 m de chaîne et l'évitage, l'incertitude vaut le rayon d'évitage. La seule affirmation solide est « navire entièrement à l'intérieur du polygone, marge comprise ».
6. **Idée 3, « bouées de turbidité du commerce, 500 à 2 000 $ pièce ».** Une station télémétrée avec essuie-glace coûte 4 à 8 k$ CAD, et sans essuie-glace l'optique s'encrasse en 5 à 10 jours en Floride l'été. Facteur d'erreur de 3 à 5, entretien non compris.
7. **Idée 3, seuil de permis vérifié par satellite.** Sentinel-2 donne 1 à 3 images exploitables par mois en Floride l'été, contre une mesure continue à des points fixes. Le satellite chronique l'extension d'un panache, il ne mesure pas une conformité NTU, et ne sera pas l'instrument de conformité de l'USACE.
8. **Idée 4, mesure de dommage par Gaussian splatting.** Le 3DGS est une représentation de rendu, sans surface maillée validée ni budget d'erreur. La mesure vient de la SfM classique avec deux barres d'échelle rigides et une erreur publiée. Le splatting reste bon pour la visualisation client, étiqueté non métrique.
9. **Idée 4, CoralSCOP pour « corail vivant, mort, substrat cassé ».** CoralSCOP sépare corail et non-corail, forme de croissance et genre, sur photo-quadrats tropicaux ; la classe « squelette fraîchement cassé » n'existe dans aucun jeu ouvert. Et pour une pièce opposable, l'IA pré-trie, l'humain délimite.
10. **Idée 5, « rapport au format MPO ou SEPA ».** Deux protocoles distincts (couverture visuelle par segment contre modélisation de zone d'effet et notation propre). Le modèle est lié au protocole : l'Écosse est un nouveau corpus d'annotation, pas un bouton d'export.
11. **Idée 6, détection automatique des barrens d'oursins.** Les barrens sont à 5 à 20 m de fond en eau verte : ni satellite, ni drone ne les voient. Seules la vidéo ROV ou de plongée y accèdent. C'est la fonction la plus demandée et elle est absente de l'architecture proposée.
12. **Idée 6, zostère cartographiée par Sentinel-2 en mer des Salish.** Le produit mondial invoqué est dominé par des eaux claires ; en estuaire tempéré turbide la classe n'est pas séparable à 10 m. Le dossier `canada-pnw-benthic` écrit « capacité supposée », `IDEAS.md` l'a promue en capacité acquise.
13. **Idée 7, l'IA vidéo attaque les 1,2 M£ du relevé benthique par GW.** L'essentiel de ce coût est la taxonomie de laboratoire sur bennes et le temps navire, pas l'annotation vidéo. La ligne adressable est la DDV et le ROV seuls : refaire le calcul de marché.
14. **Idée 8, « API Global Fishing Watch gratuite » comme socle d'un abonnement payant.** La gratuité vaut pour un usage de recherche et d'impact avec attribution ; revendre des alertes dérivées est un usage commercial non couvert. À trancher par écrit avec GFW avant la première facture.
15. **Idée 8, récepteur AIS local pour surveiller Hecate Strait.** Un récepteur côtier porte 40 à 70 km en VHF, les récifs sont à 60 à 150 km au large. Il faut de l'AIS satellite, payant, et AISHub fonctionne par réciprocité non commerciale.
16. **Idée 9, indice acoustique de santé transposé au Pacifique Nord-Ouest.** La littérature est tropicale et repose sur le chœur des crevettes-pistolets et des poissons, absent des récifs tempérés du Salish. Sur ce corridor maritime, un hydrophone à 50 € mesure le trafic. Brique à sortir du MVP.
17. **Idée 10, caméras fixes sous-marines et eDNA dans le MVP.** Un hublot se biosalit en 2 à 4 semaines et la visibilité tombe sous 1 m pendant la crue et les blooms ; et l'eDNA (prix marqué « estimation » par le dossier technique, bibliothèque de référence incomplète) n'est pas accepté par le MPO comme métrique de conformité. Transects répétés sur repères permanents, eDNA en v2 au mieux.
18. **Idée 11, croissance corallienne mesurée par splatting, et re-identification visuelle en 5 à 7 mois.** La SfM mesure l'extension annuelle des colonies massives et encroûtantes mais échoue sur les branches fines des Acropora, qui dominent la restauration floridienne. La re-ID visuelle à un an d'écart est un sujet de recherche : repère permanent, mosaïque géoréférencée et OCR d'étiquette d'abord, vision en secours.
19. **Idée 12, détection de changement satellite et sonar pour les habitats peu profonds.** Les traces de chalut ne sont lisibles qu'en rétrodiffusion sidescan ou multifaisceaux, hors budget ; Sentinel-2 ne voit pas une perturbation benthique. Jambe à supprimer : le produit est un croisement AIS contre cartes d'habitats.
20. **Idée 12, indicateurs de perturbation D6C3 et D6C4 vendus comme verdict.** Le seuil D6C5 n'est pas adopté au 07/09/2026 (dossier `reg-europe-benthic`) : publier un dépassement revient à inventer le seuil. Mesurer l'étendue de la pression physique et s'arrêter avant le verdict d'état, en documentant le biais de couverture AIS des petites unités.

**Transversales, à ajouter au rapport (elles affectent les douze fiches).**

- **T1. « 4 à 6 mois-ingénieur » lu comme un calendrier.** Ce sont des mois-ingénieur d'équipe. En solo avec Claude, compter 0,6 m-i par mois calendaire, et 0,3 à 0,4 quand le chemin critique n'est pas du code (idées 2, 3, 5, 7, 10). Aucune des douze idées n'est facturable en moins de 6 mois dans sa forme complète.
- **T2. « Pas de matériel propre » n'est pas « pas de coût matériel ».** Quatre idées (2, 3, 10, et 1 dans sa version terrain) dépassent 9 k$ CAD dès qu'on compte le temps bateau, les traversiers, les déplacements, l'entretien anti-biosalissure et les assurances. L'idée 3 crève le plafond de 25 k$ avant le premier client.
- **T3. Les licences des données et des modèles ne sont jamais auditées.** Le dossier technique signale déjà que CoralNet, FathomNet et SQUIDLE+ n'affichent pas de licence explicite, et qu'une partie de BenthicNet agrège des sources potentiellement non commerciales. RF-DETR est en Apache 2.0 pour les petits modèles seulement (variantes « plus » et XL sous licence payante). Auditer avant d'entraîner, pas après la première vente.
- **T4. Aucune fiche ne mentionne les autorisations d'opération.** Transport Canada (enregistrement et certificat RPAS au-dessus de 250 g), interdiction de vol de drone dans les parcs nationaux sans permis (Gulf Islands, idée 1), permis de sanctuaire et statut de plongeur professionnel aux États-Unis (idées 4 et 11), autorisation de bouée permanente au titre de la Loi sur les eaux navigables canadiennes (idée 9), analyse d'impact RGPD et autorisation de vidéoprotection (idée 2). Deux à six semaines de délai et une ligne de coût récurrente, aujourd'hui absentes.
- **T5. « Aucun concurrent identifié » apparaît dans dix fiches sur douze.** C'est souvent vrai au sens du produit packagé, mais sur un marché réglementé cela signale plus souvent un travail déjà internalisé par l'agence (cartographie de cicatrices en Floride, survols de kelp de Washington DNR depuis 1989, VMS du MPO, analyses de chalutage d'Oceana) qu'une fenêtre ouverte. Trois cas où je lis « pas de concurrent » comme un signal négatif : idées 1, 6 et 12.

---

*Notes, efforts et coûts produits le 07/09/2026 par critic-tech, sans recherche web, sur la base des huit dossiers
et d'un jugement d'ingénieur. Toutes ces valeurs sont contestables par des chiffres : si l'orchestrateur en obtient
de meilleurs, ils l'emportent sur les miens.*
