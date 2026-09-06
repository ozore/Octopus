# Mémoire agent florida-gulf

## Plan
- Brief lu, IDEAS.md lu (12 idées exclues : DriftBox, GearTrace, PelletGuard, TrueBlue Claims, Plastic Credit Ratings,
  HarbourTwin, WasteDeck, CleanScore, RiverEye, NurdleRisk, DiveLedger, EPR Atlas).
- Périmètre : Floride/Golfe/Caraïbes - bateaux abandonnés FWC, casiers perdus, débris ouragans FEMA/NOAA,
  Florida Keys NMS, sargasses, lois plastique FL 2024-2026, TX/LA/AL/MS nurdles, Caraïbes (Bahamas/Jamaïque/RD),
  assurance immobilier côtier, ports/croisières MARPOL.
- Budget WebSearch : 12 max — 12 utilisés (0 restant). WebFetch utilisé librement en complément (≈15 appels).

## Journal
- Succès : WebSearch "FWC derelict vessel 823.11" → trouvé myfwc.com + flsenate.gov, bon point de départ.
- Succès : WebFetch sur m.flsenate.gov/statutes/823.11 a échoué (page nav vide), mais WebFetch sur
  leg.state.fl.us (URL directe avec App_mode=Display_Statute) a bien renvoyé le texte complet de la loi
  (définitions, sanctions graduées, délais de grâce). Leçon : préférer l'URL leg.state.fl.us directe à
  flsenate.gov pour le texte brut des statuts.
- Succès : WebSearch trap retrieval program → myfwc.com/fishing/saltwater/trap-debris/ détaillé et exploitable.
- Succès : WebSearch FEMA Helene/Milton → chiffres précis (590 M$ débris, 31,67 M yd³, contractants nommés).
- Succès : WebSearch CrowderGulf/Tetra Tech → a remonté un litige GAO (B-418693) très utile pour chiffrer le
  marché des contrats-cadres USACE (195-262 M$/région) — piste non anticipée mais précieuse pour la section
  concurrents.
- Erreur : WebFetch sur floridapolitics.com (article CrowderGulf) → HTTP 402 Payment Required (paywall).
  Leçon : sites de presse locale floridienne souvent verrouillés, ne pas compter dessus pour WebFetch.
- Erreur : WebFetch sur flseagrant.org (revue législative 2025) → HTTP 403 Forbidden. Contourné en gardant
  les infos déjà obtenues via WebSearch (résumé du bill h1149c via PDF, partiellement exploitable seulement).
- Erreur : WebFetch sur marinedebris.noaa.gov/abandoned-and-derelict-vessels-info-hub/florida → HTTP 403.
  Pas de chiffre statewide du nombre total d'épaves trouvé dans cette passe (marqué hypothèse non sourcée).
- Erreur : WebFetch sur ballotpedia.org → contenu vide retourné par l'outil (page probablement dynamique/JS).
  Gardé les infos déjà obtenues via WebSearch initial sur 403.7033.
- Succès : WebSearch sargasses 2026 → confirmé année record (28,9 Mt), coût Miami-Dade 35 M$/an.
- Succès : WebSearch Nurdle Patrol → financement 750 k$ Matagorda Bay Mitigation Trust, lien Formosa Plastics
  pour l'angle contentieux/preuve (angle non couvert par PelletGuard, qui est UE/producteurs).
- Succès : WebSearch Caraïbes Interceptors → Jamaïque (9 unités Kingston) et Rép. dominicaine (Rio Ozama)
  confirmés ; pas trouvé de detail chiffré World Bank/IDB/PROBLUE spécifique dans le temps imparti.
- Décision : pas d'idée produit dédiée "Caraïbes bailleurs de fonds" séparée (risque de chevauchement avec
  RiverEye et Plastic Credit Ratings déjà exclus) — angle Caraïbes intégré à SargassumIQ (hôtels) à la place.
- Dossier.md et claude.md livrés dans /home/user/Octopus/ocean-plastic-2/agents/florida-gulf/.
