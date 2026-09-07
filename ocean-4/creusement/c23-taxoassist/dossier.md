# Creusement — TaxoAssist (candidat 23)

Agent : c23-taxoassist. Passe de validation et creusement, 7 septembre 2026. Source : dossier bureaux-labos, section
(b), candidat 1 (copilote de tri/identification benthique calé sur le NMBAQC, National Marine Biological Analytical
Quality Control, schéma britannique d'assurance qualité pour les analyses biologiques marines).

## 1. Trois angles différenciateurs

1. **Protocole** : le score de confiance de l'outil est câblé nativement sur les paliers déjà publiés du BCSI
   (Bray-Curtis Similarity Index, indice de similarité utilisé pour comparer deux identifications) et sur la
   Taxonomic Discrimination Policy (TDP, politique de discrimination taxonomique) du NMBAQC, ce qu'aucun outil
   académique généraliste ne fait.
2. **Corpus** : la bibliothèque de référence photographique se construit échantillon après échantillon à partir des
   spécimens que le labo client valide lui-même (few-shot local), un actif qu'aucune base d'images ouverte
   équivalente n'offre aujourd'hui pour la macrofaune benthique marine triée en laboratoire.
3. **Position dans la chaîne** : l'outil s'insère dans le geste du taxonomiste au moment du tri (proposition avant
   validation), pas en périphérie (rapport après coup), captant chaque correction humaine en continu.

## 2. Confirmation, contradiction, verdict

**Angle 1 (protocole).** Confirme : BCSI et TDP déjà écrits et publiés (vérifiée, dossier d'origine : nmbaqcs.org,
apemltd.com) ; le NMBAQC a commandé un rapport de développement d'un « Video Ring Test » (vérifiée par le titre du
document, envision.uk.com, 2022 ; contenu du PDF illisible via l'outil de lecture, seul le titre est vérifié), signe
d'intérêt pour l'évaluation par image. Contredit : aucune source ne montre que le NMBAQC accepterait une
identification assistée par IA en soumission officielle ; ce même rapport montre surtout qu'un prestataire
(Envision) explore déjà ce terrain, risque d'exclusion pour un tiers non affilié. Verdict : angle réel mais fragile,
à vendre comme aide interne, jamais comme identification « conforme NMBAQC ».

**Angle 2 (corpus).** Confirme : le dossier d'origine a vérifié l'existence de bibliothèques de spécimens voucher
et de bulletins de ring test NMBAQC depuis 1994 (nmbaqcs.org). Cette passe confirme en creux qu'aucune banque
d'images ouverte équivalente n'existe pour la macrofaune benthique marine triée en labo : le seul cadre proposé,
SMarTaR-ID (Standardised Marine Taxon Reference image database), reste une architecture de 2019 centrée sur
l'imagerie in situ, sans base opérationnelle livrée (vérifiée : PMC6938304, biorxiv.org/670786) ; les jeux ouverts
trouvés sont hors périmètre : BIODISCOVER/Ärje 2022 (macroinvertébrés d'eau douce, 97-99 % de précision avec 15-50
images/taxon, dataset Zenodo ouvert, vérifiée : PMC9415355) et le jeu Svalbard (imagerie in situ ROV, pas de
spécimens triés, licence CC BY, Mendeley Data, vérifiée). Contredit : rien ne prouve que les vouchers/bulletins
NMBAQC sont numérisés ou accessibles à un fondateur externe ; collections physiques fermées possibles. Verdict : le
vide de données est réel et vérifié, mais l'accès aux données existantes ne l'est pas ; le corpus se construit plus
sûrement avec le premier client (photos prises pendant son propre tri) qu'hérité du NMBAQC.

**Angle 3 (position dans la chaîne).** Confirme : les prototypes trouvés (DiversityScanner, Museum für Naturkunde
Berlin, insectes, 91,4 % de précision sur 14 taxons ; BIODISCOVER, Suède, eau douce) restent des outils de
recherche publiés en article, sans boucle de correction continue côté client (vérifiée : Wührl et al. 2022, Ärje et
al. 2022). Contredit : recherche non exhaustive sur les LIMS (systèmes de gestion d'information de laboratoire)
commerciaux ; un module de capture photo déjà vendu à APEM/MESL n'a pas été cherché spécifiquement et pourrait
exister. Verdict : plausible mais le moins vérifié des trois, largement supposé.

## 3. Angle retenu

L'angle **2 (corpus)**, reformulé pour éviter sa faiblesse : plutôt que de dépendre d'un accès aux vouchers NMBAQC
(non vérifié, risque d'exécution élevé pour un fondateur solo à Vancouver), le produit construit son corpus avec le
premier labo client, à partir de ses propres spécimens déjà identifiés (vérité terrain interne), puis grandit site
par site. L'angle 1 tombe comme pilier mais reste un argument de vente secondaire (alignement, pas conformité) : la
contradiction trouvée (Envision déjà engagé par le NMBAQC sur l'image/vidéo) est trop sérieuse. L'angle 3 tombe
faute de preuve d'unicité : ergonomie reproductible par un concurrent mieux placé, pas un actif qui s'accumule.

## Acheteur

Responsable qualité ou de la taxonomie benthique dans un labo type APEM (équipe qualifiée « une des plus grandes
d'Europe », traite plus de 2 500 échantillons marins/an, vérifiée : apemltd.com) ou MESL/RSK. Dépense actuelle :
salaires taxonomistes 38 616 à 70 000+ £/an (vérifiée, dossier d'origine : glassdoor.co.uk, accesstg.com) plus le
temps de tri par échantillon, non chiffré précisément ni dans le dossier d'origine ni cette passe malgré recherche
dédiée (**estimation** manquante, aucune grille tarifaire publique, cf. lacune). Ce responsable peut signer un bon
de commande de 2 000 $ sans appel d'offres formel.

## Fonctionnalités (dans l'ordre où on les vend)

1. Photographie de chaque spécimen trié via un montage simple (caméra macro, éclairage), pas de matériel spécialisé
   type BIODISCOVER.
2. L'IA propose un taxon probable et une liste courte alternative, avec score de confiance (**vérifié** : seuils
   BCSI/TDP existants pour le calibrer ; **supposé** : fiabilité réelle sur spécimens réels, non testée).
3. Le taxonomiste valide ou corrige en un clic ; la correction alimente le corpus local du labo.
4. Tableau de bord de cohérence interne avant un ring test (indicatif seulement, jamais soumis au NMBAQC).
5. Export du journal d'identification pour l'audit qualité interne du labo.
6. Bibliothèque de référence propre au labo, réutilisable d'un site à l'autre pour ce même client.

## Prix et modèle, pourquoi le client revient (Q7)

Abonnement mensuel par poste de tri ou par volume d'échantillons traités. Le client revient car son corpus local
(spécimens propres à ses sites) grandit dans l'outil et se perd s'il en change (verrouillage par les données), plus
le rythme bi-annuel obligatoire des ring tests (vérifiée, dossier d'origine : nmbaqcs.org).

## Faisabilité solo depuis Vancouver

Données : aucun jeu ouvert idéal de photos de spécimens marins benthiques triés trouvé (SMarTaR-ID = cadre, pas
base ; Svalbard = in situ ; BIODISCOVER = eau douce) ; le corpus de départ doit venir d'un labo pilote. Matériel :
montage photo simple, quelques centaines de dollars, faisable seul. Permis : aucun requis, pas de spécimens ni de
terrain manipulés par le fondateur. Ce qui bloque vraiment : trouver un labo pilote fournissant des photos déjà
identifiées par un expert (vérité terrain), et l'absence de signe que APEM/MESL/RSK répondraient à un inconnu.

## La preuve se retourne-t-elle contre l'acheteur ?

Oui : une identification IA erronée utilisée dans un rapport officiel ou un ring test nuirait à l'accréditation du
labo. L'architecture l'évite en gardant l'IA au stade de suggestion, validation humaine obligatoire avant tout
export, aucun envoi automatique au NMBAQC, journal d'audit montrant que le taxonomiste, pas l'IA, a validé.

## Test à moins de 2 000 $ et deux semaines

Recruter un taxonomiste indépendant ou un labo universitaire pour tester le prototype sur au moins 100 spécimens
déjà identifiés par un expert (vérité terrain), 15 à 20 taxons courants. Critère chiffré : au moins 80 % d'accord
top-3 entre l'IA et l'expert, avec un score de confiance qui baisse sur les cas où l'IA se trompe (calibration
mesurable). En dessous, ne pas approcher de labo commercial.

## Incertain, question à poser au client

Un labo comme APEM ou MESL utiliserait-il l'outil en aide interne au tri (jamais en soumission de ring test), et
combien d'heures de taxonomiste par échantillon en moyenne (**estimation** manquante malgré recherche dédiée) ?

## Résumé (8 lignes)

TaxoAssist creuse un vrai vide de données (aucune banque ouverte de photos de spécimens marins benthiques triés en
labo, SMarTaR-ID n'est qu'un cadre de 2019) et un protocole déjà écrit (BCSI, TDP du NMBAQC), mais l'angle
« conforme NMBAQC » est fragile : le NMBAQC a déjà fait développer un Video Ring Test par un prestataire (Envision),
et rien ne confirme qu'une identification assistée par IA serait acceptée en soumission officielle. L'angle retenu
déplace donc le pari du corpus NMBAQC (accès non vérifié) vers un corpus construit avec le premier labo client, à
partir de ses propres spécimens déjà validés. L'acheteur plausible est un responsable qualité ou de taxonomie chez
APEM (plus de 2 500 échantillons marins/an) ou MESL/RSK, qui paie aujourd'hui des salaires de 38 à 70 000+ £/an,
sans qu'aucun tarif par échantillon n'ait pu être trouvé publiquement. Le test à moins de 2 000 $ vise 80 % d'accord
top-3 sur 100 spécimens experts avant tout contact commercial. Le risque principal reste l'accès : trouver un labo
pilote prêt à fournir des photos et une vérité terrain à un fondateur inconnu depuis Vancouver.
