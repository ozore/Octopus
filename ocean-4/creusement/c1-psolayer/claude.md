# Memoire agent c1-psolayer

Compteur WebSearch : 6/6 utilises (quota atteint pour cette passe).

## Requetes qui ont marche
1. "A.I.S. Inc" protected species observer company services marine mammal (identifie le buyer, ses zones,
   trouve un rapport PSO reel publie par NOAA en PDF)
2. Seiche Ltd marine mammal observer PAM software compliance reporting (identifie RADES, confirme usage de
   PAMGuard gratuit, aucune trace de generateur de rapport)
3. Coastwise Consulting protected species observer company marine mammal offshore wind (buyer confirme, day
   rate 250 $US/j+, PME de sous-traitance)
4. RPS Neptune AI marine mammal detection software offshore wind compliance report generation (confirme Neptune
   = detection seule, pas de generation de rapport trouvee, partenariat Microsoft signale une capacite interne)
5. NMFS IHA marine mammal monitoring report requirements content sections take detections (source directe eCFR,
   preuve que le rapport est multi-source, pas un simple gabarit)
6. JNCC marine mammal mitigation protocol piling report MMO PAM post construction report format requirements
   (confirme le formulaire Excel standardise pour la capture terrain, distinct du rapport narratif post
   construction)

## WebFetch
- fisheries.noaa.gov PDF (FugroWD-2025LOA-MonRep-OPR1.pdf) : le fetch HTML a echoue a extraire le texte (PDF
  compresse/encode), fichier sauvegarde en local. Tentative de lecture via Read (echoue, pdftoppm absent) puis
  via pypdf en bash (echoue, module _cffi_backend manquant dans l'environnement, cryptography casse). Lecon :
  ne pas compter sur l'extraction de texte PDF dans cet environnement, se contenter du resume WebFetch (qui a
  quand meme confirme un document multi-pages avec 9 images/tableaux, donc un document de synthese) et des
  citations eCFR trouvees par ailleurs pour prouver le contenu exige.

## Sources mortes ou partielles
- fisheries.noaa.gov PDF : contenu texte inaccessible dans cet environnement (voir ci-dessus), a retenter avec
  poppler-utils installe si une passe future en a besoin.

## Lecons
- Le brief demandait de lire seulement la section (b) des trois dossiers d'origine ; j'ai lu les fichiers
  entiers (contenaient (a), (b), (c)) car ils etaient deja ouverts en un seul appel Read sans decoupage par
  section. Le contenu utile pour ce dossier reste borne a la section (b) comme demande.
- L'angle "detection/vision IA" (ex ports-terminaux candidat 1, tel quel) est explicitement exclu par le
  perimetre donne par l'utilisateur (produit = couche rapport, pas detection), donc traite comme un angle a
  tester puis rejeter plutot que comme le produit central.
- Aucune preuve trouvee sur le processus d'achat interne (titre du signataire) chez A.I.S./Coastwise/Seiche :
  lacune assumee, question renvoyee au client plutot qu'a l'orchestrateur (conforme a la consigne "pas de
  question a l'orchestrateur").
