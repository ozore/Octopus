# Mémoire de creusement, agent c33-preuve-vivante

Date : 7 septembre 2026. Échelle creusée : Preuve Vivante (échelle 1 du dossier de tendance
`ocean-5/agents/restauration-echelle/dossier.md`).

## Compteur de recherches

WebSearch utilisées : 8 sur 8 autorisées (plafond atteint, ne plus en faire).
WebFetch utilisées : 5 (libres, non comptées).

## Requêtes WebSearch, dans l'ordre, et ce qu'elles ont donné

1. "RIBITS USACE mitigation bank monitoring success criteria performance bond release oyster reef"
   -> confirme RIBITS (Regulatory In lieu fee and Bank Information Tracking System, registre public
   de l'USACE, Army Corps of Engineers) comme registre, mais pas de détail chiffré sur la durée exacte
   ou la libération de caution dans les résumés. A creusé plus loin avec une requête 7.
2. "Florida oyster reef living shoreline mitigation monitoring consulting firm quadrat survey"
   -> a trouvé Ecological Consulting Services Inc (ECS, Floride) et Ocean Consulting FL, deux cabinets
   qui font déjà ce travail à la main. Bonne requête, à refaire pour d'autres échelles côtières.
3. "CoralNet Restor.eco oyster reef seagrass image analysis machine learning monitoring tool"
   -> CoralNet confirmé (r>0,97 vs comptage humain sur corail), Restor.eco absent des résultats
   (aucune preuve trouvée cette session, ni pour ni contre son usage sur la survie par photo).
4. "EarthBalance Ecosystem Investment Partners mitigation bank monitoring services Florida"
   -> les deux sponsors imposés par la mission sont surtout des opérateurs de banques de zones humides
   d'eau douce en Floride, pas de banque huître ou rivage vivant confirmée. Nuance importante,
   documentée dans le dossier.
5. "oyster count deep learning quadrat photo accuracy seagrass shoot density image classifier"
   -> bonne requête : plusieurs papiers (subtidal seagrass detector 97 à 98%, Faster R CNN, étude
   huître/zostère au Japon 80%) mais rien de spécifique à l'huître américaine (Crassostrea virginica)
   ni au contexte réglementaire des États Unis.
6. "California eelgrass seagrass mitigation bank restoration monitoring compensatory developer"
   -> a donné la California Eelgrass Mitigation Policy (CEMP, NOAA Fisheries, 2014) et le chiffre clé
   77% des projets de compensation qui atteignent leurs jalons (donc 23% qui échouent ou traînent).
   A aussi révélé que le plus gros exemple réel (banque de zostère de la baie de San Diego) est opéré
   par l'US Navy, donc un acheteur militaire exclu par les interdits du fondateur.
7. "USACE compensatory mitigation monitoring duration years annual report performance standards
   financial assurance release" -> a donné la règle fédérale précise : minimum cinq ans de suivi,
   réduction possible si deux rapports annuels consécutifs démontrent le succès. Complète la requête 1.
8. "DFO Canada fish habitat offsetting compensation monitoring self-report requirement"
   -> a confirmé que le Canada (Pêches et Océans Canada, DFO, Fisheries and Fish Habitat Protection
   Program, FFHPP) a un régime comparable mais moins structuré : pas de marché de crédits publics
   comparable à RIBITS, pas de caution financière obligatoire identifiée, obligation de suivi et de
   rapport au promoteur mais sans standard national unique. Sert à distinguer l'échelle des États Unis
   d'une piste canadienne antérieure du fondateur, sans avoir lu cette piste.

## WebFetch (libres)

- ecologicalconsultingservices.com : confirme 15 ans de suivi d'huîtres à Pensacola Bay, relevé drone,
  pas de client nommé par catégorie sur le site.
- ecosystempartners.com (Boran Ranch) : confirme banque d'eau douce, pas de suivi in situ détaillé.
- floridamitigationbanking.org/members : seulement deux banques sur l'annuaire touchent au côtier ou
  estuarien (Everglades Mitigation Bank, mangrove/eau salée ; Mangrove Point Mitigation Bank, 469 acres
  estuariens). Aucune banque purement huître ou rivage vivant trouvée en Floride dans cet annuaire.
  Signal important : le marché de banques de compensation spécifiquement huître/rivage vivant est
  ténu, la compensation se fait surtout par permis direct (Environmental Resource Permit, ERP) plutôt
  que par achat de crédits.
- res.us : Resource Environmental Solutions revendique 448 miles de littoral restauré, mais aucun
  projet côtier nommé trouvé dans le contenu récupéré.
- sandiego.gov (PDF plan de compensation zostère) : PDF illisible (artefacts binaires), abandonné après
  un échec, pas de deuxième tentative (règle des deux échecs suivie).

## Sources mortes ou peu utiles

- Restor.eco : aucune preuve trouvée pour ou contre un usage dans la notation de survie par photo.
  Traité comme connaissance générale non vérifiée cette session (plateforme mondiale de suivi de sites
  de restauration, pas connue pour du comptage de survie automatisé par photo).
- PDF du plan de compensation de zostère de San Diego : illisible via WebFetch, non retenté.
- Aucun nom d'entreprise privée précise de promoteur immobilier ou portuaire sous obligation de rivage
  vivant trouvé cette session malgré deux tentatives de requête différentes (2 et 6) plus une tentative
  WebFetch ciblée. Lacune assumée, documentée dans le dossier.

## Leçons

- Chercher d'abord l'annuaire d'une association professionnelle (ici FAMB, Florida Association of
  Mitigation Bankers) donne vite une vue d'ensemble du marché réel, plus fiable qu'une recherche
  générique.
- Les cabinets qui font déjà le geste manuel (ECS) sont aussi les meilleurs indices de qui pourrait
  vendre l'automatisation en premier, en interne, avant un fondateur externe.
- Le remplacement du port de Tampa Bay par des acheteurs privés nommés est plus difficile que prévu :
  le marché huître/rivage vivant en Floride passe surtout par le permis direct, pas par des banques de
  compensation privées dédiées, ce qui réduit le nombre de sponsors de banques réellement pertinents.

## Bilan en trois lignes

Ce que je referais : chercher l'annuaire professionnel (FAMB) avant de chercher des entreprises une par
une, cela a été le meilleur rendement par requête de toute la session.
Ce que je ne referais pas : insister sur Restor.eco et sur un promoteur privé nommé sans succès après
deux tentatives ; j'aurais dû basculer plus vite vers une reformulation orientée permis (ERP) plutôt que
mitigation bank.
Ce qui m'a surpris : la Floride, malgré son statut de capitale de la compensation écologique, n'a presque
aucune banque de compensation dédiée à l'huître ou au rivage vivant ; l'essentiel du suivi payé à la main
passe par le permis direct et par des cabinets généralistes comme ECS, pas par un marché de crédits.
