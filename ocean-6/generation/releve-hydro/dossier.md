# Dossier releve-hydro

Date : 7 septembre 2026. Lot source : ocean-6/generation/releve-hydro/lignes.md (registres energies-marines,
laboratoires-surveillance, ports-terminaux-marinas). Recherches web utilisees cette passe : 3 sur 4 autorisees au
total (loi du tour 2 comprise).

## Verification prealable : les editeurs ont-ils deja une IA ?

Recherche faite le 7 septembre 2026 avant d'ecrire toute idee, comme demande.

- EIVA (NaviSuite) a un module livre et commercialise, NaviSuite Deep Learning Pipeline Inspection : il
  "identifie automatiquement les objets d'interet" et, cite du site EIVA, "cherche les debris, dommages,
  joints, anodes et anomalies" sur une conduite ou un cable suivi par vehicule sous marin. Portee etroite :
  scope pipeline et cable, pas le fond marin generique d'un releve de dragage.
  Source : https://www.eiva.com/products/navisuite/navisuite-processing-software/navisuite-deep-learning-pipeline-inspection
- QPS (Qimera) a de l'automatisation de flux (import "mains libres", suggestions d'etapes suivantes, Qimera
  Live pour le maillage quasi temps reel, module de traitement de la retrodiffusion). La documentation dit que
  des "algorithmes de reconnaissance de cible par apprentissage profond (CNN) peuvent etre integres" : formulation
  qui signale une integration tierce possible, pas une fonction de classification de cible ou d'habitat livree en
  natif dans Qimera.
  Source : https://qps.nl/qimera/ et https://qps.nl/qimera/all-specifications/
- Teledyne CARIS (HIPS/SIPS) automatise depuis les annees 2000 la fabrication de la surface bathymetrique et le
  rejet statistique des sondes aberrantes (CUBE, Combined Uncertainty and Bathymetry Estimator). Cette
  automatisation porte sur la profondeur, pas sur la classification semantique d'une image de sonar lateral ou
  de retrodiffusion (objet, debris, habitat).

Conclusion de la verification : les trois editeurs automatisent la fabrication de la surface bathymetrique et,
pour EIVA seul, la detection d'objets sur une conduite. Aucun des trois ne livre en natif une classification de
cible et d'habitat pour un releve de dragage generique. C'est le trou retenu.

## Tour 1

### Idee 1 : Releve d'objets et d'habitat du fond marin, produit a partir des donnees deja collectees

1. Ligne de dépense d'origine : #19, registre laboratoires-surveillance. Qui paie : societes de releve
   hydrographique et petites societes de ROV (vehicule sous marin teleguide). Combien lu : 75 108 $ US par an en
   moyenne (technicien maitrisant HYPACK, CARIS, pilotage ROV, ZipRecruiter et grille NOAA citee dans l'offre,
   2026). A qui : salarie technicien de releve. Lignes de soutien : #4 registre ports terminaux marinas (releve
   bathymetrique de marina, 6 500 $ US/jour de navire, environ 30 acres/jour) et #19 registre energies marines
   (licences EIVA NaviSuite, QPS Qimera/QINSy/Fledermaus, CARIS HIPS/SIPS, Hypack, prix non publie mais achat
   prouve par l'exigence systematique dans les offres d'emploi).

