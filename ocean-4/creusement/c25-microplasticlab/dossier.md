# Creusement — Candidat 25 : MicroplasticLab

Agent : c25-microplasticlab. Phase creusement, 7 septembre 2026. Dossier d'origine : section (b), candidat 4,
/home/user/Octopus/ocean-4/agents/bureaux-labos/dossier.md. Convention inchangée : **(vérifiée : source)** /
**(supposée)**.

---

## 1. Trois angles candidats

- **Angle A — Unification vision multi-marques** : un outil qui lit les images spectrales FTIR/LDIR (Laser Direct
  Infrared) de plusieurs fabricants et classe chaque particule par polymère avec un seul moteur, là où chaque
  marque cloisonne aujourd'hui son propre logiciel.
- **Angle B — Couche certification et piste d'audit ISO/IEC 17025** : peu importe qui a classé la particule
  (logiciel fabricant, siMPle, Open Specy), l'outil génère le certificat d'analyse et la piste d'audit (blancs,
  échantillons de contrôle, traçabilité échantillon-image-spectre) au format qu'exige l'accréditation, un travail
  aujourd'hui manuel et répété à chaque rapport.
- **Angle C — Réconciliation multi-juridictions** : un seul jeu de résultats reformaté automatiquement pour
  satisfaire plusieurs méthodes réglementaires distinctes et non harmonisées (Californie, Union européenne, ISO)
  qu'un labo servant plusieurs marchés doit produire en parallèle.

## 2. Confirmation, contradiction, verdict

**Angle A.** Confirme : les logiciels liés aux instruments existent et sont vendus par marque (Agilent Clarity pour
le LDIR 8700, propriétaire) (vérifiée : agilent.com). Contredit, et fatalement : siMPle (Aalborg University +
Alfred Wegener Institute, gratuit, open source) est explicitement construit pour « rapid and harmonized analysis of
microplastics across FTIR systems from different manufacturers » (vérifiée : plastiverse.org/tools/simple). Open
Specy (openspecy.org, gratuit, +40 000 spectres Raman/FTIR ouverts, deux classifieurs ML) fait la même chose en
ligne et par paquet R, marque indépendante (vérifiée : pubs.acs.org/doi/10.1021/acs.analchem.5c00962,
github.com/wincowgerDEV/OpenSpecy-package). Cote technique en plus : Agilent Clarity lui-même importe des spectres
FTIR d'autres instruments au format .spc, et OMNIC Paradigm (Thermo) lit Bruker OPUS, Perkin-Elmer, JCAMP-DX, Grams
(vérifiée : agilent.com/.../agilent-clarity-software ; knowledge1.thermofisher.com). **Verdict : angle mort.**
L'unification multi-marques est déjà résolue, gratuitement, par deux outils académiques largement cités, et les
formats d'échange existent déjà entre logiciels propriétaires. Construire ce même moteur n'ajoute rien qu'un labo
accrédité ne puisse obtenir gratuitement aujourd'hui.

**Angle B.** Confirme : ISO 24187:2023 fixe les principes d'analyse des microplastiques (microscopie + spectroscopie
vibrationnelle, classification par taille) mais ne fournit pas de logiciel de rapport (vérifiée : iso.org/standard/78033.html,
plastiverse.org/tools/iso-24187). Aucune trace trouvée d'une fonction de génération de certificat ISO/IEC 17025 avec
piste d'audit dans Clarity, siMPle ou Open Specy : ce sont des outils de classification scientifique, pas des
outils de conformité d'accréditation (absence constatée dans les pages produits/logicielles consultées ; absence
totale = supposée, recherche non exhaustive). Contredit, partiellement : la plupart des laboratoires accrédités
utilisent déjà un LIMS (Laboratory Information Management System) générique qui gère certificats et traçabilité
pour toutes leurs analyses, pas seulement les microplastiques (raisonnement général, non vérifié cette session) —
le risque est que la couche certificat existe déjà, générique, chez le client. **Verdict : angle retenu, sous
condition** (question ouverte au client, cf. section 7) : la valeur n'est pas de remplacer le LIMS mais
d'automatiser le lien spécifique classification-particule vers preuve défendable (image, spectre, score de
confiance, blanc/QC associés), que le LIMS générique ne fait pas nativement pour ce type d'analyse.

