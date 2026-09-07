# Dossier de creusement, Green Marine Copilot

Agent : c4-greenmarine, passe 4 (phase creusement), 7 septembre 2026
Source : dossier ports-terminaux, section (b), candidat 3 (Green Marine Copilot).
Budget de recherche : 6 appels WebSearch (tous utilisés), WebFetch libre.

Acronymes définis à la première occurrence : ESG (Environmental, Social, Governance, cadre de reporting extra financier), LLM (grand modèle de langage), SaaS (logiciel en tant que service), CAD (dollar canadien), USD (dollar américain).

---

## 1. Trois angles candidats

**Angle A, gabarit tracé :** l'agent relie chaque niveau (1 à 5) revendiqué dans la grille des 12 indicateurs Green Marine à un extrait daté et localisable du document source du port, produisant un brouillon d'autoévaluation vérifiable phrase par phrase.

**Angle B, mémoire longitudinale par site :** l'agent garde d'une année sur l'autre l'historique des niveaux obtenus par indicateur et par site, et signale automatiquement quel indicateur est le plus proche du niveau supérieur, ce qu'exige la règle Green Marine de progression annuelle obligatoire.

**Angle C, position dans la chaîne :** l'agent est vendu au participant (coordinateur du port, terminal ou armateur), jamais au vérificateur externe accrédité, ce qui évite le conflit d'intérêt que la politique de certification interdit explicitement entre conseil et vérification.

## 2. Confirmation, contradiction, verdict

**Angle A.** Confirme : la grille de 12 indicateurs, les niveaux 1 à 5 et les guides d'autoévaluation existent publiquement et servent de gabarit exact (green-marine.org/certification/self-evaluation-guides/ ; certification_policy.pdf). Contredit : le marché ESG générique revendique déjà, hors maritime, un chaînage automatique preuve-affirmation et jusqu'à 70 % de gain de temps sur la collecte de données (Council Fire, janvier 2026, cité via dydon.ai ; positiongreen.com/ai/). Un LLM générique nourri du PDF de grille produirait un premier jet comparable en une session. Verdict : angle réel mais non défendable seul, un concurrent généraliste peut le répliquer vite.

**Angle B.** Confirme : la politique de certification impose explicitement une amélioration continue, au moins un niveau de plus par indicateur chaque année, jusqu'à niveau 2 partout (certification_policy.pdf, page 2). Aucun outil, générique ou maritime, n'a été trouvé qui suive cette progression par site sur plusieurs années pour Green Marine spécifiquement. Contredit : les plateformes ESG d'entreprise (40 000 à 150 000 $ US/an, technource.com, peoplemanagingpeople.com) offrent déjà un suivi longitudinal générique, multi-cadres, pas propre à Green Marine mais techniquement transposable par un client qui paierait cher. Verdict : moat réel et cumulatif (données propriétaires par site), la profondeur du gabarit Green Marine et le prix bas comblent l'écart avec l'offre entreprise que les ~285 membres, souvent des PME portuaires, ne peuvent pas se payer.

**Angle C.** Confirme : la politique interdit à un vérificateur ou son cabinet d'avoir conseillé un participant sur le programme Green Marine dans les deux années précédentes (certification_policy.pdf) ; des cabinets comme EA (eaest.com) et Blackbird EHS Consulting cumulent déjà conseil et vérification pour des clients différents, preuve que le marché sépare bien les deux rôles. Rien ne contredit directement cet angle. Verdict : condition structurelle nécessaire et vraie, mais ce n'est pas en soi une fonctionnalité qui s'accumule, elle sécurise le modèle plutôt qu'elle ne le différencie.

## 3. Angle retenu

**Angle B, mémoire longitudinale par site**, avec l'angle A comme mécanisme interne (la traçabilité document-indicateur est la brique qui alimente la mémoire, pas le produit fini) et l'angle C comme contrainte de positionnement respectée mais non vendue comme fonctionnalité. L'angle A tombe seul face à un LLM générique avec la grille publique en main, ce que le test de TRI-35 demandait explicitement de réfuter, et la recherche de cette passe ne le réfute pas. L'angle C tombe seul car il décrit à qui vendre, pas ce qui s'accumule ; il reste vrai mais passe en condition d'architecture (section 6).

## 4. Acheteur

Coordinateur environnement ou durabilité d'un port, terminal ou armateur membre de Green Marine (exemple de titre observé : Sustainability & Environmental Compliance Manager, Everport Terminal Services, fourchette salariale agrégée 72 000 à 149 000 $ US/an, ZipRecruiter, source secondaire, à traiter comme estimation, déjà notée dans le dossier d'origine). Dépense actuelle non chiffrée avec exactitude cette passe : le PDF de politique de certification confirme une cotisation annuelle obligatoire mais sans montant, et aucune des trois recherches dédiées (page FAQ, cabinets EA et Blackbird EHS, magazine Green Marine) n'a livré de tarif de vérification externe ni de cabinet ni de Green Marine elle-même. Chiffre introuvable, estimation non disponible. Qui signe un bon de commande de 2 000 $ : vraisemblablement le coordinateur lui-même ou son supérieur direct, un montant de cet ordre reste sous le seuil habituel d'appel d'offres formel dans la plupart des autorités portuaires nord-américaines, estimation.

## 5. Fonctionnalités, dans l'ordre de vente

