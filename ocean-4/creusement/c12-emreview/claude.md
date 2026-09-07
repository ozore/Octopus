# Mémoire agent c12-emreview

Compteur WebSearch : 6/6 utilisés (quota atteint pour cette passe).

## Requêtes qui ont marché
1. Archipelago Marine Research artificial intelligence video review electronic monitoring (découvre FishVue AI,
   300 à 500+ navires en production, prix VIATEC 2026 Innovation Excellence : tue quasi seule le mandat).
2. Saltwater Inc electronic monitoring AI video review fisheries (confirme O2Review avec détection IA de
   personnes sur le pont déjà intégrée, conçu pour accueillir des outils IA).
3. NOAA VIAME Kitware electronic monitoring automated video review 2025 progress (confirme VIAME gratuit, DIY,
   pas un produit clé en main, utilisé sur CamTrawl et HabCam).
4. "cost per hour" video review electronic monitoring fisheries observer (n'a pas donné de $/heure précis, mais
   confirme le ratio EM = environ un tiers du coût observateur, jusqu'à 800 $US/jour).
5. FishVue AI Archipelago review time reduction accuracy percent (chiffres clés : 48 % de gain de temps, 46 %
   d'économie de coût, erreur 2,7 % contre 1,3 % en revue humaine standard sur le projet Alaska Fixed Gear).
6. "Integrated Monitoring" electronic monitoring fisheries company AI video review (n'a pas trouvé Integrated
   Monitoring lui-même, mais a révélé Ai.Fish/Catchvision, en pleine disponibilité commerciale, vendu aux
   navires ET aux organismes de gestion des pêches).

## WebFetch
- archipelago.ca/products/fishvueai : confirme développement interne, aucun partenariat externe mentionné sur
  la page produit elle-même.
- techpartnerships.noaa.gov (SBIR Ai.Fish) : confirme Catchvision en pleine disponibilité commerciale, compte
  les poissons, identifie l'espèce, génère des rapports téléchargeables.
- oceansupercluster.ca (projet FishVue AI) : révèle le financement (581 500 $ CAD, dont 148 500 $ CAD Ocean
  Supercluster) et les partenaires (Barnacle Systems Inc, Université de Victoria, deux associations de pêcheurs).
- media.fisheries.noaa.gov (PDF coût EM 2015) : échec, PDF illisible par l'outil (contenu binaire/compressé),
  aucun chiffre extrait.
- barnaclesystems.com : échec DNS (ENOTFOUND), rôle de ce partenaire non éclairci.

## Sources mortes ou partielles
- PDF NOAA 2015 (em_cos_assessment_for_gar_multispecies) : illisible par l'outil WebFetch dans cet environnement,
  même limite que documentée dans d'autres dossiers de cette passe (voir c1-psolayer/claude.md).
- barnaclesystems.com : domaine injoignable, rôle du partenaire (IA en sous-traitance ou matériel) resté
  incertain.
- Integrated Monitoring (acheteur nommé par le mandat) : aucune trace trouvée dans les 6 WebSearch disponibles.

## Leçons
- Le mandat nommait Archipelago, Saltwater et Integrated Monitoring comme acheteurs cibles ; la recherche a
  montré que les deux premiers sont en réalité des concurrents avec un produit IA déjà en production et financé
  publiquement (Ocean Supercluster), ce qui inverse le sens du candidat : les cibles nommées ne sont pas des
  acheteurs plausibles pour ce produit précis.
- Un troisième concurrent non nommé dans le mandat (Ai.Fish/Catchvision, financé par SBIR NOAA) a été trouvé en
  cherchant simplement "Integrated Monitoring" : preuve que le marché est plus occupé que ce que les deux
  dossiers d'origine (aquaculture-pêche, agences-données) laissaient supposer avec leur note « aucun produit
  commercial mûr identifié » (candidat 1 du dossier aquaculture-pêche) ou « aucun concurrent identifié sur la
  couche d'harmonisation documentaire » (candidat 2 du dossier agences-données) : ces lacunes étaient dues au
  quota WebSearch déjà épuisé dans ces passes précédentes, pas à une absence réelle de concurrent.
- Conforme à la consigne : n'a lu que la section (b) des deux dossiers d'origine (candidat 1 aquaculture-pêche,
  candidat 2 agences-données), bien que les fichiers complets (sections a, b, c) aient été ouverts en un seul
  appel Read.
