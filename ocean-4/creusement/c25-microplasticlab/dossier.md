# Creusement — Candidat 25 : MicroplasticLab

Agent : c25-microplasticlab. Phase creusement, 7 septembre 2026. Dossier d'origine : section (b), candidat 4,
/home/user/Octopus/ocean-4/agents/bureaux-labos/dossier.md. Convention : **(vérifiée : source)** / **(supposée)**.

---

## 1. Trois angles candidats

- **A — Unification vision multi-marques** : lire les images spectrales FTIR/LDIR (Laser Direct Infrared) de
  plusieurs fabricants et classer chaque particule par polymère avec un seul moteur, là où chaque marque cloisonne
  son propre logiciel.
- **B — Couche certification et piste d'audit ISO/IEC 17025** : quelle que soit la source de classification
  (logiciel fabricant, siMPle, Open Specy), assembler la preuve (image, spectre, blanc, contrôle qualité) et
  générer le certificat au format d'accréditation, travail aujourd'hui manuel à chaque rapport.
- **C — Réconciliation multi-juridictions** : reformater un même jeu de résultats pour satisfaire plusieurs
  méthodes réglementaires distinctes (Californie, Union européenne, ISO) qu'un labo multi-marchés doit produire en
  parallèle.

## 2. Confirmation, contradiction, verdict

**A.** Confirme : logiciels vendus par marque, ex. Agilent Clarity pour le LDIR 8700, propriétaire (vérifiée :
agilent.com). Contredit, et fatalement : siMPle (Aalborg University + Alfred Wegener Institute, gratuit, open
source) est conçu pour l'analyse harmonisée « across FTIR systems from different manufacturers » (vérifiée :
plastiverse.org/tools/simple) ; Open Specy (openspecy.org, gratuit, +40 000 spectres ouverts, classifieurs ML) fait
de même, indépendant de toute marque (vérifiée : pubs.acs.org/10.1021/acs.analchem.5c00962,
github.com/wincowgerDEV). Clarity lui-même importe des spectres externes en .spc, et OMNIC (Thermo) lit Bruker
OPUS, Perkin-Elmer, JCAMP-DX, Grams (vérifiée : agilent.com, knowledge1.thermofisher.com). **Verdict : angle mort**
— déjà résolu, gratuitement, par deux outils académiques établis, formats d'échange déjà existants.

**B.** Confirme : ISO 24187:2023 fixe les principes d'analyse (microscopie + spectroscopie vibrationnelle,
classes de taille) mais ne fournit aucun logiciel de rapport (vérifiée : iso.org/standard/78033.html,
plastiverse.org/tools/iso-24187) ; aucune fonction de certificat ISO/IEC 17025 avec piste d'audit repérée dans
Clarity, siMPle ou Open Specy, tous des outils de classification, pas de conformité d'accréditation (absence
constatée sur les pages consultées ; absence totale = supposée). Contredit, partiellement : la plupart des labos
accrédités ont déjà un LIMS (Laboratory Information Management System) générique qui gère certificats et
traçabilité pour toutes leurs analyses (supposée, non vérifiée cette session) — risque que la couche existe déjà,
générique, chez le client. **Verdict : retenu sous condition** (question au client, section 7) : la valeur n'est
pas de remplacer le LIMS mais d'automatiser le lien classification-particule vers preuve défendable, propre aux
microplastiques, que le LIMS générique ne fait pas nativement.