1. Import des documents opérationnels du site (journaux de carburant, incidents, dragage, soumissions Green Marine antérieures).
2. Mise en correspondance automatique document vers indicateur (12 indicateurs, niveaux 1 à 5), chaque affirmation liée à un extrait daté, vérifié : traçabilité vérifiable automatiquement par comparaison de texte.
3. Brouillon de l'autoévaluation annuelle au format Green Marine, relu et signé par le dirigeant, jamais soumis automatiquement.
4. Mémoire multi-année par site et recommandation de l'indicateur le plus proche du niveau supérieur, vérifié : la règle de progression existe, supposé : la recommandation elle-même reste à valider par un client réel.
5. Dossier de vérification biennale compilé par indicateur pour le vérificateur accrédité, supposé : aucun concurrent maritime identifié faisant cela, donc fiabilité documentaire à ce niveau non prouvée en conditions réelles.
6. Aucune connexion automatique vers Green Marine ou le vérificateur, export humain uniquement.

## 6. Prix, modèle, retour annuel

Abonnement annuel par site, fourchette visée 3 000 à 6 000 $ CAD/an, ancrée sur le bas de la fourchette ESG SMB observée (3 000 à 5 000 $ US/an, technource.com, peoplemanagingpeople.com) plutôt que sur l'offre entreprise (40 000 à 150 000 $ US/an), avec un supplément de 1 500 à 3 000 $ l'année de vérification pour le dossier biennal, estimation faute de tarif Green Marine confirmé. Le client revient l'année suivante (Q7) parce que l'historique par site (journaux mappés, niveaux obtenus, justificatifs) vit dans l'outil : changer de solution force à refaire tout le mapping documentaire, et l'obligation elle-même est contractuelle et annuelle.

## 7. Faisabilité depuis Vancouver

Grille et guides d'autoévaluation Green Marine publics et accessibles (green-marine.org/certification/self-evaluation-guides/, licence de consultation libre). Les documents opérationnels eux-mêmes (journaux internes) ne sont pas publics, il faut l'accord d'un client pilote pour les obtenir, contrairement aux autres candidats du dossier d'origine appuyés sur des données ouvertes. Matériel : aucun, produit purement documentaire (LLM plus stockage), pas de capteur ni de vision. Permis : aucun, pas de présence terrain requise. Ce qui bloque vraiment : convaincre un premier port ou terminal de partager ses documents internes malgré la sensibilité (incidents, non-conformités), et l'absence d'interface programmable connue côté Green Marine, la soumission finale reste un formulaire en ligne géré par l'humain, acceptable pour un produit d'assistance mais à confirmer.

## 8. La preuve se retourne-t-elle contre l'acheteur

Oui, potentiellement : un mappage plus complet et tracé des documents peut faire remonter une non-conformité que le coordinateur aurait préféré laisser implicite dans une autoévaluation rédigée à la main. Architecture pour l'éviter : l'agent reste un outil de brouillon strictement contrôlé par le client, rien n'est transmis à Green Marine ou au vérificateur sans validation humaine explicite, et le dirigeant signataire garde la décision finale de divulgation à chaque étape, comme l'exige d'ailleurs déjà la politique de certification.

## 9. Test à moins de 2 000 $ et deux semaines

Recruter un port ou terminal membre volontaire, de préférence une structure moyenne sans poste dédié déjà en place (donc hors VFPA, Port de Montréal). Prendre trois ans de soumissions Green Marine passées plus les journaux d'un seul indicateur (par exemple espèces aquatiques envahissantes ou gestion des eaux pluviales) et produire un brouillon tracé pour cet indicateur en moins de deux semaines, coût sous 2 000 $ (temps fondateur plus appels API LLM). Critère chiffré : le coordinateur valide le brouillon en moins de 30 minutes de relecture, contre plusieurs heures estimées pour une compilation manuelle par indicateur, et accepte soit de payer pour la version complète soit d'introduire l'outil auprès de son vérificateur pour un essai sur le dossier biennal.

## 10. Incertitudes et question au client

Le tarif exact de la vérification externe Green Marine (frais de vérificateur, cotisation annuelle) reste introuvable après cette passe malgré trois tentatives ciblées (PDF de politique, FAQ, sites de deux cabinets vérificateurs) ; à demander directement. Question à poser au premier client pilote : combien d'heures ou de semaines-personne passez-vous chaque année à compiler l'autoévaluation, et combien payez-vous exactement à votre vérificateur externe tous les deux ans.

---

## Résumé en 8 lignes

Green Marine Copilot vise les coordinateurs environnement des quelque 285 ports, terminaux, armateurs et chantiers membres de Green Marine, tenus à une autoévaluation annuelle sur 12 indicateurs et une vérification externe tous les deux ans. L'angle retenu est la mémoire longitudinale par site, l'outil retient d'une année sur l'autre les niveaux obtenus et les documents mappés, et signale l'indicateur le plus proche de la progression obligatoire qu'impose la politique de certification. L'angle du simple gabarit tracé tombe seul, un LLM générique avec la grille publique en main produit un résultat comparable en une session, selon ce que revendique déjà le marché ESG générique. Le tarif exact de la vérification externe reste introuvable malgré trois recherches ciblées, chiffre introuvable persistant depuis le dossier d'origine. Aucun concurrent maritime spécifique n'a été identifié, seuls des outils ESG génériques existent, à 3 000 à 150 000 $ US/an selon la taille. Le prix visé est 3 000 à 6 000 $ CAD/an par site, plus un supplément l'année de vérification, ancré sur le bas de la fourchette ESG PME plutôt que sur l'offre entreprise. Le risque principal est que l'outil fasse remonter une non-conformité que le client aurait préféré taire, contré par un contrôle humain strict avant toute transmission. Le test proposé, un seul indicateur sur un site volontaire, coûte moins de 2 000 $ et se juge en moins de 30 minutes de relecture par le coordinateur.
