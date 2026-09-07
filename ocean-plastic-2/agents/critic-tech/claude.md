# Mémoire de travail — agent critic-tech-2 (seconde passe)

Rôle : CTO / architecte IA & données. Mission : critique technique des 12 idées de
`ocean-plastic-2/IDEAS.md`, pour un fondateur SEUL développant avec Claude. Date : 2026-09-06.

## Journal

- **Succès** — Lecture intégrale de `ocean-plastic-2/IDEAS.md` (221 l.) et de `BRIEF.md` (fondateur :
  Vancouver, plongeur, bootstrap < 25 k$ CAD, solo temps plein).
- **Erreur** — `cat` intégral de `agents/tech-detection/dossier.md` (43,6 Ko) : sortie tronquée et
  redirigée vers un fichier de résultats. Leçon (déjà notée au cycle 1, redécouverte) : lire les gros
  markdown par tranches avec l'outil Read (offset/limit), jamais par `cat`.
- **Succès** — `grep -n "^#"` pour obtenir le plan d'un gros fichier avant de lire la bonne tranche :
  a permis d'isoler la grille d'effort de `ocean-plastic/agents/tech-landscape/findings.md`
  (section d, lignes 73-86) en une seule lecture.
- **Repère de coût retenu** (source : tech-landscape, marqué estimation) : 8-12 k€/mois-ingénieur
  chargé pour une ÉQUIPE. Décision structurante : je ne reprends PAS ce repère tel quel, car le
  mandat porte sur un fondateur seul non salarié. Je convertis en deux grandeurs distinctes :
  (1) l'effort en m-i « équipe » de la grille, (2) le temps calendaire solo, avec un facteur de
  conversion assumé de ~1,6 (un solo avec Claude produit vite du code mais absorbe seul l'intégration,
  le terrain, le support et la vente : ~0,6 m-i utile par mois calendaire). Documenté dans verdict.md.
- **Décision** — Le « coût MVP k$ CAD » que je chiffre EXCLUT le salaire du fondateur (il est
  bootstrap, son temps n'est pas une sortie de trésorerie) et n'inclut que : matériel du commerce,
  API/cloud, données payantes, analyses de laboratoire, déplacements, assurances/licences. C'est la
  seule lecture compatible avec la contrainte « bootstrap < 25 k$ CAD » du BRIEF.
