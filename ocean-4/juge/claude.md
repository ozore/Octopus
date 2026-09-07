# Mémoire du juge, passe 4 (7 septembre 2026)

## Méthode suivie
1. Lecture dans l'ordre imposé : `claude.md` racine, `CRITERES-RECHERCHE.md`, `REVISION-36.md`, puis `BRIEF.md`,
   `CANDIDATS-35.md`, `TRI-35.md`, `CREUSEMENT.md`, puis les huit `creusement/*/dossier.md`.
2. Avant toute recherche, repérage des phrases à risque dans chaque dossier : « aucun concurrent identifié »,
   « supposé », « chiffre introuvable », « estimation ». Ce sont les seuls endroits où une chaîne casse.
3. Recherche indépendante ciblée uniquement sur ces phrases, jamais pour redécouvrir ce que l'agent avait déjà trouvé.
   12 WebSearch dépensés, plus WebFetch libre.
4. Retour aux dossiers sources `agents/*/dossier.md` pour vérifier si un fait « vérifié » au creusement était
   « supposé » à l'origine. C'est là qu'on trouve les promotions frauduleuses, pas dans le dossier de creusement.
5. Hypothèse défavorable retenue systématiquement sur tout fait non vérifiable, comme le prescrit le brief.

## Compteur de recherches (12 sur 12)
1. Mysticetus / logiciel d'observateur de mammifères marins. **Décisive** : tue l'idée 1+2.
2. eDNA métabarcoding contre identification morphologique benthique au Royaume-Uni. Trouve le JNCC Report 705.
3. Green Marine autoévaluation, coût, vérification. Mène au barème 2025.
4. Logiciel de préparation d'audit ASC, MSC, BAP. Trouve le marché humain de pré-évaluation.
5. LIMS microplastiques ISO 17025 certificat piste d'audit. **Décisive** : tue l'idée 25.
6. IA identification macrofaune benthique en laboratoire, APEM. Trouve la direction robotique du secteur.
7. Concurrents des logiciels d'observateurs. Confirme la domination de Mysticetus, RPS à 90 % des baux.
8. EcoAnalysts, laboratoire de taxonomie. Trouve l'acheteur nord-américain que personne n'avait nommé.
9. Polychètes, amphipodes, identification par photo. Non concluante, hypothèse défavorable retenue.
10. Modèles gratuits de pré-évaluation MSC et ASC. Trouve l'ASC Improver Programme.
11. MSC Benchmarking and Tracking Tool. **Décisive** : tue l'idée 13.
12. Logiciel de rapport acoustique passif automatisé. **Décisive** : tue l'idée 22 (PAMGuard 2026 + RS Aqua Marlin).

## Sources mortes ou récalcitrantes
- `green-marine.org/media/tnclskea/green-marine-2025-fee-schedule.pdf` : illisible par WebFetch (PDF vectorisé),
  récupéré en décompressant les flux du PDF téléchargé en local. Le dossier d'origine et l'agent de creusement
  l'avaient tous deux déclaré « chiffre introuvable ». Il était accessible. Leçon : un PDF « illisible » n'est pas un
  PDF introuvable.
- `msc.org/for-business/fisheries/how-to-get-certified/pre-assessment` : 404. La recherche par nom d'outil (BMT) a
  fonctionné là où la navigation par arborescence a échoué.
- `mysticetus.com` : pages marketing, aucune tarification ni liste de clients publique.

## Ce qui m'a surpris
- **Deux agents sur huit ont tué leur propre idée honnêtement** (7 AcoustiCert, 12 EM Review). C'est nouveau et c'est
  bon signe. Leur travail est le plus utile de la passe, alors qu'il ne produit rien.
- **Le chiffre déclaré introuvable était accessible** dans deux cas sur trois (barème Green Marine, MSC BMT). Les
  agents abandonnent trop vite quand le premier format résiste.
- **Le concurrent dominant n'est jamais cherché par son rôle.** Aucun des huit dossiers ne contient la requête « quel
  logiciel utilisent aujourd'hui les gens à qui je veux vendre ». Ils cherchent des concurrents par fonctionnalité, ce
  qui ne trouve que des acteurs adjacents. Mysticetus a été manqué par trois dossiers successifs.
- **Le gratuit bouge.** PAMGuard 2026 exécute nativement des classifieurs IA et gère de gros jeux de données sans
  code : le dossier le décrivait avec la définition de 2015. Un outil libre daté dans un dossier est un risque, pas une
  référence.

## Biais des agents de creusement, observés
1. **Biais de sauvetage.** Six sur huit ont conservé un angle qu'ils venaient d'affaiblir, en le rétrécissant plutôt
   qu'en concluant « rien ne reste ». Le format « trois angles, un retenu » impose un survivant. Il faudrait autoriser
   explicitement la sortie « zéro angle retenu ».
2. **La mémoire longitudinale prise pour un angle.** Trois dossiers (4, 13, 23) retiennent « l'historique s'accumule
   chez le client » comme différenciateur. C'est une propriété de tout logiciel qui stocke, pas une barrière. L'agent
   13 l'a d'ailleurs écrit lui-même, puis l'a gardé quand même comme mécanisme de rétention.
3. **Le concurrent cherché par mot-clé de fonctionnalité, jamais par usage de l'acheteur.**
4. **La contradiction interne non arbitrée.** L'argument « un cabinet qui facture à l'heure n'achète pas un gain de
   productivité » tue l'angle C de l'idée 13 et laisse vivre l'angle 1 de l'idée 22. Personne n'a comparé.
5. **L'acheteur nommé par le mandat n'est jamais remis en cause** sauf par l'agent 12, qui a découvert que ses trois
   acheteurs étaient ses trois concurrents. Les autres ont accepté la liste d'acheteurs du tri sans la tester.

## Leçon pour un futur juge
Les dossiers de creusement ne mentent pas, ils rétrécissent. Le travail du juge n'est pas de chercher l'erreur dans ce
qui est écrit, mais de mesurer combien il reste après tous les rétrécissements successifs, et de comparer ce reste au
marché réel plutôt qu'au reste théorique. Sept fois sur huit ici, le reste était plus petit que le premier concurrent
non cherché.
