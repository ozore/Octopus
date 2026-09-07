# Mémoire du cartographe laboratoires surveillance

## Compteur de recherches
WebSearch utilisés : 8 sur 8 autorisés (quota atteint, toutes utilisées avant les WebFetch).
WebFetch utilisés librement ensuite : environ 12 appels, dont 5 échecs (403 ou 404) et 1 redirection suivie avec succès.

## Requêtes WebSearch qui ont marché (dans l'ordre)
1. "LIMS pricing environmental laboratory LabWare Thermo SampleManager annual cost" : bon résultat direct.
2. "ISO 17025 accreditation cost A2LA ANAB laboratory annual fee" : bon résultat, a mené vers le PDF APHL.
3. "electronic monitoring fisheries video review analyst salary job posting" : pas de salaire mais bons intitulés de poste et liens vers Salary.com.
4. "environmental laboratory technician salary job posting LIMS "water testing"" : très bon résultat chiffré (ZipRecruiter).
5. "eDNA environmental sample analysis price per sample commercial laboratory" : bon résultat (Chase Ecology, PNNL).
6. "electronic monitoring cost per day fishing vessel camera system review NOAA contract" : excellent résultat, plusieurs chiffres NOAA en une seule recherche.
7. "fisheries observer cost per day contract price at-sea monitoring" : excellent résultat (taux scallop 2023 et 2026).
8. "hydrographic survey technician salary job posting Hypack multibeam ROV pilot" : bon résultat, logiciels et salaire.

## Sources mortes ou bloquées
- portvancouver.com, jasco.com : bloqués par consigne du brief, non tentés.
- itqlick.com/labware-lims/pricing et itqlick.com/simple-lims/pricing : WebFetch direct renvoie 403, mais le résumé du moteur de recherche (WebSearch) contenait déjà les chiffres utiles, donc utilisés comme source citée malgré l'échec du fetch direct.
- a2la.org/faq : accessible mais ne publie aucun montant, juste une promesse de devis gratuit sur demande.
- www.aphl.org/aboutAPHL/publications/Documents/FS-2018Feb-ISO-IEC-Accreditation-Costs-Survey-Report.pdf : 404 direct, redirection vers aphl.org/docs/... fonctionne mais WebFetch n'a pas su extraire les chiffres du PDF malgré un contenu binaire récupéré (427,9 Ko) ; les chiffres cités dans le dossier viennent du résumé WebSearch initial, pas du fetch du PDF lui même.
- media.fisheries.noaa.gov/dam-migration/em_cost_assessment_for_gar_herring_20150904-v6.pdf : PDF récupéré (252 Ko) mais extraction de contenu infructueuse, chiffres non utilisés.
- www.salary.com/... : redirige automatiquement vers career.com, suivre la redirection fonctionne mais le champ salaire de l'offre IBSS était vide dans les deux cas.
- www.indeed.com/q-environmental-lab-technician-jobs.html : 403 direct, page liste bloquée à l'accès automatisé.
- www.fisheries.noaa.gov/fisheries-observers/2026-atlantic-sea-scallop-observer-compensation-rate-calculation-summary : 404 sur cette URL précise ; l'URL voisine (.../new-england-mid-atlantic/commercial-fishing/atlantic-sea-scallop-fishery-fishing-year-2023-0) a fonctionné et donné le chiffre 2023, le chiffre 2026 (813,75 $) vient du résumé WebSearch de la requête 7, pas d'un fetch direct de la page 2026.

## Bilan en trois lignes
Ce que je referais : commencer par les pages gouvernementales NOAA Fisheries en une seule requête large plutôt
que par des requêtes trop découpées, elles ont rendu plus de chiffres exploitables par appel que les pages de
prix commerciales opaques (LIMS, ISO 17025) qui cachent systématiquement leur tarif derrière un formulaire de
contact. Ce que je ne referais pas : tenter le WebFetch direct sur des PDF volumineux (APHL, NOAA herring) en
espérant une extraction de chiffres précis, l'outil a récupéré le binaire mais n'a pas su lire les tableaux, mieux
vaut se contenter du résumé WebSearch qui cite déjà les chiffres clés. Ce qui m'a surpris : le prix d'un poste de
réviseur vidéo EM, pourtant central pour ce dossier, reste systématiquement caché même sur des offres publiques
gouvernementales américaines, alors que le taux journalier payé au prestataire qui l'emploie (jusqu'à 800 $ US
par jour) est lui publié sans détour par la même agence.
