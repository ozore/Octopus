# Mémoire de travail — industry-benthic-surveys

## Plan initial (budget 12 WebSearch max, WebFetch libre) — RESPECTÉ (12/12 utilisés)
1-5. Batch 1 : BOEM éolien, UK MMO/Crown Estate éolien, pipeline éolien 2026-2030 (US/UK/FR/DE), câbles sous-marins,
   USACE dragage/Natura 2000.
6-10. Batch 2 : mouillage/ancres Méditerranée-Floride, aquaculture benthique BC/Norvège/Écosse, VMS/AIS chalutage
   (Global Fishing Watch/OceanMind/Skylight), coûts relevés benthiques (Fugro/APEM/Hatfield), logiciels annotation
   (BIIGLE/VIAME/SeaGIS/EventMeasure).
11-12. Batch 3 : mouillage écologique/apps, nombre de fermes aquacoles BC/Écosse/Norvège/Chili.
Puis ~13 WebFetch libres pour approfondir (pages officielles + pages produits).

## Journal

- SUCCÈS : WebSearch BOEM benthic guidelines → a confirmé existence des « Benthic Habitat Information Guidelines »
  (Atlantic OCS, révisées juin 2019) et des Appendix Y/H de suivi benthique (Revolution Wind, Sunrise Wind).
- SUCCÈS : WebFetch gov.uk MMO standardisation → dates précises obtenues (publié 16/07/2025, màj 09/03/2026),
  bien plus fiable qu'un simple résumé WebSearch. Leçon : pour les pages gov.uk/officielles, WebFetch direct donne
  souvent de meilleures dates que le résumé WebSearch.
- ERREUR : WebFetch sur deux URLs BOEM (guidelines PDF, state-activities) → le tool a récupéré des PDF binaires
  non décodés (mauvais rendu). Leçon : pour boem.gov, préférer les pages HTML (ex. lease-and-grant-information a
  fonctionné correctement) plutôt que les liens qui redirigent vers un PDF volumineux.
- SUCCÈS : WebFetch boem.gov/renewable-energy/lease-and-grant-information → fait majeur trouvé : suspension des
  nouveaux baux éoliens offshore US + résiliation de toutes les Wind Energy Areas en juillet 2025 (mémorandum
  présidentiel). Change complètement le narratif "pourquoi maintenant" pour les opportunités liées au marché US.
- SUCCÈS : WebFetch guidetoanoffshorewindfarm.com → chiffre de coût rare et utile : ~1,2 M£ de relevés
  environnementaux benthiques pour un parc de 1 GW (marqué « estimation », source sectorielle non officielle).
- SUCCÈS : WebFetch dfo-mpo.gc.ca infographic → détail réglementaire précis et chiffré sur les Aquaculture
  Activities Regulations BC (seuils sulfures, seuils Beggiatoa, ~40-50 fermes/an, 80-90% sous seuils).
- ERREUR : WebFetch SeaGIS prices.pdf (2 tentatives, URLs devinées) → 404 les deux fois. Leçon : ne pas deviner
  les chemins de PDF de prix ; il aurait fallu WebSearch dédié ou accepter la lacune plus tôt (budget WebSearch
  épuisé au moment du test). Conforme à la procédure de blocage du brief : noté comme lacune plutôt qu'inventé.
- ERREUR : WebFetch biigle.de/pricing → 404 (page n'existe probablement pas, BIIGLE fonctionne par instance
  institutionnelle plutôt que par plan tarifaire public).
- ERREUR : WebFetch marine-conservation.org article chalutage UE → contenu vide au fetch malgré un résultat
  WebSearch prometteur. Leçon : un bon titre dans les résultats WebSearch ne garantit pas un WebFetch exploitable
  (pages avec beaucoup de JS/contenu dynamique).
- ERREUR : WebFetch parks.canada.ca/pn-np/bc/gulf/nature/eelgrass → 404 (URL devinée incorrecte). Pas de deuxième
  tentative faute de budget/temps ; noté comme lacune (pas de données Parks Canada Gulf Islands sur les dommages
  d'ancre dans le dossier final).
- SUCCÈS : WebFetch oceaninfinity.com/services → confirmation des capacités (AUV HUGIN, USV NeedleFish) et des
  secteurs clients (énergie, télécoms/câbles, secteur public).
- Lacunes assumées et documentées dans le dossier (section f) : tourisme croisière (aucune recherche menée, budget
  concentré sur les 5 autres industries), cadre réglementaire FR/DE éolien (pas de source primaire), Natura 2000
  dragage (pas de source EU primaire atteinte), coût relevé câble sous-marin (chiffre introuvable, aucune
  estimation proposée faute de comparable), tarifs logiciels commerciaux (SeaGIS, Coda Octopus).

## Résumé final — meilleures opportunités (15 lignes max)

1. **SedimentIQ** (le plus fort, priorité 1) : IA de vision pour automatiser la notation Beggiatoa/sulfures et la
   génération de rapports DFO pour les ~40-50 fermes salmonicoles BC/an ; fenêtre de demande élargie 2026-2029 par
   la transition réglementaire BC (interdiction cages ouvertes après 2029). Premier client : DFO Pacifique /
   fermes de la Sunshine Coast, 100% accessible depuis Vancouver.
2. **ReefLine** : détection IA des cicatrices d'ancre sur herbiers/coraux + app de mouillage, ciblant Gulf Islands
   National Park Reserve (voisin immédiat de Vancouver) puis Florida Keys/Méditerranée. Aucun concurrent
   commercial identifié dans le budget de recherche — espace potentiellement libre.
3. **BenthicPipe** : SaaS d'annotation vidéo DDV/ROV avec export réglementaire standardisé, poussé par la norme
   MMO de juillet 2025 (màj mars 2026) et les 11,7 GW de parcs UK en construction ; vendable à distance aux
   bureaux d'études (Fugro, APEM, Ocean Infinity...).
4. **DredgeGuard** : conformité turbidité temps réel pour dragage portuaire, avec le Port de Vancouver comme
   client pilote local direct — mais sans échéance réglementaire datée trouvée, point le plus faible du lot.
5. **TrawlWatch Local** : couche d'alertes locale sur données AIS publiques (Global Fishing Watch) pour petites
   MPA sans budget entreprise (OceanMind/Skylight) — effort technique le plus faible, mais absence d'échéance
   légale datée également.
Fait transversal le plus important pour cadrer toute décision produit : le marché US de l'éolien offshore est en
net ralentissement réglementaire depuis juillet 2025 (BOEM) — privilégier UK/Europe et le Canada/aquaculture BC
comme terrains prioritaires, cohérent avec l'ordre de marché du fondateur (Californie/Floride/Europe puis PNW).
