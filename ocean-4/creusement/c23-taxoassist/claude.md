# Mémoire — c23-taxoassist

Compteur WebSearch : 6/6 utilisés (quota atteint).

## Requêtes WebSearch qui ont marché
1. `DiversityScanner BugFlow BIIGLE benthic macrofauna AI species identification 2025 2026` — a donné
   DiversityScanner (insectes, Museum für Naturkunde Berlin) et BIIGLE/Largo, mais rien sur « BugFlow » (introuvable,
   probablement un nom mal mémorisé ou trop récent/obscur pour l'index de recherche).
2. `NMBAQC ring test AI assisted taxonomic identification macroinvertebrate acceptable` — pas de réponse directe sur
   l'acceptabilité IA, mais a révélé l'existence du rapport « Development of the NMBAQC Video Ring Test »
   (envision.uk.com) — piste utile, creusée ensuite en WebFetch (échec, PDF illisible).
3. `benthic macrofauna sample sorting identification cost taxonomist hourly rate laboratory UK per sample` — aucun
   chiffre trouvé, seulement des pages de service sans tarifs (APEM, Ecospan, Eco Marine Consultants).
4. `BIODISCOVER imaging system marine benthic macrofauna deep learning identification` — a donné le système
   BIODISCOVER (Ärje et al., Suède) : eau douce, pas marin, mais précédent solide (97-99 % précision, dataset
   Zenodo ouvert).
5. `"per sample" cost benthic infauna taxonomy identification USD quote environmental monitoring 2025` — aucun
   chiffre par échantillon trouvé ; seulement des ordres de grandeur eDNA (« several hundred dollars »), hors sujet.
6. `GBIF WoRMS open image database marine benthic invertebrate specimen photographs species reference` — a donné
   SMarTaR-ID (cadre 2019, pas base de données), la collection Scripps SIO-BIC (spécimens benthiques, images mises à
   jour chaque semaine, à explorer dans une passe suivante), et BenthicNet (imagerie de fond marin, pas spécimens).

## Sources mortes / échecs WebFetch
- `envision.uk.com/.../envision-report-development-of-the-nmbaqc-video-ring-test.pdf` : PDF illisible par l'outil
  (encodage FlateDecode/DCT), seul le titre a pu être vérifié via le résultat de recherche.
- `arxiv.org/pdf/1708.06899` (« Human experts vs. machines in taxa recognition ») : PDF illisible par l'outil,
  contenu non exploité. À retenter en cherchant une version HTML (abstract page arxiv.org/abs/1708.06899).
- `biorxiv.org/content/10.1101/2022.10.20.509848.full.pdf` (« Taming the data deluge ») : erreur HTTP 429 (trop de
  requêtes), non retenté faute de budget. Piste à reprendre : chercher la version publiée (pas préprint) ou la page
  HTML biorxiv plutôt que le PDF direct.
- Pages ncbi.nlm.nih.gov/pmc/articles/... redirigent systématiquement vers pmc.ncbi.nlm.nih.gov/articles/... (301) ;
  utiliser directement l'URL pmc.ncbi.nlm.nih.gov pour éviter un aller-retour WebFetch.

## Leçons
- Les jeux de données ouverts d'imagerie existent pour la macrofaune benthique, mais presque tous sont soit
  dulcicoles (BIODISCOVER/Ärje), soit in situ sur fond marin (Svalbard, BenthicNet), jamais des spécimens marins
  individuellement photographiés après tri en laboratoire — c'est le vrai vide, plus précis que ce que suggérait le
  dossier d'origine (qui citait seulement CoralNet/iBivalves/EchoAI/FishAI, tous hors périmètre benthique trié).
  Confirme la logique du candidat 21 BenthicClass écarté par le tri (BIIGLE/SeaDeep = famille imagerie in situ,
  domaine différent de TaxoAssist).
- Le rapport NMBAQC Video Ring Test (2022, Envision) est le signal le plus important trouvé cette passe : il change
  le calcul de risque de l'angle « protocole » (candidat non affilié pourrait être exclu si NMBAQC internalise déjà
  l'évaluation par image). Mérite un WebFetch réussi dans une passe suivante (essayer la version HTML si elle
  existe, ou contacter directement Envision Mapping / NMBAQC).
- Aucun chiffre par échantillon ou par heure de taxonomiste trouvé malgré 3 requêtes dédiées (2, 3, 5) — à traiter
  comme lacune assumée, pas à re-creuser sans une source différente (devis direct, appel d'offres).
- La collection Scripps SIO-BIC (images de spécimens benthiques mises à jour chaque semaine, en accès public) n'a
  pas été explorée faute de budget WebSearch restant — piste prioritaire pour la prochaine passe sur la disponibilité
  d'images de référence.
