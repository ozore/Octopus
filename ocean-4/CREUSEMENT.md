# Brief de creusement (phase validation et creusement), passe 4

Tu creuses UNE idée retenue. Lis /home/user/Octopus/ocean-4/BRIEF.md (fondateur), /home/user/Octopus/ocean-4/TRI-35.md
(pourquoi elle passe, ce qu'il faut prouver) et la section (b) du dossier d'origine indiqué dans ton prompt. Ne lis rien d'autre.

## Objectif : l'angle différenciateur, prouvé ou réfuté
Le fondateur met un point d'honneur à identifier un angle différenciateur. Ta sortie centrale est donc :
1. **Trois angles candidats**, chacun en une phrase : ce que le produit fait que ni un modèle généraliste avec un gabarit,
   ni l'outil gratuit existant, ni le prestataire en place ne font, et qui s'accumule (donnée par site, historique,
   gabarit réglementaire validé, corpus local, position dans la chaîne).
2. Pour chaque angle : une source qui le confirme, une source qui le contredit, ton verdict. Cherche activement ce qui
   le tue : produit concurrent, projet interne du client, outil de l'agence, article montrant que c'est déjà fait.
3. L'angle retenu, et pourquoi les deux autres tombent.

## Puis, terre-à-terre
- Acheteur : nom, fonction, ce qu'il dépense aujourd'hui (chiffre et source), qui signe un bon de commande de 2 000 $.
- Fonctionnalités du produit en 6 lignes maximum, dans l'ordre où on les vend ; ce que l'IA fait précisément ; ce qui est
  « vérifié » et ce qui est « supposé ».
- Prix et modèle, pourquoi le client revient l'année suivante avec ses propres données (Q7).
- Faisabilité seul depuis Vancouver avec un LLM comme co-développeur : données accessibles (URL, licence), matériel,
  permis, ce qui bloque vraiment.
- La preuve se retourne-t-elle contre l'acheteur ? Si oui, comment l'architecture l'évite.
- Test à moins de 2 000 $ et deux semaines, avec critère chiffré.
- Ce qui reste incertain, et la question à poser au client.

## Contraintes
Au plus 6 WebSearch (quota partagé et entamé) ; WebFetch libre ; si WebSearch échoue, passe à WebFetch d'URL connues.
N'écris que dans ton dossier ; pas de code, pas de commit ; français ; acronymes définis ; pas de tirets longs.

## Format
`dossier.md` dans ton dossier, sections dans l'ordre ci-dessus, 120 lignes maximum. `claude.md` : requêtes, sources
mortes, leçons. Termine par un résumé de 8 lignes.

## En cas de blocage
Deux échecs : reformule ou WebFetch. Chiffre introuvable : « estimation ». Pas de question à l'orchestrateur.
