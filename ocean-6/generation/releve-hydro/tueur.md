# Tueur releve-hydro

## Tour 1

### Idee 1 : Releve d'objets et d'habitat du fond marin, produit a partir des donnees deja collectees

MORTE (cause 1, SonarWiz de Chesapeake Technology, module Automatic Target Recognition ATR et outil Seabed
Characterization).

Trois requetes faites. 1) CARIS Mira AI de Teledyne : plateforme cloud AWS, seul outil de classification livre
est le Sonar Noise Classifier, qui nettoie le bruit des sondes bathymetriques (jusqu'a 10x moins de nettoyage
manuel, 95 pourcent de confiance) ; rien sur objet, debris ou habitat. Ne tue pas l'idee, ecarte cet occupant.
Source : teledynecaris.com/en/products/whats-new/caris-mira-ai. 2) SonarWiz de Chesapeake Technology, cite par le
brief parmi ce que l'acheteur paie deja : depuis la version 8.1.0, module Automatic Target Recognition (ATR) fonde
sur un reseau de neurones convolutif (CNN), qui detecte et mesure automatiquement des objets sur une image de
sonar lateral. Source : sea-technology.com/sonarwiz-8-1-0 et chesapeaketech.com/products/sonarwiz-sidescan. 3)
SonarWiz Seabed Characterization Tool : segmente l'imagerie acoustique en classes homogenes pour la classification
de sediment ; guide d'utilisation publie par l'editeur (chesapeaketech.com, SeabedClassification_UserGuide_SW7.pdf)
; une etude academique documente son usage reel pour cartographier un habitat d'herbiers (eelgrass) a partir de
sonar lateral, classes exportees vers un systeme d'information geographique (SIG).

Causes de mort qui s'appliquent : cause 1 directement, un outil deja integre a un logiciel que l'acheteur cible
possede tres probablement (SonarWiz est nomme par le brief lui meme parmi les logiciels deja payes par ce type de
societe de releve, au meme titre que EIVA et QPS) fait deja, dans le meme siege logiciel, la detection d'objets par
IA (ATR) et une premiere classification de texture de fond utilisable pour les herbiers et le fond dur (Seabed
Characterization). Cause 5 en partie affaiblie : la capacite "verifiee" du dossier (EIVA et QPS seuls scopes
pipeline ou non livres en natif) etait vraie mais incomplete, elle n'incluait pas SonarWiz alors que le brief
demandait explicitement de le verifier en premier lieu.

Ce qui manque au dossier : aucune verification de SonarWiz avant d'ecrire l'idee, alors que le brief le nomme
explicitement dans la liste des logiciels deja payes a verifier en priorite (meme rang que CARIS, QPS, EIVA). Pas
de confirmation nominale que MBC, Ocean Surveys Inc ou TerraSond possedent une licence SonarWiz precise (les trois
proprietes ne sont pas confirmees individuellement), mais SonarWiz est un standard courant du sonar lateral cote
et dragage, la probabilite de recouvrement est haute et le brief l'a nomme comme deja paye.

Piste de regeneration la plus credible a partir du cadavre : SonarWiz Seabed Characterization dit lui meme qu'il
donne des classes de texture, pas le type de materiau, "sans echantillonnage de verite terrain" ; et son module ATR
detecte et mesure des objets mais ne les nomme pas (debris de quel type, obstruction reglementaire ou naturelle) ni
ne produit un document pret pour un dossier de permis avec le format et les references qu'exige un regulateur.
L'occupant trouve fait la detection et la segmentation brutes ; il ne fait pas l'etiquetage expert, le
recoupement avec verite terrain, ni la mise en forme reglementaire livree en 48 heures. Une regeneration viable
deplacerait le produit de "nous avons l'IA de detection" (deja fait par SonarWiz) vers "service d'interpretation et
de mise en forme reglementaire des sorties SonarWiz deja produites par le prestataire", un service de labeling et
de redaction, pas un moteur de vision par ordinateur concurrent. A verifier au tour 2 si cette version croise encore
la cause 8 (monoculture "redige le rapport").
