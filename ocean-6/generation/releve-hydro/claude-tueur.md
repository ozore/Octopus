# Memoire du tueur, dossier releve-hydro

Role : tueur apparie du generateur releve-hydro, passe 6. Lit BRIEF-TUEUR.md, MEMOIRE-MORTS.md, puis seulement
dossier.md et lignes.md de ce dossier. Ne lit rien d'autre du depot.

## Tour 1, idee 1 (Releve d'objets et d'habitat du fond marin)

Verdict : MORTE, cause 1. L'occupant qui tue : SonarWiz de Chesapeake Technology, module Automatic Target
Recognition (ATR, reseau de neurones convolutif, detection et mesure d'objets sur sonar lateral) plus l'outil
Seabed Characterization (segmentation de l'imagerie acoustique en classes de texture de fond, deja utilise en
pratique pour cartographier des herbiers/eelgrass).

Pourquoi le dossier ne l'avait pas vu : sa "verification prealable" a controle EIVA NaviSuite, QPS Qimera et
Teledyne CARIS (HIPS/SIPS), mais pas SonarWiz ni CARIS Mira AI, alors que le brief nommait les deux explicitement
dans la liste "ce que l'acheteur paie deja" a verifier en priorite.

Requetes faites ce tour (3, plafond respecte) :
1. "CARIS Mira AI Teledyne seabed target classification automated" : Mira AI est une plateforme cloud AWS dont le
   seul outil livre est le Sonar Noise Classifier (nettoyage de bruit de sondage bathymetrique). N'est pas un
   classificateur d'objet ou d'habitat. N'ecarte pas l'idee.
2. "SonarWiz Chesapeake Technology automatic target recognition side scan sonar debris bottom classification" :
   confirme le module ATR (CNN) et l'outil Seabed Characterization Tool, tous deux dans le meme logiciel que les
   societes de releve possedent deja frequemment.
3. "SonarWiz Seabed Characterization module vegetation eelgrass habitat report dredging permit" : confirme un usage
   documente pour la cartographie d'herbiers (eelgrass) a partir de sonar lateral, avec la reserve ecrite par
   l'editeur que l'outil donne des classes de texture, pas le type de materiau, sans verite terrain.

Piste de regeneration laissee pour le tour 2, si le generateur relance sur ce lot : deplacer le produit de la
detection IA (deja faite par SonarWiz) vers un service d'etiquetage expert et de mise en forme reglementaire des
sorties deja produites par les logiciels existants (SonarWiz, EIVA, QPS), livre pret a joindre au dossier de permis.
Point de vigilance signale pour le tour 2 : cette version frole la cause 8 (monoculture "redige le rapport"), a
verifier avant de la proposer.

Aucune autre idee recue ce tour (un seul dossier, une seule idee transmise par le generateur).