**Angle C.** Confirme, fragmentation réelle : la Californie a développé sa propre méthode (SB 1422, définition et
méthode adoptées par le State Water Resources Control Board, programme de test de 4 ans, laboratoires accrédités
dédiés, phase 1 démarrée automne 2023) (vérifiée : waterboards.ca.gov, kslaw.com) ; l'UE a adopté sa propre
méthodologie harmonisée (décision déléguée de la Commission du 11 mars 2024, développée par le JRC — Joint
Research Centre —, suivi Article 13 de la directive eau potable refondue à partir de 2026, avant inscription
possible sur la liste de vigilance) (vérifiée : joint-research-centre.ec.europa.eu, agencyiq.com) ; l'ISO propose
une troisième base (ISO 24187). Trois méthodes non alignées, vérifiées séparément. Contredit : c'est exactement le
type de problème qu'un LLM générique bien guidé par un gabarit peut couvrir sans produit dédié — le brief du
fondateur écarte ce cas de figure (Q3 du filtre en sept questions, TRI-35.md). **Verdict : angle non retenu comme
produit autonome**, mais absorbé dans l'angle B : la difficulté n'est pas de reformater du texte, c'est de
maintenir, particule par particule, le lien preuve-vers-trois-méthodes en même temps que l'audit trail — un
gabarit seul ne porte pas cette traçabilité structurée.

## 3. Angle retenu

**Angle B élargi** : copilote de certification et de piste d'audit pour l'analyse microplastiques, agnostique de
l'instrument et de la méthode de classification utilisée en amont, qui relie chaque particule identifiée (image,
spectre, score, blanc/QC) au certificat conforme et le reformate selon la méthode exigée par le client final
(ISO 24187, méthode Californie SWRCB, méthodologie JRC/UE). L'angle A tombe parce qu'il est déjà résolu
gratuitement (siMPle, Open Specy) ; l'angle C tombe comme produit autonome parce qu'il ressemble trop à un gabarit
générique sans la couche de traçabilité structurée qui fait la défendabilité en audit.

## 4. Acheteur

Responsable qualité ou responsable technique d'un laboratoire accrédité ISO/IEC 17025 pratiquant l'analyse
microplastiques (ex. PolyGone, Measurlabs, Eurofins environment testing) — c'est cette fonction qui répond des
audits de surveillance et signerait un achat logiciel de 2 000 $ sans comité d'achat (supposée, taille typique de
ces structures). Dépense actuelle : à partir de 349 $US/échantillon en tarif de base (vérifiée, dossier d'origine :
measurlabs.com, polygonesystems.com) ; chez Measurlabs, frais de dossier de 97 € par commande en plus du prix par
échantillon, avec remise sur gros volumes (vérifiée : measurlabs.com/products/microplastics-in-food). Temps
analyste par échantillon non chiffré dans les sources publiques consultées ; un article sectoriel 2026 note que le
choix de méthode détermine directement le temps de technicien et recommande d'automatiser la préparation
d'échantillon pour le réduire, signe indirect que le temps humain (pas l'instrument) est le poste de coût dominant
(vérifiée pour le constat général, chiffre absent : labmanager.com — **estimation** pour le nombre d'heures).

## 5. Produit en 6 lignes

1. Le labo importe l'export de son instrument (Clarity, OMNIC, OPUS ou équivalent) après classification, quelle
   qu'en soit la source (logiciel fabricant, siMPle, Open Specy ou IA propre).
2. L'outil relie chaque particule identifiée à son image, son spectre et son score de confiance dans un dossier de
   preuve structuré.
3. Il rapproche le lot des blancs et échantillons de contrôle qualité (QC) associés, seuils requis par
   ISO/IEC 17025.
4. Il génère le certificat au format demandé (ISO 24187, méthode SWRCB Californie, méthodologie JRC/UE), avec la
   piste d'audit complète.
5. Vérifié : les formats d'échange existent (.spc, JCAMP-DX, OPUS, .spa) donc l'ingestion multi-instruments est
   technique, pas un blocage de principe (vérifiée : sources citées section 2). Supposé : que l'assemblage
   preuve-plus-certificat n'existe pas déjà en module packagé chez un éditeur de LIMS microplastiques (non
   vérifié cette session).
6. L'IA précisément : extraction et mise en cohérence de documents structurés multi-sources (spectres, images,
   journaux QC) puis génération de texte réglementaire conforme, tâche d'assemblage fiable de longs documents
   hétérogènes apparue 2024-2026 — pas la classification elle-même, déjà gratuite ailleurs (angle A).

## 6. Prix, modèle, retour annuel (Q7)

