# Mémoire de travail, agent peche-surveillee

## Compteur de recherches
10 appels WebSearch utilisés sur 10 autorisés (quota épuisé). 0 appel WebFetch utilisé : les
résumés retournés directement par WebSearch ont suffi à chaque fois, pas eu besoin d'aller
chercher une page bloquée.

## Requêtes qui ont marché (dans l'ordre)
1. "EU regulation 2023/2842 fisheries control remote electronic monitoring vessels dates entry
   into force" : a donné la date d'entrée en vigueur (9 janvier 2024) et l'échéance REM 2028 dès le
   premier essai.
2. "NOAA electronic monitoring fisheries program 2024 2025 cost per vessel review video" : a donné
   les taux 100 dollars par trait de chalut et les pourcentages de révision vidéo nord est.
3. "DFO Fisheries and Oceans Canada electronic monitoring mandatory vessels 2024 2025" : a donné la
   date exacte du 1er janvier 2025 pour l'obligation ELOG au Québec et dans le Golfe, et
   l'extension 2026.
4. "US SIMP Seafood Import Monitoring Program expansion 2024 2025 species traceability" : a donné le
   plan d'action de novembre 2024 et le chiffre de 6,2 millions de dollars de budget annuel.
5. "ropeless fishing gear on-demand whale entanglement regulation NOAA right whale 2024 2025
   requirement" : a donné la date butoir du 31 décembre 2028 pour la règle finale, mandatée par le
   Congrès.
6. "electronic monitoring fisheries service provider company Archipelago Marine Research
   Shellcatch Anchor Lab funding" : a donné les trois fournisseurs existants en une seule requête
   double (le moteur a relancé une deuxième recherche interne pour Shellcatch et Anchor Lab).
7. "seafood traceability platform Wholechain FishWise Trace Register Global Fishing Watch funding
   2024" : a donné Wholechain, Trace Register, FishWise, GDST, mais rien sur Global Fishing Watch
   spécifiquement en lien financement, ni sur des montants de levée de fonds.
8. "fisheries observer cost per day salary video review analyst human observer decline shortage" :
   a donné le salaire observateur (56 394 dollars par an) mais rien sur le coût par jour ni sur les
   analystes de révision vidéo spécifiquement, ni sur la pénurie.
9. "AI computer vision electronic monitoring fisheries startup funding automate video review
   bycatch species identification 2024 2025" : a donné Edge AI de TNC (l'outil gratuit d'ONG
   attendu par le brief) avec le financement Bezos Earth Fund, et le chiffre clé de douze
   programmes REM et onze RFMO sur quinze qui en discutent.
10. "electronic monitoring fisheries market size forecast 2030 billion global" : n'a rien donné de
    directement utilisable sur l'EM, seulement des marchés adjacents (IoT pêche et aquaculture,
    électronique marine, surveillance aquaculture) : à garder seulement comme contexte marqué
    estimation, pas comme preuve de la thèse.

## Sources mortes ou peu utiles
- Aucune page bloquée rencontrée (portvancouver.com et jasco.com jamais visées par mes requêtes,
  donc pas testées).
- La requête 10 (taille de marché) a été la moins productive : les résultats concernaient des
  marchés adjacents, pas la surveillance électronique des pêches elle même. Si à refaire,
  préciser "electronic monitoring" entre guillemets et ajouter "REM" pour éviter la dilution vers
  IoT et aquaculture.
- La requête 8 n'a rien donné sur le coût par jour d'un observateur ni sur les analystes de
  révision vidéo (rôle distinct de l'observateur embarqué) : ce chiffre reste une lacune du
  dossier.
- Pas trouvé de montant de levée de fonds (venture capital) pour aucune des startups nommées
  (Shellcatch, Anchor Lab, Wholechain) malgré deux requêtes qui auraient pu le donner : ni
  Crunchbase ni PitchBook n'ont livré de chiffre exploitable depuis le résumé WebSearch (auraient
  nécessité un WebFetch payant en quota sur une page probablement partiellement bloquée).

## Leçons
- Les bulletins fisheries.noaa.gov sont très fiables pour des dates et des taux précis (dollars par
  trait de chalut, pourcentages de révision) : privilégier ce domaine pour toute question
  américaine chiffrée.
- Le Congressional Research Service (CRS, via everycrsreport.com ou congress.gov) est la
  meilleure source pour une vue d'ensemble budgétaire et chiffrée d'un programme fédéral américain
  comme SIMP.
- Pour le Canada, dfo-mpo.gc.ca et ses sous domaines régionaux (qc.dfo-mpo.gc.ca) donnent des
  dates d'obligation très précises par flotte, mieux que des articles de presse généralistes.
- Nommer un client précis (barreau 1) sans recherche dédiée à ce client précis est un choix
  assumé faute de quota : chaque nom cité dans le dossier est explicitement marqué connaissance
  générale non vérifiée, jamais présenté comme confirmé.

## Trois lignes finales
Ce que je referais : commencer par les textes réglementaires datés (EU, NOAA, DFO, SIMP) avant les
fournisseurs, cela a donné une base de faits solide en quatre requêtes seulement.
Ce que je ne referais pas : la dixième requête sur la taille de marché globale, trop large, à
remplacer par une recherche ciblée sur le coût réel d'un analyste de révision vidéo REM ou sur un
montant de levée de fonds d'une startup nommée.
Ce qui m'a surpris : l'existence d'un outil gratuit d'ONG (Edge AI de TNC) déjà financé à hauteur
de 2 millions de dollars par le Bezos Earth Fund début 2026, exactement le type de concurrent
gratuit que le brief demandait de chercher, et le fait que la règle américaine sur les engins sans
corde pour protéger les baleines n'est toujours pas obligatoire en 2026, seulement promise pour fin
2028, ce qui rend cette partie de la tendance plus lente que la surveillance vidéo ou les journaux
électroniques.
