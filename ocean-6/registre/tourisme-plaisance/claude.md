# Mémoire de travail, dossier tourisme plaisance

## Compteur de recherches
WebSearch utilisés : 8 sur 8 (quota atteint, plus aucun appel WebSearch possible pour ce dossier).
WebFetch utilisés : environ 24 appels, sans limite imposée.

## Requêtes WebSearch qui ont marché (par ordre d'utilisation)
1. "Blue Flag certification fee marina cost 2025 2026" : pas de prix ferme, mais a mené vers viconservationsociety.org
   et epicislands.org (ensuite en échec en WebFetch).
2. "Green Fins membership fee dive operator cost" : succès net, 140 USD première année / 60 USD renouvellement.
3. "Clean Marina certification program application cost fee" : succès net, quatre chiffres d'État en un seul résumé
   (Caroline du Sud 250 USD, Michigan 400 USD, Géorgie 100 USD, Californie 750/500 USD).
4. "Travelife certification cost hotel price sustainability" : pas de chiffre dans le résumé, mais a donné l'URL
   exacte de la page de prix (travelifestaybetter.com/pricing-benefits), relue ensuite en WebFetch avec succès total.
5. "\"Blue Flag\" marina application fee USD annual" : un seul chiffre daté (1 000 USD, article de presse de 2016),
   trop faible pour le tableau principal.
6. "FareHarbor booking fee percentage pricing tour operator dive charter" : succès net, 6 % standard, 2 % API,
   jusqu'à 28 % sur canal OTA (Online Travel Agency).
7. "Dockwa marina management software pricing cost per month" : pas de chiffre dans le résumé, mais a donné l'URL
   exacte de la page de prix, relue ensuite en WebFetch avec succès total (six modules chiffrés).
8. "dive shop general liability insurance cost per year DAN dive operator" : pas de chiffre dans le résumé, mais a
   donné l'URL exacte de la page DAN, relue ensuite en WebFetch avec succès total (barème complet par tranche de
   chiffre d'affaires).

Leçon : sur ce dossier, une requête WebSearch qui ne donne pas le chiffre directement donne presque toujours l'URL
exacte de la page de prix officielle, largement suffisante pour un WebFetch réussi ensuite. Mieux vaut une requête
générique menant à la bonne page qu'une requête trop précise qui ne renvoie rien.

## Sources mortes (WebFetch en échec)
Erreur 403 (bloqué) : indeed.com/q-marina-manager-jobs.html ; aza.org/becoming-accredited ; aza.org/apply-for-accreditation ;
dco.uscg.mil (NVIC PDF et page NVDC) ; uscg.mil/Portals/0/documents/travel/user_fees.pdf ; greenfins.net/hub-guide ;
greenfins.net/certified-membership.
Erreur 404 (introuvable) : getmyboat.com/help/how-much-does-it-cost-to-list-my-boat ; boatus.org/mooring-buoys ;
floridakeys.noaa.gov/mooring/welcome.html ; iaato.org/membership et iaato.org/about-iaato/members ;
boatsetter.com/list-your-boat ; reefcheck.org/tropical-program/get-involved/become-a-member ;
padi.com/aware/padi-aware-dive-against-debris.
Erreur 500 (serveur) : viconservationsociety.org/programs/blue-flag-usvi.
Chargé mais inutile : fareharbor.com/pricing (page JavaScript qui ne charge pas son contenu réel côté WebFetch) ;
boatsetter.com/how-it-works (page chargée mais sans aucun chiffre de commission).
Site gouvernemental bloqué de façon répétée : tous les domaines uscg.mil et dco.uscg.mil, à noter pour un futur
dossier qui aurait besoin de prix réglementaires américains (immatriculation, inspection de navire).

## Sources qui ont marché en WebFetch direct (à retenir pour un futur dossier voisin)
travelifestaybetter.com/pricing-benefits ; sccm.scseagrant.org/certification ; marinas.dockwa.com/marina-software-pricing ;
dan.org/membership-insurance/liability/general-liability-insurance ; checkfront.com/pricing ;
staybetterplaces.com/certification (chargée mais sans liste de propriétés nommées).

## Bilan en trois lignes
Ce que je referais : commencer chaque catégorie de dépense par une requête WebSearch générique pour trouver l'URL de
la page de prix officielle, puis toujours confirmer par un WebFetch direct de cette page plutôt que de me contenter
du résumé automatique de la recherche, qui omet parfois les chiffres même quand ils sont sur la page.
Ce que je ne referais pas : essayer de deviner des URL de pages profondes de sites gouvernementaux (uscg.mil, noaa.gov)
ou de grands sites commerciaux à protection anti robot (indeed.com, getmyboat.com) ; ces domaines ont échoué
systématiquement et auraient dû être abandonnés après un seul essai plutôt que deux ou trois.
Ce qui m'a surpris : les pages de prix des logiciels SaaS (Software as a Service) destinés à ce secteur (Dockwa,
Checkfront) affichent leurs prix publiquement et en clair, alors que les grandes plateformes de réservation généraliste
plus proches du grand public (FareHarbor) cachent leur taux de commission réel derrière un appel commercial, ce qui
a obligé à recouper plusieurs sites tiers indépendants pour obtenir un chiffre fiable.