2. Le trou : la ligne #19 laboratoires dit explicitement "le poste ne couvre pas le traitement final des
   donnees, souvent sous traite a un bureau d'etudes". La ligne #4 dit "le releve mesure la profondeur, pas la
   contamination des sediments ; des essais separes restent necessaires", preuve que le livrable bathymetrique
   paye exclut deja d'autres caracterisations du fond. Or une caracterisation precise est exigee avant travaux :
   les projets de dragage pres de la cote demandent une cartographie des herbiers (SAV, vegetation aquatique
   submergee) et un releve d'obstructions au sonar lateral avant permis, comme le montre l'exemple d'un permis
   californien qui exige qu'un releve sonar soit conduit "en pleine conformite" avec le protocole de suivi avant
   le debut des travaux de dragage (source : rapport de la California Coastal Commission, F5b 2025,
   https://documents.coastal.ca.gov/reports/2025/5/F5b/F5b-5-2025-report.pdf). Ce travail de reperage et de
   classification (objet, obstruction, herbier, fond dur) reste fait a la main par un interprete, distinct du
   logiciel de traitement bathymetrique deja paye et distinct de l'operateur qui a acquis la donnee.

3. Le produit en une phrase : un rapport qui repere et nomme, sur la carte du fond deja enregistree pendant le
   releve, les obstacles, debris et zones d'herbiers, livre en plus du rapport de profondeur habituel.

4. Ce que fait l'IA : classification et segmentation d'objets et de textures de fond sur une image de sonar
   lateral ou de retrodiffusion par reseau de neurones convolutif. Vérifiée (source) : "Target Detection and
   Segmentation in Circular Scan Synthetic Aperture Sonar Images using Semi Supervised Convolutional Encoder
   Decoders", 2021, https://arxiv.org/pdf/2101.03603 ; "Weakly Supervised Semantic Segmentation of Circular Scan,
   Synthetic Aperture Sonar Imagery", janvier 2024, https://arxiv.org/pdf/2401.11313. Vérifiée (source) egalement
   par un produit commercial deja vendu sur une tache voisine (detection d'objets sur image sonar/camera de
   conduite sous marine) : EIVA NaviSuite Deep Learning Pipeline Inspection, source citee plus haut.

5. L'acheteur du barreau 1 : trois societes privees nommees. MBC Applied Environmental Sciences (sciences
   aquatiques appliquees, propose deja des services de releve incluant la cartographie du type de fond dont les
   herbiers, mbcaquatic.com/service/surveying-services, trouve cette passe). Ocean Surveys Inc (Old Saybrook,
   Connecticut, releves bathymetriques et sonar lateral pour ports et marinas prives). TerraSond (Alaska,
   releves hydrographiques prives sous contrat). Ce qu'elles paient aujourd'hui : le jour de navire (6 500
   $/jour, ligne #4), le salaire du technicien qui ne couvre pas le traitement final (ligne #19 labs), et la
   sous-traitance ponctuelle a un bureau d'etudes ou un biologiste marin pour l'interpretation d'image, facturee
   a la mission, hors de leur controle et de leur calendrier. Pourquoi acheter a une societe d'une personne
   plutot qu'a l'editeur : CARIS, QPS et EIVA vendent un outil general par licence de siege, pas un livrable fini
   par projet ; une petite societe de releve ne veut pas un siege logiciel de plus a maitriser, elle veut un
   rapport pret a joindre au dossier de permis de son client, dans le format et le delai qu'elle choisit, sans
   embaucher un specialiste en image sonar a demeure.

6. La population : le lot source note "marche nord americain actif (offres NOAA, APTIM, Tetra Tech)" sans
   comptage precis (ligne #19 labs). Cette passe n'a pas fait de recherche de comptage dedie (budget de recherche
   epuise a trois requetes sur quatre). Estimation prudente : plus de 25 societes privees de releve hydrographique
   operent en Amerique du Nord sur ce segment cote/dragage, d'apres l'activite d'offres d'emploi deja sourcee
   (crewbase.pro, ZipRecruiter, offres NOAA/APTIM/Tetra Tech citees dans le lot) et la liste meme des acheteurs du
   point 5 trouves independamment. Un comptage exact reste a faire au tour 2 si le budget de recherche le permet.

7. Le prix vise : 900 a 2 200 $ US par rapport et par projet, livre en 48 heures a partir de donnees deja
   acquises (pas de jour de navire supplementaire). Rapporte a la ligne d'origine : c'est environ un tiers a la
   moitie du jour de navire deja facture (6 500 $/jour, ligne #4) et proche d'un jour de chef de mission (900 a 1
   400 $/jour, ligne #7 energies marines), mais ne remplace aucun jour existant : la societe de releve facture ce
   rapport comme ligne supplementaire a son client, en plus du jour de navire et du rapport de profondeur deja
   vendus.

8. Question 8 par mecanisme.
   Qui detient aujourd'hui la donnee qui s'accumulerait : le prestataire de releve detient deja les donnees
   brutes de retrodiffusion et de sonar lateral (ligne #4 : "le prestataire detient les donnees brutes ; le
   client recoit un rapport de volume") ; il les transmettrait projet par projet au fondateur pour classification.
   Pourquoi il laisserait le fondateur accumuler les images annotees : la societe de releve n'a ni le temps ni le
   metier pour construire et entretenir un modele de classification (son metier est l'acquisition, pas
   l'entrainement de reseaux de neurones) ; l'accord de service prevoit que les images annotees et les
   corrections de l'interprete humain, une fois anonymisees region par region, ameliorent la precision du
   prochain rapport pour ce meme client, ce qui reduit le risque de manquer un obstacle et donc la responsabilite
   du prestataire envers son client.
   Ce qui rend le depart couteux en annee trois : le modele est alors calibre sur les signatures locales du
   secteur (types de debris, textures d'herbiers, fond dur propres a la region deja couverte sur plusieurs
   campagnes) ; changer de fournisseur oblige a reconstituer cet historique depuis zero. De plus, pour les sites
   a dragage d'entretien repete (meme marina, meme chenal, releve tous les un a trois ans), l'autorite qui
   instruit le permis attend une continuite du releve d'objets et d'habitat d'une campagne a l'autre ; changer de
   prestataire de classification casse cette serie et expose le client final a une demande de reprise du suivi
   par le regulateur.

9. L'occupant le plus proche : EIVA NaviSuite Deep Learning Pipeline Inspection, verifie cette passe. Il ne fait
   pas de classification de cible et d'habitat pour un releve de dragage generique : sa detection est entrainee
   et vendue pour reperer des anomalies sur une conduite ou un cable suivi, pas des herbiers ou des debris epars
   sur un fond de marina. Second occupant potentiel ecarte : les outils d'image benthique de la carte des
   occupants (BIIGLE, CoralNet, ReefCloud, BENTHIQ) traitent des photos ou videos de plongee pour le suivi
   ecologique, pas des mosaiques de sonar lateral ou de retrodiffusion liees a un dossier de permis de dragage ;
   modalite de donnee et flux de vente differents.

10. Pre-mortem : en 2031 la societe est morte. Cause numero 1 redoutee : QPS ou EIVA livre en natif, dans
    Qimera ou NaviSuite, un module general de classification de cible et d'habitat (pas seulement pipeline) et
    l'integre gratuitement a la licence deja payee par le client. Verification que cette cause n'est pas deja
    realisee aujourd'hui : recherche faite le 7 septembre 2026 sur les pages produit et specifications de QPS
    Qimera et sur la page produit EIVA Deep Learning ; aucun module general de classification d'objet et
    d'habitat du fond n'est annonce ou liste au catalogue, le module EIVA reste explicitement scope pipeline et
    cable (sources citees aux points 2 et 4).

11. Les dix causes de mort.
    1. Occupant deja finance sur ce barreau : non realisee, verifiee cette passe (EIVA scope pipeline, QPS non
       livre en natif, CARIS limite a la surface bathymetrique).
    2. Point de depart public qui revient a chaque passe : non, le point de depart est une ligne de salaire et
       de jour de navire privee (lignes #19 labs, #4 marinas), precisee par une exigence de permis documentee,
       pas par un texte ou une tendance generale seuls.
    3. Acheteur sans ligne budgetaire : non, l'acheteur facture deja le jour de navire et le rapport de
       profondeur a son client ; le nouveau rapport s'ajoute a une facture existante.
    4. Preuve qui accuse celui qui tient la donnee : non applicable, service achete volontairement par le
       prestataire pour son propre livrable, aucune fonction de controle ou de denonciation.
    5. Capacite supposee promue en fait : non, etiquetee verifiee (source) avec deux publications datees (2021,
       2024) et un produit commercial deja vendu sur une tache voisine (EIVA).
    6. Population non comptee : partiellement corrigee au point 6, honnetement signalee comme estimation a
       affiner faute de budget de recherche restant.
    7. Question 8 repondue par condition : non, clause et interet concrets donnes au point 8, pas de "si masse
       critique".
    8. Monoculture d'agents (redige le rapport, devient le standard, score assureur) : non, le produit est une
       classification d'image sonar par vision artificielle qui produit une carte et une liste d'objets, pas une
       redaction de texte reglementaire ni un score vendu a un assureur.
    9. Gain de productivite vendu a qui facture le jour : non, facture comme ligne de livrable nouvelle que le
       prestataire revend a son client, en plus du jour de navire deja facture, pas comme raccourci sur un jour
       existant.
    10. Barreau 1 public ou grand compte : non, trois acheteurs nommes sont des societes privees de releve
        (MBC Applied Environmental Sciences, Ocean Surveys Inc, TerraSond), aucune agence.

## Tour 2

### Verdict du tueur sur l'idee 1

MORTE, cause 1. Le tueur a verifie SonarWiz de Chesapeake Technology, logiciel nomme par le brief lui meme parmi
les logiciels deja payes, et non verifie par moi au tour 1. SonarWiz a, depuis la version 8.1.0, un module ATR
(Automatic Target Recognition) fonde sur un reseau de neurones convolutif qui detecte et mesure des objets sur le
sonar lateral, et un outil Seabed Characterization qui segmente l'image acoustique en classes de texture de fond,
deja utilise dans une etude academique pour cartographier des herbiers. L'idee 1 (classification d'objets et
d'habitat) est donc deja faite, dans le meme siege logiciel que la cible achete probablement deja.

Piste ecartee du tueur : etiquetage expert et mise en forme reglementaire des sorties SonarWiz deja produites.
Le coordinateur l'a explicitement classee cause 8 (monoculture "redige le rapport") sauf preuve qu'un modele
generique avec la grille publique du regulateur echoue sur cette tache precise. Cette preuve n'a pas ete
recherchee cette passe (budget d'une seule requete, utilisee ailleurs, voir ci dessous) : la piste n'est donc
pas prise.

### Verification des trois pistes de regeneration proposees

Une seule requete web utilisee ce tour (budget total du dossier desormais a 4 sur 4).

1. Le trou entre deux releves ("rien entre deux relevés") a la marina qui paie 6 500 $/jour de navire. Piste
   ecartee sans recherche dediee : la surveillance entre deux releves complets par apport de sondes eparses
   existe deja a large echelle par crowdsourcing grand public (Navionics SonarChart Live, Garmin Quickdraw
   Community, programme de bathymetrie participative de l'Organisation hydrographique internationale, connu de
   la memoire des occupants comme categorie active). De plus l'acheteur naturel d'un tel service est le
   plaisancier ou la marina, pas la petite societe de releve privee imposee comme acheteur de ce lot : la piste
   sort du barreau 1 autorise pour ce lot avant meme la question de l'occupant.

2. Le traitement differe sous traite (ligne #19 laboratoires, "souvent sous traite a un bureau d'etudes"). Sans
   la piste 1 du tueur (interdite sauf preuve), ce qui reste du traitement differe apres detection ATR et
   segmentation de texture SonarWiz est justement l'etiquetage expert et la mise en forme reglementaire, donc la
   meme cause 8. Aucune sous piste distincte trouvee dans le temps imparti.

3. La donnee que personne ne tient en serie par site a travers plusieurs relevés d'entreprises differentes.
   Requete faite : "bathymetric survey data archive continuity multiple survey companies marina dredge history
   change detection software 2024 2025". Resultat : Esri ArcGIS Bathymetry est vendu explicitement pour
   "maintenir une archive historique pour comparer les donnees de releve anciennes aux donnees modernes" et
   visualiser des donnees multi temporelles et multi resolutions pour la detection de changement (source :
   esri.com/en-us/arcgis/products/arcgis-bathymetry/overview). La NOAA NCEI (National Centers for Environmental
   Information) tient deja l'archive nationale des releves hydrographiques (NOS) et une base de metadonnees de
   releve (HSMDB), reference standard du secteur (source : ngdc.noaa.gov/mgg/bathymetry/hydro.html). Cause 1 :
   cette piste est deja occupee par un outil deja vendu (ArcGIS Bathymetry) et une archive publique deja tenue
   (NCEI), au moins pour toute donnee qui a ete numerisee et deposee. Une niche plus etroite existerait
   peut-etre (numeriser les vieux rapports papier ou PDF d'un concurrent qui n'a jamais rejoint ArcGIS ni NCEI,
   proprietaires des societes de releve qui se succedent sur un meme site), mais je n'ai pas de publication
   datee verifiee cette passe pour l'IA specifique requise (extraction et georeferencement automatique de
   sondes depuis un document scanne), faute de requete restante ; l'etiqueter "verifiee" serait la faute meme
   que le tueur a sanctionnee au tour 1 (cause 5, capacite supposee promue en fait).

### Conclusion : pas de regeneration

Aucune des trois pistes ne tient de facon honnete avec le budget de recherche restant. Deux tombent sur la
cause 1 (occupant deja finance : SonarWiz pour la piste initiale, ArcGIS Bathymetry et NCEI pour la piste de
continuite multi entreprises), une tombe sur la cause 8 (monoculture "redige le rapport", interdite sans preuve
que je n'ai pas produite), et une sort du barreau 1 impose a ce lot (l'acheteur du crowdsourcing entre deux
releves n'est pas une petite societe de releve). La niche etroite de numerisation de rapports historiques non
integres a ArcGIS ou NCEI reste possible mais non verifiee : je refuse de l'ecrire comme idee tant qu'elle n'a
pas sa publication datee, pour ne pas repeter la cause 5. Ce lot se clot donc sur un resultat accepte de mort
honnete plutot que sur une regeneration forcee.
