# claude.md, agent critic-ocean, passe 3 « Fonds marins »

Journal de méthode, erreurs récurrentes des agents de recherche, leçons. Tenu au fil de l'eau le 07/09/2026.

## Méthode suivie (et pourquoi)

- **Succès** : lire dans l'ordre imposé (BRIEF, IDEAS, puis les huit dossiers) avant d'écrire une seule ligne de
  notation. Trois idées ont changé de note après lecture du dossier source, dans les deux sens : l'idée 8 gagne
  parce que son levier est mieux daté que ne le dit `IDEAS.md`, l'idée 6 perd parce que son concurrent gratuit est
  décrit dans le dossier lui-même comme « site inaccessible » au lieu d'être décrit comme un concurrent.
- **Succès** : survoler `ocean-plastic-2/agents/critic-ocean/verdict.md` avant de rédiger. Le barème (cinq axes /5,
  moyenne attendue autour de 14/25, l'axe substitution noté à l'envers) et le format (tableau, fiches courtes,
  deux classements, pièges, corrections) étaient déjà calibrés : recopier la calibration économise une passe.
- **Succès** : noter ce qui est écrit dans `IDEAS.md`, pas l'idée reformulée charitablement. Trois fiches
  (1, 5, 12) s'effondrent uniquement sur ce que leur propre phrase promet.
- **Succès** : chercher systématiquement, pour chaque idée, « qui fait déjà cela gratuitement ». C'est l'axe qui
  discrimine le plus (notes de 1 à 4) et c'est le plus mal traité par les dossiers, parce qu'un agent de recherche
  cherche des concurrents *commerciaux* et rate les biens publics (CIEM, EMODnet, KelpWatch, GFW, SVMP de WA DNR).
- **Succès** : appliquer la contrainte « 20 lignes max » en écrivant d'abord long puis en resserrant par
  fusion de lignes, plutôt qu'en coupant du contenu. Les corrections factuelles sont ce qui a de la valeur.
- **Erreur de ma part, corrigée** : première rédaction à 22-28 lignes par fiche, hors format. Leçon : écrire
  directement dans le gabarit, ou prévoir un passage de resserrage mécanique et vérifier le compte de lignes.
- **Erreur de ma part, corrigée** : chercher les tirets longs avec une classe de caractères grep sur un fichier
  UTF-8 renvoie des faux positifs (comparaison octet par octet selon la locale, et point de code hors plage pour
  `grep -P`). Vérifier les caractères interdits en Python, pas en grep.

## Erreurs récurrentes des agents de recherche (les huit dossiers)

1. **Confondre « limite de profondeur » et « limite de résolution ».** Le dossier tech-underwater-ai écrit
   correctement que l'Allen Coral Atlas classe la composition benthique jusqu'à ~10 m de profondeur. `IDEAS.md`
   en déduit qu'on peut voir une cicatrice d'ancre. Ce sont deux propriétés sans rapport. Leçon : pour toute
   capacité d'imagerie, exiger trois chiffres distincts (résolution au sol, profondeur utile, fréquence de revisite
   *utilisable* après filtrage nuage, marée, turbidité et reflet spéculaire).
2. **Traiter « page inaccessible » comme « acteur inexistant ».** Vu au moins six fois : KelpWatch, Reef Life
   Survey, NOAA NCCOS, opc.ca.gov, orsted.com, aza.org. Les dossiers notent honnêtement la lacune, mais `IDEAS.md`
   la transforme en vide concurrentiel. Leçon : un échec de fetch doit être signalé comme *inconnu*, jamais comme
   *absent*, et la synthèse doit refuser d'en tirer un argument de marché.
3. **Chercher des concurrents commerciaux et rater les biens publics.** Un bien public gratuit et faisant autorité
   ne concurrence pas un produit payant : il le supprime. Les dossiers listent le CIEM et le JRC comme
   « recherche publique, pas commercial », ce qui est exactement à l'envers du raisonnement de marché.
