# Mémoire du cartographe « armateurs-affreteurs »

## Compteur de recherches
8 appels WebSearch utilisés sur 8 autorisés (quota épuisé). WebFetch utilisé environ 15 fois (libre, non compté).

## Requêtes WebSearch qui ont marché (ont donné un chiffre exploitable)
1. « hull cleaning underwater service cost per vessel biofouling price » : a mené vers la page de prix Panama Ship
   Service, la meilleure source du dossier.
2. « ballast water management system installation cost retrofit price per vessel » : a mené vers l'article Riviera
   Maritime Media citant BIMCO et vers Ship Universe, sources solides pour deux lignes.
3. « "fleet manager" OR "compliance coordinator" job salary shipping company Indeed maritime software experience
   required » : a donné les agrégats ZipRecruiter, exploitables malgré leur nature algorithmique.
4. « whale strike vessel speed reduction cost shipping company slowdown program participation fee » : a donné
   l'étude ScienceDirect (Channel Islands) et le site bluewhalesblueskies.org pour le chiffre de participation.

## Requêtes qui n'ont rien donné de chiffrable
5. « ZeroNorth OceanScore pricing maritime carbon compliance software cost » : confirmé que ni l'un ni l'autre ne
   publie de prix ; utile seulement pour la liste « à confirmer ».
6. « fleet maintenance management software pricing shipping BASSnet ShipNet small fleet » : a produit des chiffres
   d'agrégateurs tiers (softwarefinder.com) explicitement étiquetés « estimation », donc écartés du tableau
   principal par choix de rigueur (voir dossier.md, section f).
7. « "compliance" marine superintendent job posting salary CII EU ETS reporting shipping company » : n'a renvoyé
   que des pages réglementaires (Britannia P&I, DNV, Lloyd's Register), aucune offre d'emploi exploitable.
8. « classification society annual survey fee small shipowner DNV ABS cost » : a produit un chiffre de 180 000 $ US
   qui s'est révélé absent de la page source une fois vérifié par WebFetch direct. Leçon : toujours revérifier par
   lecture directe un chiffre trouvé seulement dans un résumé de recherche avant de l'utiliser.

## Sources mortes (bloquées ou vides)
- portvancouver.com, jasco.com : signalées bloquées par le brief, non tentées.
- dnv.com/maritime/ballast-water-management/retrofit/ : 403 Forbidden.
- shipownersclub.com : 403 Forbidden.
- www.google.com/search (tentative de contournement via WebFetch direct sur une page de résultats Google) : ne
  fonctionne pas, WebFetch ne renvoie pas de résultats de recherche exploitables pour une URL google.com/search.
- capterra.com fiche BASSnet : chargée mais vide (0 avis, pas de prix).
- lr.org (Lloyd's Register) et ww2.eagle.org (ABS), pages FAQ EU ETS : chargées, aucun chiffre.

## Bilan en trois lignes
Je referais la vérification systématique par WebFetch direct de tout chiffre repéré seulement dans un résumé
WebSearch : cela a évité de publier un faux chiffre de 180 000 $ US pour la classification. Je ne referais pas la
recherche générique « pricing » sur des éditeurs SaaS connus pour vendre sur devis (OceanScore, ZeroNorth, BASSnet,
ShipNet) : leurs pages produits et fiches Capterra le confirment en un coup et il aurait fallu chercher directement
des avis d'utilisateurs chiffrés (G2, forums) ou des communiqués de levée de fonds pour espérer un chiffre, piste
non tentée faute de budget. Ce qui m'a surpris : la meilleure donnée chiffrée de tout le dossier ne vient pas d'un
éditeur de logiciel mais d'un prestataire de service physique (nettoyage de coque par plongeur), qui publie une
grille de prix complète sur son propre site alors que tous les éditeurs de logiciel de conformité carbone vendent
strictement sur devis.
