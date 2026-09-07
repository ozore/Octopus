# Mémoire de travail, agent critic-vc, passe 3 « Fonds marins »

Date : 7 septembre 2026. Contrainte : zéro WebSearch, zéro WebFetch, travail sur pièces uniquement.

## Méthode retenue

- **Succès** : lire dans l'ordre BRIEF, IDEAS, puis les huit dossiers en entier avant de noter quoi que ce soit. Les huit dossiers font 3 098 lignes ; les lire tous a permis de repérer trois contradictions entre dossiers de la même étude, invisibles si on ne lit que le dossier « source » de chaque idée.
- **Succès** : relire le verdict de la passe précédente (`ocean-plastic-2/agents/critic-vc/verdict.md`) avant de noter. Il fixe le niveau : correction factuelle citée à la ligne, test terrain avec critère chiffré, verdict qui tranche. Il fixe aussi le bon réflexe, vérifier le « pourquoi maintenant » avant d'écrire la fiche, pas après.
- **Succès** : barème à six axes imposé par le mandat, dont deux qui font tout le travail de tri, « douleur budgétée » et « acheteur solvable ». Sept idées sur douze s'effondrent sur ces deux axes seuls.
- **Succès** : chercher systématiquement dans le dossier source les mots « estimation », « capacité supposée », « hypothèse non sourcée » et « lacune », puis vérifier ce que IDEAS.md en a fait. C'est la méthode qui a produit quatre des cinq erreurs factuelles.
- **Erreur évitée de justesse** : j'ai failli noter ScarMap et DiveAtlas à la hausse sur l'adéquation fondateur. L'accès terrain gratuit n'est pas un canal de vente : deux clubs de plongée à zéro heure de route restent deux organisations bénévoles sans ligne budgétaire. La proximité est un axe « f », jamais un axe « a ».
- **Blocage traité** : plusieurs chiffres décisifs sont absents des dossiers (nombre annuel d'incidents coralliens sanctionnés en Floride, nombre de banques d'habitat actives au Canada, budget de surveillance des AMP de C.-B.). Conformément à la consigne, écrit « non vérifiable sur pièces » et retenu l'hypothèse la plus défavorable, ce qui fait chuter ReefInjury sur l'axe « e » et SpongeSentinel sur l'axe « b ».

## Ce qui m'a surpris

1. **Trois idées sur douze sont le même produit.** SedimentIQ, OffsetLedger et BenthicPipe ont des cibles, des continents et des régulateurs différents, mais un moteur identique : segmentation IA de vidéo benthique, export au gabarit du régulateur, base longitudinale par site. IDEAS.md les traite comme trois sociétés parce que les trois dossiers sources sont différents. C'est un artefact d'organisation du travail, pas une réalité de marché. Le vrai plan est un moteur et trois gabarits.
2. **Les idées les plus « océaniques » sont les moins finançables.** DiveAtlas, ScarMap, SpongeSentinel parlent d'éponges, de plongeurs et d'herbiers ; elles ont les pires acheteurs. La meilleure du lot, SedimentIQ, parle de tapis bactériens sous des cages à saumon. Tension réelle avec l'exigence du brief que « l'océan reste visible dans le discours » : la visibilité océanique et la solvabilité de l'acheteur sont inversement corrélées dans ce lot.
3. **Le meilleur actif technique du secteur est aussi le moins vendable directement.** Trois dossiers convergent : les modèles et jeux ouverts sont tropicaux, la donnée annotée du Pacifique Nord-Ouest en eau froide et turbide n'existe pas. C'est la seule barrière à l'entrée durable identifiée dans toute l'étude, et elle ne peut être financée que comme sous-produit d'un logiciel payant, jamais comme produit.
4. **La coupe FCR3 est lue à l'envers.** IDEAS.md en fait un déclencheur d'achat pour deux idées (ReefInjury, ColonyTrack). Un bailleur qui coupe à 0 $ ne crée pas de demande logicielle, il crée des licenciements chez les acheteurs. Un budget qui disparaît est un signal de sortie, pas d'entrée.

## Biais détectés dans les dossiers

- **Biais de l'agent vendeur.** Chaque dossier se termine par quatre à six « opportunités produit » que son auteur a intérêt à rendre séduisantes. Résultat : la formule « aucun concurrent identifié » apparaît partout, et `industry-benthic-surveys` avoue l.245 qu'il s'agit d'une « capacité supposée d'absence de concurrent, faute de recherche exhaustive ». L'absence de preuve est présentée comme preuve d'absence.
- **Blanchiment d'estimation.** Un chiffre marqué « estimation » ou « capacité supposée » dans un dossier devient un fait nu dans IDEAS.md : 1,2 M£ par gigawatt, 30 à 50 marinas, 15 à 30 projets par an, 30 à 80 sites de restauration, 179 000 bateaux. La synthèse perd systématiquement les qualificatifs de prudence.
- **Chaînes de sources secondaires.** Le pire cas est le chiffre WWF de l'idée 2, cité à travers un agrégateur citant un rapport d'un vendeur de technologie citant l'étude. IDEAS.md n'affiche que « (WWF) ».
- **Confusion population captive et clientèle.** Tous les dossiers appellent « population captive » les acteurs soumis à une obligation. Aucun ne vérifie qui dispose d'une ligne de budget. Les 20 États en retard sur le règlement 2024/1991, les 16 Premières Nations du plateau Nord, les 6 600 centres PADI ne sont pas des clients, ce sont des populations.
- **Propositions comptées comme textes adoptés.** Help Our Kelp Act (non adopté), Marine Net Gain britannique (non contraignant), stage 3 des byelaws MMO (rejeté puis remis en consultation), plan d'action UE pêche (soft law combattue par six États). Les dossiers, eux, font correctement la distinction ; c'est la synthèse qui l'efface.
- **La géographie du fondateur justifie le client.** La rubrique « premier client atteignable depuis Vancouver » produit mécaniquement le client le plus proche, jamais le plus solvable. Elle devrait s'appeler « premier client qui a déjà payé quelqu'un pour ce problème ».
- **Trois contradictions internes non arbitrées** : FCR3 (28,5 M$ 2023-2025 avec 0 $ en 2026 selon `reg-coral-usa`, contre 28,5 M$ sur 2023-2026 selon `dive-restoration-market` l.13 et l.48) ; bouées du FKNMS (plus de 500 contre plus de 600) ; prix du BlueROV2 (4 900 $ contre 4 603 $). Aucun agent n'a lu le dossier des autres.

## Ce que je ferais différemment à la passe suivante

Imposer aux agents un champ « preuve de dépense » par opportunité : nom de l'acheteur, montant réellement dépensé sur ce problème, date, source. Une opportunité sans ce champ rempli ne devrait pas entrer dans IDEAS.md. Cela aurait éliminé cinq idées avant même la critique.