4. **Citer le bon programme mais le mauvais texte.** Les seuils benthiques aquacoles de C.-B. viennent des
   conditions de permis (Règlement du Pacifique sur l'aquaculture, héritées du FAWCR provincial), pas du Règlement
   sur les activités d'aquaculture. Un régulateur ferme la porte à la première citation fausse.
5. **Confondre obligation, politique et communication.** Trois cas dans ce corpus : l'échéance aquacole 2029
   (politique ministérielle de permis, réversible), le plan d'action pêche de l'UE (communication, soft law), le
   guide MMO de 2025 (guide de méthode, l'obligation étant dans chaque Marine Licence). Le brief demandait
   « texte adopté ou proposition » : il faut un troisième état, « politique réversible ».
6. **Attribuer une compétence à un organisme qui ne l'a pas.** Islands Trust n'a aucune compétence maritime.
   Vérifier systématiquement *qui délivre l'autorisation* avant de désigner un premier client.
7. **Propager un chiffre par une chaîne tertiaire.** Les « 179 000 bateaux dont 45 % de plus de 24 m » passent par
   un site sectoriel citant un rapport citant une étude. Le résultat est numériquement invraisemblable. Leçon :
   appliquer un test de vraisemblance d'ordre de grandeur avant de retenir un chiffre à trois relais.
8. **Reprendre une « estimation » d'un dossier comme un fait dans la synthèse.** Le 1,2 M£ par gigawatt et le
   « 9 NTU » sont marqués prudemment dans les dossiers et deviennent des faits dans `IDEAS.md`. Leçon : la
   synthèse doit hériter des étiquettes, pas les effacer.
9. **Deux dossiers, deux chiffres, aucune réconciliation.** Parc de bouées floridien (500 contre 600 dont 300),
   période FCR3 (2023-2025 contre 2023-2026), prix du BlueROV2 (4 603 contre 4 900 $). Il faut un passage de
   réconciliation inter-dossiers avant la synthèse, personne ne l'a fait.
10. **Ne jamais interroger la solvabilité de la cible.** Clubs de plongée bénévoles, conservancies insulaires, ONG
    subventionnées et organisations qui viennent de perdre leur financement d'État sont présentés comme des
    clients à 100-1 000 $ par mois. Leçon : pour chaque cible, exiger une phrase sur d'où vient l'argent et sur
    ce qui se passe quand la subvention s'arrête.
11. **Ne jamais poser la question du conflit d'intérêt de la preuve.** Cinq idées sur douze vendent à un obligé un
    outil qui documente sa propre non-conformité. Aucun dossier ne pose la question. C'est pourtant le premier
    réflexe d'un acheteur industriel.
12. **La « licence de données à une agence » comme ligne de revenu par défaut.** Elle apparaît dans cinq idées sur
    douze, de 10 à 80 k$ par an, sans qu'aucun des huit dossiers ne produise un seul précédent d'agence ayant
    acheté ce type de licence. Même observation qu'à la passe 2 : le défaut est structurel, pas accidentel.

## Leçons pour une prochaine passe

- Ajouter au brief des agents une consigne explicite : « pour chaque capacité d'imagerie ou de capteur, donner
  résolution, profondeur utile et fréquence utilisable ; pour chaque cible, dire d'où vient l'argent ».
- Ajouter un agent (ou une étape) de réconciliation inter-dossiers avant la synthèse, dont le seul travail est de
  faire remonter les chiffres divergents et les capacités contradictoires.
- Le critique doit disposer d'un petit budget de vérification web (cinq requêtes suffiraient) : ici, cinq faits
  restent marqués « à confirmer au texte » alors qu'une seule lecture les trancherait (seuil de turbidité de la
  Floride, article 5 du règlement 2024/1991, plafond de §403.93345, statut du règlement 2022/1614, montant exact
  du financement de projet pour la permanence de la mer du Grand Ours).
- Le corpus « fonds marins » est réglementairement plus solide que les deux passes plastique, et commercialement
  plus faible : les payeurs y sont plus souvent publics, subventionnés ou en conflit d'intérêt avec la preuve.
  À signaler d'emblée au prochain orchestrateur.
