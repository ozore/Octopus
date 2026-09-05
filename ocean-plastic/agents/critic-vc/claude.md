# Journal de bord — agent critic-vc

## Démarche

1. Lecture intégrale de `IDEAS.md` et `BRIEF.md` avant toute autre chose.
2. Inventaire des 9 dossiers de recherche (`find` + `wc -l`) pour calibrer l'effort de lecture :
   2 610 lignes au total, dont un fichier renommé `dossier-rivers-upstream.md` (l'agent
   rivers-upstream n'a pas suivi la convention `findings.md`).
3. Lecture ciblée : reg-europe et ports-shipping en intégral partiel (sections tableaux + fiches),
   puis `grep` thématique sur fishing, divers, reg-usa, reg-asia, rivers, tech-landscape.
4. 2 recherches web sur les deux faits décisifs pour le top 3 (règlement pellets, SB 54).
5. Notation, fiches, top/bottom, réserves factuelles.

## Succès

- **Succès** — Lire `IDEAS.md` en entier avant les dossiers : les 12 idées citent leurs sources
  agent par agent, ce qui a permis de cibler les greps au lieu de tout lire. Leçon : dans un dossier
  multi-agents, le document de synthèse est la table des matières de la vérification.
- **Succès** — `wc -l` sur tous les fichiers avant de les ouvrir. Un `cat` de reg-europe +
  ports-shipping a produit 95 KB et a été tronqué vers un fichier de sortie ; les lectures suivantes
  ont été faites par `sed -n '1,Np'` et `grep -n`. Leçon : mesurer avant de lire, sinon on brûle du
  contexte pour rien.
- **Succès** — `grep -n` sur des chiffres précis (« 5 741 », « SB 54 », « MS4 », « PADI ») plutôt que
  sur des concepts : les dossiers sont structurés en tableaux, donc une ligne de grep = une ligne de
  tableau complète avec sa source. Très haut rendement.
- **Succès** — Les 2 recherches web ont **corrigé une erreur** entre dossiers : reg-europe donnait un
  seuil de certification pellets à 1 000 t/an, ports-shipping à 1 500 t/an. Le texte au JOUE confirme
  1 500 t/an. Leçon : quand deux agents divergent sur un chiffre, c'est exactement là qu'il faut
  dépenser une recherche — pas sur les faits consensuels.
- **Succès** — Inverser explicitement le critère (e) « risque d'exécution » (5 = risque faible) et
  l'écrire dans la grille. Sans cela, un total sur 25 mélangeant 4 critères « plus haut = mieux » et
  1 critère « plus haut = pire » est ininterprétable.

## Erreurs et fausses pistes

- **Erreur** — Premier `cat` combiné de deux gros fichiers : sortie tronquée, 95 KB écrits sur disque
  pour rien. Leçon : ne jamais `cat` deux fichiers de recherche non mesurés dans le même appel.
- **Erreur évitée de justesse** — J'ai failli noter l'idée 4 (TrueBlue) sur la seule force de sa
  date réglementaire (27/09/2026). En vérifiant la date du jour (05/09/2026), cette « urgence » se
  révèle être un handicap : J-22, la vague d'achat est passée. Leçon : une date réglementaire n'est
  un actif que si elle est **devant** — croiser systématiquement chaque échéance avec la date du
  jour avant de scorer l'urgence.
- **Fausse piste** — Chercher un chiffre de sanction pour la directive DCSMM (idée 8) : il n'y en a
  pas, l'obligation pèse sur l'État membre. Leçon utile plutôt qu'échec : identifier **qui** est le
  destinataire juridique de l'obligation avant de supposer que la cible commerciale est contrainte.
  Ce test a fait tomber les idées 6, 8 et 11.
- **Limite assumée** — Je n'ai pas vérifié la « amende plancher de 4 % du CA » (idée 3) : elle
  provient de la proposition de 2023, pas du texte adopté. Signalée en réserve factuelle plutôt que
  reprise comme argument. Leçon : marquer explicitement les chiffres non confirmés plutôt que de les
  moyenner dans une note.
- **Limite assumée** — Budget web volontairement sous-consommé (2 recherches sur 5 autorisées) : les
  dossiers sources étaient suffisamment sourcés (URL + dates) pour les 10 autres idées. Dépenser des
  recherches sur des faits déjà sourcés deux fois n'aurait rien changé aux verdicts.

## Contraintes respectées

- Écriture limitée à `/home/user/Octopus/ocean-plastic/agents/critic-vc/` (`verdict.md`, `claude.md`).
- `IDEAS.md` non modifié. Aucun code, aucun commit.
- Noms de fichiers `findings`/`report`/`summary`/`analysis` évités.
