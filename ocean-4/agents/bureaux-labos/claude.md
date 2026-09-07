# Mémoire de travail — agent bureaux-labos

## Consignes clés (relues dans BRIEF.md)
- Population + 5 candidats (12 lignes max chacun) + références + lacunes, dans dossier.md
- Max 10 WebSearch (WebFetch libre) — compteur ci-dessous
- Écrire uniquement dans agents/bureaux-labos/
- Français, acronymes définis à la 1re mention, étiqueter vérifiée/supposée
- Pas de code, pas de commit
- Ne pas lire les autres dossiers agents/* (siblings) — respecté, seul BRIEF.md a été lu hors de mon dossier

## Compteur WebSearch : 10/10 (quota épuisé, tout le reste en WebFetch)

## Journal de recherche (requêtes qui ont marché)
1. "NMBAQC scheme ring test benthic macroinvertebrate identification quality control marine UK" → excellent,
   a donné le cœur du candidat 1 (BCSI, TDP, ring tests bi-annuels, obligation CMA).
2. "offshore wind BOEM environmental impact statement request for additional information delay 2025" → correct,
   surtout utile pour le cycle réglementaire BOEM (California PEIS, commentaires clos 12/02/2025).
3. "benthic taxonomist job posting salary marine ecology consultant UK 2025 2026" → correct, salaires 38-70k£.
4. "eDNA metabarcoding marine biodiversity monitoring price per sample cost NatureMetrics" → pas de prix direct
   dans le résumé, mais bon point d'entrée (WebFetch naturemetrics.shop a donné le prix : 335£/kit).
5. "marine mammal observer PAM operator day rate offshore wind construction job 2025" → très bon, day rates
   200-700$/jour via crewbase.pro.
6. "AI startup automated species identification marine invertebrate benthic image recognition 2025 2026" → bon,
   a sorti CoralNet/iBivalves/EchoAI/FishAI (62,6% précision) + papier arxiv 2025 benthos antarctique.
7. "generative AI environmental impact assessment consulting automation report writing 2025" → correct, a sorti
   le blog Savills + mention guidance ISEP 2025 (mais page Savills bloquée 403 en fetch direct).
8. "microplastics analysis FTIR laboratory price per sample quote ISO 17025" → correct, prix fragmentés
   (349$/échantillon PolyGone en base, Eurofins/Measurlabs sur devis).
9. "Marine Stewardship Council MSC ASC chain of custody certification audit cost compliance software" → bon,
   a confirmé le cycle 3 ans + audit annuel + liste des certificateurs (BV, DNV, SCS, Intertek).
10. "UK Find a Tender OR Contracts Finder benthic ecological survey monitoring contract award value offshore
    wind" → très bon, a sorti le contrat Crown Estate → Tetra Tech (2,5M£) et le marché gouv. écossais.

## WebFetch utiles (gratuit, illimité)
- naturemetrics.shop (prix eDNA), nmbaqcs.org/scheme-components/invertebrates (détail NMBAQC), job posting MESL
  (environment-analyst.com, dates 2015 — vieux mais illustratif), apemltd.com/service/nmbaqc-scheme (TDP),
  pamguard.org (gratuit/open source confirmé), crewbase.pro blog (détail day rates), rpsgroup.com (Neptune IA
  propriétaire, 90% baux éoliens US), eurofins.com microplastics (LDIR, ISO 17025 NATA 2023→2024),
  naturemetrics.com/news (adoption eDNA par Environment Agency/SEPA/Natural England).

## Sources mortes / bloquées (403 Forbidden en WebFetch direct)
- savills.co.uk/blog (IA en EIE) — contenu récupéré seulement via le résumé de la recherche WebSearch, pas de
  lecture directe. Fiabilité annotée plus faible dans dossier.md.
- govmarket.uk (tender "UK Regulatory Mapping" Mexique offshore wind) — piste veille réglementaire
  multi-juridictions non développée en candidat séparé à cause de ça.
- find-tender.service.gov.uk/Notice/086365-2025 (fiche HTML directe) — info reprise du résumé WebSearch
  uniquement (le PDF n'a pas été tenté, aurait pu contourner le 403 — leçon pour la prochaine fois : essayer le
  lien PDF du même notice si le HTML est bloqué).

## Leçons
- Les résumés que WebSearch produit lui-même sont souvent suffisants pour sourcer une affirmation, mais moins
  fiables qu'un WebFetch direct → toujours signaler "via résultat de recherche" quand le fetch direct a échoué.
- Beaucoup de logiciels IA de détection existent déjà pour l'acoustique (PAMGuard gratuit + Neptune de RPS
  propriétaire) → le candidat ne peut pas être "détection", il doit être la couche mise en conformité/rapport.
- Idem microplastiques : les fabricants d'instruments (Agilent) vendent déjà des logiciels d'imagerie FTIR → le
  candidat doit être la couche rapport ISO 17025 + unification multi-marques, pas la classification brute.
- eDNA est solidement documenté côté adoption réglementaire (UK) mais je n'ai pas trouvé d'angle IA net qui ne soit
  pas déjà couvert par le candidat taxonomie — laissé en lacune/piste plutôt que forcé en candidat 5.
- Job posting MESL est daté (2015, fermé) — utilisé uniquement comme illustration qualitative des tâches, pas
  comme preuve d'un poste ouvert aujourd'hui ; signalé explicitement dans dossier.md et les références.

## Résumé final (10 lignes)
5 candidats livrés dans dossier.md, ancrés sur des spécifications déjà écrites par des régulateurs/schémas QA :
(1) vision IA pour le tri taxonomique benthique calée sur le NMBAQC (BCSI/TDP) — acheteur APEM/MESL ; (2) copilote
de rédaction d'EIE et réponse aux régulateurs — acheteur Tetra Tech/Crown Estate (contrat 2,5M£ vérifié) ; (3) agent
de mise en conformité acoustique (PAM) — acheteur RPS/Tetra Tech, day rates 200-700$/jour vérifiés ; (4) vision +
rapport automatisé microplastiques FTIR/LDIR — acheteur Eurofins, ISO 17025 ; (5) copilote de préparation d'audit
MSC/ASC — acheteurs Bureau Veritas/DNV/SCS/Intertek. Constat transversal : la détection IA brute (acoustique,
espèces) existe déjà chez les leaders (Neptune de RPS, PAMGuard, CoralNet) — la valeur ajoutée 2024-2026 est dans la
couche agentique de mise en conformité/rapport documentaire, pas dans la détection elle-même. Lacunes principales :
eDNA et veille réglementaire multi-juridictions repérés mais non développés en candidats faute de budget de
recherche (10 WebSearch épuisés) ; 3 sources bloquées en 403 (Savills, govmarket.uk, find-tender HTML) signalées
avec fiabilité réduite dans dossier.md.