**C.** Confirme, fragmentation réelle et vérifiée séparément : la Californie a sa propre méthode (SB 1422, définie
et adoptée par le State Water Resources Control Board, programme de test de 4 ans, phase 1 démarrée automne 2023,
vérifiée : waterboards.ca.gov, kslaw.com) ; l'UE a sa méthodologie harmonisée propre (décision déléguée de la
Commission du 11 mars 2024, développée par le JRC — Joint Research Centre —, suivi Article 13 de la directive eau
potable dès 2026, vérifiée : joint-research-centre.ec.europa.eu, agencyiq.com) ; l'ISO propose une troisième base
(ISO 24187). Contredit : c'est le type de tâche qu'un LLM générique avec gabarit peut couvrir sans produit dédié,
cas que le filtre du fondateur écarte (Q3, TRI-35.md). **Verdict : non retenu comme produit autonome**, absorbé
dans B : la difficulté n'est pas de reformater du texte mais de maintenir, particule par particule, le lien
preuve-vers-méthode en même temps que la piste d'audit.

## 3. Angle retenu

**B élargi** : copilote de certification et piste d'audit, agnostique de l'instrument et du classifieur amont, qui
relie chaque particule (image, spectre, score, blanc/QC) au certificat conforme et le reformate selon la méthode du
client (ISO 24187, SWRCB Californie, méthodologie JRC/UE). A tombe car déjà résolu gratuitement ; C tombe comme
produit autonome car trop proche d'un gabarit générique sans la traçabilité structurée qui fait la défendabilité
en audit.

## 4. Acheteur