Modèle par abonnement mensuel plus un prix marginal par certificat généré (ex. base mensuelle basse, quelques
dollars par certificat), aligné sur le flux existant du labo plutôt que sur un prix par gros projet. Le client
revient l'année suivante parce que : SB 1422 impose un programme de test pluriannuel avec audits de surveillance
continue (vérifiée : waterboards.ca.gov) ; le suivi Article 13 de la directive eau potable de l'UE démarre en 2026
et continue ensuite (vérifiée : agencyiq.com) ; les audits de surveillance ISO/IEC 17025 sont périodiques
(vérifiée, dossier d'origine : eurofins.com). Chaque nouvelle méthode publiée (ou révisée) est un gabarit de plus
que l'outil maintient à jour pour le client, qui n'a pas à reformer son équipe à chaque évolution réglementaire.

## 7. Faisabilité depuis Vancouver

Données accessibles : bibliothèque ouverte de spectres Open Specy (openspecy.org, +40 000 spectres, licence
ouverte, vérifiée) utilisable pour valider l'ingestion et le mapping ; le texte des standards ISO 24187 (accès
payant, à acheter, vérifiée : iso.org) et de la méthode SWRCB (accès public, vérifiée : waterboards.ca.gov) et de
la méthodologie JRC/UE (rapport publié, vérifiée : op.europa.eu). Matériel : aucun instrument FTIR/LDIR requis, le
produit travaille en aval de l'export ; un ordinateur portable suffit. Permis : aucun. Ce qui bloque vraiment :
obtenir de vrais exports multi-marques (images, spectres, métadonnées de particules) d'un labo partenaire, car
aucun jeu de données ouvert multi-instruments avec métadonnées de piste d'audit n'a été identifié cette session
(seul Open Specy expose des spectres, pas le format d'export complet d'un run LDIR/FTIR avec blancs et QC) —
partenariat à négocier avec un labo (Measurlabs, PolyGone) avant tout test réel.

## 8. La preuve se retourne-t-elle contre l'acheteur

Oui, potentiellement : un certificat ISO/IEC 17025 généré automatiquement qui contient une erreur de classification
engage la responsabilité du labo signataire, pas celle du fournisseur logiciel. L'architecture doit donc garder le
même principe que le candidat 23 (TaxoAssist) : l'IA propose un dossier de preuve et un projet de certificat avec
score de confiance visible particule par particule, la signature reste celle d'un analyste qualifié du labo qui
valide avant émission. Le produit vend l'assemblage et la traçabilité, jamais la décision finale.

## 9. Test à moins de 2 000 $ et deux semaines

Obtenir d'un labo partenaire (contact PolyGone ou Measurlabs) un lot réel de particules déjà classées sur deux
instruments différents (ex. export Agilent Clarity et export siMPle/Open Specy sur les mêmes échantillons),
assembler le dossier de preuve et générer un certificat au format ISO 24187 puis au format SWRCB pour le même lot.
Critère chiffré : le certificat est jugé acceptable sans correction structurelle majeure par le responsable
qualité du labo partenaire, et le temps d'assemblage mesuré descend sous 20 % du temps qu'il déclare passer
aujourd'hui à produire le même certificat à la main (chiffre déclaratif du labo, pas de source publiée).

## 10. Incertitudes et question au client

Incertain : si un LIMS générique déjà en place chez Eurofins/Measurlabs/PolyGone couvre déjà cette fonction pour
les microplastiques spécifiquement (pas seulement en général) ; le temps analyste réel par certificat (aucune
source chiffrée trouvée, **estimation** seulement) ; le contenu exact exigé par la méthodologie JRC/UE 2026 au
niveau du certificat individuel (rapport JRC repéré mais non lu en intégralité, budget de recherche épuisé) ; si un
standard récent supplémentaire, ISO/FDIS 16094-2, mentionné en passant sur une fiche Agilent LDIR, ajoute des
exigences propres au LDIR non couvertes ici (vérifiée seulement l'existence du nom, contenu non lu). Question à
poser au client : « Votre LIMS actuel produit-il déjà le certificat ISO/IEC 17025 pour les microplastiques, ou
seulement pour vos autres analyses ? Si oui, qu'est-ce qui manque encore et vous fait perdre du temps à chaque
rapport ? »

---

## Résumé (8 lignes)

MicroplasticLab visait à unifier la lecture d'images spectrales FTIR/LDIR de plusieurs marques : cet angle est mort,
siMPle et Open Specy le font déjà gratuitement et les formats d'échange (.spc, OPUS, JCAMP-DX) existent déjà entre
logiciels propriétaires. L'angle retenu se déplace en aval : un copilote qui assemble, pour chaque particule
identifiée par n'importe quel outil amont, un dossier de preuve défendable (image, spectre, score, blancs et QC) et
génère le certificat conforme à la méthode exigée (ISO 24187, méthode SWRCB Californie, méthodologie JRC/UE 2026),
avec piste d'audit. Le déclencheur réglementaire est solide et vérifié (SB 1422 en cours depuis 2023, suivi Article
13 UE dès 2026, audits ISO/IEC 17025 périodiques), mais l'incertitude majeure n'est pas technique : c'est de savoir
si le LIMS générique déjà en place chez les grands labos couvre déjà cette fonction, question à poser directement
au client avant d'investir plus loin. Le test à moins de 2 000 $ suppose un partenariat labo réel, faute de jeu de
données ouvert multi-instruments avec métadonnées d'audit complètes.
