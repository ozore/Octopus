# Mémoire de travail : critic-tech (passe 3, fonds marins)

## Méthode retenue (réutilisable telle quelle en passe 4)

- **Lire dans l'ordre imposé, mais lire `IDEAS.md` en dernier des sources factuelles.** Le brief, puis le dossier
  technique, puis les dossiers réglementaires et marché, puis `IDEAS.md` : c'est le seul ordre qui permet de
  repérer les endroits où la synthèse a durci une capacité que le dossier source avait marquée « supposée ».
- **Deux grandeurs, jamais confondues** : l'effort en mois-ingénieur (comparable d'une idée à l'autre et aux
  chiffres d'`IDEAS.md`) et le calendrier solo (0,6 m-i par mois calendaire avec Claude, 0,3 à 0,4 quand le chemin
  critique n'est pas du code). Le lecteur qui confond les deux se trompe d'un facteur 2.
- **Le coût est un coût de poche sur 12 mois**, hors salaire du fondateur, avec les postes que personne n'écrit :
  temps bateau, traversiers, assurances, entretien anti-biosalissure, remplacement de matériel perdu en mer,
  frais juridiques, temps d'annotation expert.
- **Cinq axes tous dans le même sens (5 = bon).** La passe 2 avait un axe inversé (« dépendance tierce ») et cela
  oblige à un avertissement en tête de tableau. Éviter : tout mettre à l'endroit et l'écrire.
- **Chaque idée reçoit une expérience qui tranche**, pas une étude. Critère : moins de 2 000 $, moins de 2 semaines,
  un seuil de décision chiffré écrit à l'avance, et de préférence exécutable depuis Vancouver. Sur cinq idées sur
  douze, le test qui tranche n'est pas un test de terrain mais une question écrite (licence de données, conditions
  d'usage d'une API, recevabilité réglementaire) : c'est un résultat en soi.
- **Distinguer risque technique, risque contractuel et risque juridique.** Trois idées (5, 2, 7) meurent d'un
  problème d'accès aux données, pas de modèle. Les nommer séparément évite de noter « faisable » un produit dont
  le corpus n'appartient pas au fondateur.

## Erreurs récurrentes des dossiers et de la synthèse

1. **Promotion de statut.** L'erreur la plus fréquente : le dossier source écrit « capacité supposée » et
   `IDEAS.md` écrit « capacité vérifiée ». Trois cas nets : zostère par Sentinel-2 en mer des Salish
   (`canada-pnw-benthic` dit supposée), mesure de croissance par splatting (`tech-underwater-ai` dit supposée),
   sonar de pêche pour distinguer des habitats (`tech-underwater-ai` dit non vérifiée). Toujours regrepper
   « supposée » dans les dossiers avant de juger une fiche.
2. **Transfert géographique implicite.** Un chiffre tropical (10 m de profondeur utile de l'Allen Coral Atlas,
   indices acoustiques de santé récifale, jeux CoralNet et CoralSCOP) appliqué au Pacifique Nord-Ouest en eau
   froide et turbide. C'est le biais dominant de tout ce mandat : les données ouvertes sont tropicales, le terrain
   du fondateur ne l'est pas.
3. **Confusion résolution et détectabilité.** « Sentinel-2 à 10 m » ne dit rien sur la détectabilité d'un objet de
   1 à 3 m sous 5 m d'eau. Toujours comparer la taille de la cible à la taille du pixel, et ajouter la colonne
   d'eau, la marée, la turbidité et la réflexion de surface.
4. **Prix de capteur cité hors système.** Un capteur n'est pas une station : il manque toujours l'essuie-glace,
   le mouillage, l'alimentation, la télémétrie, la pose et la relève. Facteur 3 à 5 systématique (idée 3, et déjà
   idées 7, 8 et 11 de la passe 2). C'est une erreur répétée d'une passe à l'autre.
5. **Gratuité d'une API confondue avec droit d'usage commercial.** GFW, AISHub, CoralNet, FathomNet, SQUIDLE+ :
   « gratuit » veut dire gratuit pour la recherche et l'impact, avec attribution, parfois avec réciprocité, jamais
   automatiquement pour revendre un dérivé. À vérifier avant d'écrire un prix mensuel.
6. **Le rendu confondu avec la mesure.** Le Gaussian splatting est cité deux fois comme méthode de mesure
   (idées 4 et 11). C'est une représentation de rendu. Règle générale à garder : demander où est le budget
   d'erreur ; s'il n'y en a pas, ce n'est pas de la métrologie.
7. **Autorisations d'opération jamais chiffrées.** Drone (Transport Canada, parcs nationaux), plongée
   professionnelle et permis de sanctuaire aux États-Unis, bouée permanente (eaux navigables), vidéoprotection et
   analyse d'impact RGPD. Deux à six semaines de délai chacune, absentes des douze fiches. Même angle mort qu'en
   passe 2 (promesse transversale 18 de l'époque) : à imposer comme rubrique obligatoire en passe 4.
8. **« Aucun concurrent identifié » (dix fiches sur douze).** Sur un marché réglementé, cela signale plus souvent
   une activité internalisée par l'agence (FWRI en Floride, WA DNR depuis 1989, VMS du MPO, équipe data d'Oceana)
   qu'une fenêtre ouverte. Vérifier systématiquement si le « premier client » n'est pas en réalité le concurrent.
9. **Payeur et bénéficiaire confondus.** Idée 10 : on vend une preuve indépendante au promoteur dont la garantie
   financière est saisissable si la preuve est mauvaise. Toujours poser la question « qui paie, et son intérêt
   est-il aligné avec la rigueur du produit ? ».
10. **Chiffre de marché appliqué à la mauvaise ligne budgétaire.** Idée 7 : les 1,2 M£ par GW sont dominés par la
    taxonomie de laboratoire et le temps navire, pas par l'annotation vidéo. Toujours demander quelle fraction du
    total le produit attaque réellement.

## Leçons pour la prochaine passe

- Les meilleures idées techniques de ce mandat sont celles où **le régulateur a déjà écrit la spécification du
  modèle** (SedimentIQ) ou où **la grandeur mesurée est une surface, pas un volume ni une croissance**
  (ReefInjury). Chercher ce motif en priorité.
- La seule barrière que ce fondateur peut construire sans argent est **un corpus local annoté que les jeux ouverts
  ne couvrent pas** (eaux froides et turbides du Pacifique Nord-Est). Elle demande du temps et des sorties, pas du
  capital, et elle n'est pas rétro-constructible. C'est le même verdict qu'en passe 2 (CoastalTrace).
- Un produit dont le MVP contient une station instrumentée en mer sort du budget bootstrap. Règle simple :
  **compter une station instrumentée comme 5 à 8 k$ CAD par point, entretien compris**, et voir ce qu'il reste.
- Écrire les fiches en huit lignes d'architecture (matériel, capteurs, modèle, pipeline, stockage, interface,
  construit avec Claude, acheté) force à révéler ce qui est acheté et ce qui est du code. Deux idées sur douze
  n'ont rien à acheter du tout : ce sont les deux moins chères et ce n'est pas un hasard.
- Ne jamais utiliser de tiret long ni de tiret demi-cadratin dans ce mandat : virgules, deux-points, parenthèses.
  Vérification finale : compter les occurrences des deux caractères de tiret long dans le fichier ; le compte doit
  valoir zéro.