Responsable qualité ou technique d'un laboratoire accrédité ISO/IEC 17025 pratiquant l'analyse microplastiques
(PolyGone, Measurlabs, Eurofins environment testing) — fonction qui répond des audits de surveillance et signerait
un achat de 2 000 $ sans comité (supposée, taille typique de ces structures). Dépense actuelle : à partir de
349 $US/échantillon en tarif de base (vérifiée, dossier d'origine : measurlabs.com, polygonesystems.com) ; chez
Measurlabs, frais de dossier de 97 € par commande en plus, remise sur volume (vérifiée : measurlabs.com). Temps
analyste par échantillon non chiffré ; un article sectoriel 2026 note que le choix de méthode détermine le temps
de technicien et recommande d'automatiser la préparation pour le réduire, signe indirect que le temps humain est
le poste de coût dominant (vérifiée pour le constat, chiffre absent : labmanager.com — **estimation** des heures).

## 5. Produit en 6 lignes

1. Import de l'export instrument (Clarity, OMNIC, OPUS) après classification, quelle qu'en soit la source
   (fabricant, siMPle, Open Specy, IA propre).
2. Chaque particule reliée à son image, son spectre, son score de confiance dans un dossier de preuve structuré.
3. Rapprochement automatique du lot avec les blancs et échantillons de contrôle qualité exigés par ISO/IEC 17025.
4. Génération du certificat au format demandé (ISO 24187, SWRCB Californie, JRC/UE) avec piste d'audit complète.
5. Vérifié : les formats d'échange existent déjà (.spc, JCAMP-DX, OPUS, .spa), l'ingestion multi-instruments est
   technique, pas un blocage de principe. Supposé : qu'aucun éditeur de LIMS microplastiques ne propose déjà ce
   module packagé.
6. IA précisément : extraction et mise en cohérence de documents multi-sources hétérogènes (spectres, images,
   journaux QC) puis génération de texte réglementaire conforme, capacité d'assemblage fiable apparue 2024-2026 —
   jamais la classification elle-même, déjà gratuite ailleurs (angle A).

## 6. Prix, modèle, retour annuel (Q7)

Abonnement mensuel bas plus prix marginal par certificat généré, aligné sur le flux du labo plutôt qu'un prix par
projet. Retour annuel : SB 1422 impose un programme de test pluriannuel avec audits continus (vérifiée :
waterboards.ca.gov) ; le suivi Article 13 UE démarre en 2026 et continue (vérifiée : agencyiq.com) ; les audits de
surveillance ISO/IEC 17025 sont périodiques (vérifiée, dossier d'origine : eurofins.com). Chaque méthode publiée ou
révisée est un gabarit de plus maintenu à jour pour le client.

## 7. Faisabilité depuis Vancouver

Données accessibles : bibliothèque ouverte Open Specy (+40 000 spectres, vérifiée) pour valider l'ingestion ; texte
ISO 24187 (payant, iso.org), méthode SWRCB (public, waterboards.ca.gov), méthodologie JRC/UE (publiée, op.europa.eu).
Matériel : aucun instrument requis, le produit travaille en aval de l'export ; un portable suffit. Permis : aucun.
Ce qui bloque vraiment : obtenir de vrais exports multi-marques (images, spectres, métadonnées) d'un labo
partenaire — aucun jeu de données ouvert multi-instruments avec métadonnées d'audit complètes identifié cette
session (Open Specy n'expose que des spectres, pas un export de run complet avec blancs/QC) ; partenariat à
négocier avant tout test réel.

## 8. La preuve se retourne-t-elle contre l'acheteur

Oui, potentiellement : un certificat généré automatiquement avec une erreur de classification engage la
responsabilité du labo signataire, pas du fournisseur logiciel. Même principe que le candidat 23 (TaxoAssist) :
l'IA propose un dossier de preuve et un projet de certificat avec score de confiance par particule, la signature
reste celle d'un analyste qualifié du labo qui valide avant émission. Le produit vend l'assemblage et la
traçabilité, jamais la décision finale.

## 9. Test à moins de 2 000 $ et deux semaines

Obtenir d'un labo partenaire (PolyGone ou Measurlabs) un lot réel classé sur deux instruments (ex. export Agilent
Clarity et export siMPle/Open Specy sur les mêmes échantillons), assembler le dossier de preuve et générer un
certificat au format ISO 24187 puis SWRCB pour le même lot. Critère chiffré : certificat jugé acceptable sans
correction structurelle majeure par le responsable qualité partenaire, et temps d'assemblage mesuré sous 20 % du
temps déclaré aujourd'hui pour le même certificat à la main (chiffre déclaratif, pas de source publiée).

## 10. Incertitudes et question au client

Incertain : si un LIMS générique déjà en place chez Eurofins/Measurlabs/PolyGone couvre déjà cette fonction
spécifiquement pour les microplastiques ; le temps analyste réel par certificat (**estimation** seulement) ; le
contenu exact exigé par la méthodologie JRC/UE au niveau du certificat individuel (rapport repéré, non lu en
intégralité, budget épuisé) ; si un standard supplémentaire repéré en passant, ISO/FDIS 16094-2 (fiche Agilent
LDIR), ajoute des exigences propres au LDIR non couvertes ici (existence vérifiée, contenu non lu). Question au
client : « Votre LIMS actuel produit-il déjà le certificat ISO/IEC 17025 pour les microplastiques ? Si oui,
qu'est-ce qui manque encore et vous fait perdre du temps à chaque rapport ? »

---

## Résumé (8 lignes)

MicroplasticLab visait l'unification multi-marques des images spectrales FTIR/LDIR : angle mort, siMPle et Open
Specy le font déjà gratuitement et les formats d'échange (.spc, OPUS, JCAMP-DX) existent déjà entre logiciels
propriétaires. L'angle retenu se déplace en aval : un copilote qui assemble, pour chaque particule classée par
n'importe quel outil amont, un dossier de preuve défendable (image, spectre, score, blancs, QC) et génère le
certificat conforme à la méthode exigée (ISO 24187, SWRCB Californie, JRC/UE 2026), avec piste d'audit. Le
déclencheur réglementaire est solide et vérifié (SB 1422 en cours depuis 2023, suivi Article 13 UE dès 2026, audits
ISO/IEC 17025 périodiques), mais l'incertitude majeure n'est pas technique : savoir si le LIMS générique déjà en
place chez les grands labos couvre déjà cette fonction, question à poser directement au client avant d'investir
plus loin. Le test à moins de 2 000 $ suppose un partenariat labo réel, faute de jeu de données ouvert
multi-instruments avec métadonnées d'audit complètes.
