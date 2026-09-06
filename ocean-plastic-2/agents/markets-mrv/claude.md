# Mémoire agent markets-mrv

## Plan
- 12 WebSearch max (quota partagé session, utilisés en totalité). WebFetch libre, utilisé abondamment ensuite.
- 3 volets : (1) chaîne valorisation plastique marin collecté, (2) reporting bailleurs MRV, (3) acheteurs de données terrain.
- Idées à éviter (12 de la 1ère passe) : DriftBox, GearTrace, PelletGuard, TrueBlue Claims, Plastic Credit Ratings, HarbourTwin, WasteDeck, CleanScore, RiverEye, NurdleRisk, DiveLedger, EPR Atlas.

## Journal

### Succès (recherches/sources qui ont marché)
- WebSearch "NOAA Marine Debris Program 2025 2026 grant awards" → chiffres solides : 13 projets FY25, 26,4 M$ ; NOFO combinées jusqu'à 54 M$ (Bipartisan Infrastructure Law). Bonne source.
- WebSearch "DFO Ghost Gear Fund Canada 2026 2029" → excellent résultat direct sur dfo-mpo.gc.ca : 15 M$ CAD/3 ans, jusqu'à 5 M$ en 2026-27, échéance candidature 29/06/2026.
- WebFetch newswire.ca sur l'annonce 2020-2022 du Ghost Gear Fund → liste complète des 26 bénéficiaires (8,3 M$ CAD), utile comme historique de bénéficiaires typiques (Ocean Legacy, Ecotrust Canada, T. Buck Suzuki, Coastal Action, etc.).
- WebFetch fulcrumapp.com/pricing → grille de prix complète et fiable ($43-55/utilisateur/mois, minimum 5 utilisateurs).
- WebSearch procès "public nuisance" Californie/LA County → dates et statuts précis des 3 procès (Exxon, Coca-Cola, PepsiCo) bien documentés via oag.ca.gov et climatecasechart.com.
- WebSearch PROBLUE World Bank → chiffres FY2024 (37,8 M$ / 64 propositions, portefeuille 182 M$) et prolongation du programme jusqu'en 2030.

### Erreurs / impasses (pistes mortes, outils en échec)
- Aucune page commerciale (Ocean Legacy, Net Your Problem, Oceanworks, Plastix, RecyClass, OBP) ne publie de prix par tonne/polymère en ligne : 403 Forbidden sur nationalfisherman.com, openpr.com, marinedebris.noaa.gov (funding pages), plasticslitigationtracker.org (anti-bot) ; réponses génériques « contactez-nous » sur Ocean Legacy, Net Your Problem, Oceanworks, RecyClass, OBP. **Leçon : le marché du plastique marin recyclé n'a AUCUNE découverte de prix publique — c'est en soi la douleur n°1, pas juste une lacune de recherche.**
- brandaudit.breakfreefromplastic.org protégé par vérification anti-bot (Cloudflare) → contenu inaccessible via WebFetch. Contourné avec WebSearch générale (chiffres 346 494 pièces / 55 pays trouvés par un autre biais).
- minderoo.org/ocean/ → 404, page introuvable. Pas de données Minderoo 2025-2026 obtenues : marqué « hypothèse non sourcée / accès bloqué ».
- Citeo, Éco Entreprises Québec, Circular Action Alliance : aucune recherche ciblée n'a remonté de données précises sur l'achat de données de gisement pour l'éco-modulation (budget épuisé avant d'creuser plus, note pour agent suivant).
- Recycle BC : page d'accueil ne détaille pas la « Producer-Initiated Adjustment Policy » (lien identifié mais non exploré, sous-page non fetchée faute de budget).

## Livrables
- `dossier.md` produit avec les 6 sections demandées (chaîne de valeur, bailleurs, acheteurs de données, douleurs, opportunités produit x5, références).
