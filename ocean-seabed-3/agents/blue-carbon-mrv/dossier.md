# Dossier — Marchés de la preuve pour les habitats benthiques
### Carbone bleu, crédits biodiversité, TNFD/CSRD, assurance paramétrique, compensation obligatoire

Agent : blue-carbon-mrv — Étude « Fonds marins », passe 3 — 7 septembre 2026

Avertissement méthodologique : 12 requêtes WebSearch consommées (budget partagé de la session) ; plusieurs
WebFetch vers planvivo.org, tnfd.global/sector-guidance, efrag.org, goldstandard.org et le PDF complet de la
« UK Marine Strategy Part One Update » ont échoué (403/404 ou fichier trop volumineux) — voir `claude.md` pour le
détail et les contournements. Les lacunes correspondantes sont signalées explicitement en section (f).

---

## (a) Tableau des standards et obligations

| Cadre / norme | Statut (adopté / proposition) | Périmètre benthique | Date clé | Qui est concerné | Source |
|---|---|---|---|---|---|
| Verra VM0033 « Tidal Wetland and Seagrass Restoration » v2.1 | **Adopté**, méthodologie carbone volontaire active | Herbiers marins (seagrass), zones humides tidales/mangroves | v2.1 active depuis le 04/09/2023 ; pas de v2.2/v3.0 identifiée en 2025-2026 | Développeurs de projets de restauration côtière voulant émettre des VCU Verra | verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/ (consulté 07/09/2026) |
| Verra Nature Framework (SD VISta) | **Adopté** (lancement en version test), pilotes en cours | Généraliste biodiversité ; 2 pilotes marins sur 20 (SeaGrow herbiers Great Barrier Reef ; Misool Indonésie) | Lancement test 29/10/2024 ; éligibilité à générer des « Nature Credits » à partir du 01/04/2025 | Porteurs de projets de conservation/restauration cherchant à vendre des unités biodiversité non fongibles (« quality hectares », Qha) | verra.org/verra-launches-nature-framework/ (consulté 07/09/2026) |
| Plan Vivo — protocole biodiversité / « PV Nature » | **Adopté** (protocole publié), empilable uniquement avec PV Climate de Plan Vivo | Multi-métrique (richesse spécifique, connectivité habitat) ; pas de projet marin confirmé dans les sources consultées | Protocole issu des travaux 2023-2024 du Biodiversity Credit Alliance ; lancement du protocole précisé par Carbon Pulse (accès direct au site planvivo.org bloqué, 403) | Communautés locales porteuses de projets de conservation, essentiellement terrestres à ce jour | carbon-pulse.com/189610/ et /243681/ (résumés WebSearch, 07/09/2026) — accès direct site refusé |
| Gold Standard | Pas de méthodologie carbone bleu dédiée identifiée | — | — | — | Recherche non concluante ; accès direct goldstandard.org bloqué (404 sur URL testée) — **lacune** |
| Kelp / macroalgues — méthodologie carbone | **Aucune méthodologie acceptée** par un standard majeur | Forêts de kelp, macroalgues cultivées ou coulées | Étude Frontiers 2026 : « no accepted carbon crediting framework exists » ; étude Nature Comms Earth & Env. 2026 montre >90 % de la biomasse de kelp coulé dégradée en ~100 jours | Aucun acheteur de crédit kelp fiable à ce jour ; producteurs d'algoculture cherchant un revenu carbone bloqués | frontiersin.org/.../fclim.2026.1761760 ; nature.com/articles/s43247-026-03342-0 (consultés 07/09/2026) |
| UE — Roadmap towards Nature Credits | **Proposition / feuille de route** (pas un règlement), publiée par la Commission | Généraliste ; agriculteurs, forestiers, pêcheurs cités comme bénéficiaires, aucune mention marine explicite trouvée | Publiée le 07/07/2025 ; calendrier 2025-2027 (pilotes, normalisation, cadre réglementaire) ; groupe d'experts, candidatures closes le 10/09/2025 | Futurs porteurs de projets nature-positifs UE, acheteurs privés de « nature credits » | cinea.ec.europa.eu (07/07/2025, consulté 07/09/2026) ; tnfd.global/knowledge-bank (résumé) |
| UK — Marine Net Gain (MNG) | **Proposition / non obligatoire à ce jour** | Développements marins (éolien offshore, ports, dragage) | Pas de régime obligatoire en 2025 ; 3e phase du Strategic Marine Net Gain (SMNG) Task & Finish Group en cours depuis début 2025 ; rapport final « Local Application of SMNG Targets in the East Marine Plan Area » publié 2026 | Développeurs marins soumis à permis (futurs assujettis) ; Crown Estate, Seabed User and Developer Group | wildlifetrusts.org/.../Marine_Net_Gain_Report_0.pdf ; pinsentmasons.com (résumés, 07/09/2026) |
| UK — Marine Strategy Part One (mise à jour) | **Adopté** (remplace la version 2019) | État des mers britanniques, objectifs de bon état écologique sur 6 ans | Publication 2025/2026 (page gov.uk consultée ; PDF 82 p. non intégralement lu — budget) | Défra, agences marines, secteurs réglementés indirectement | gov.uk/government/publications/marine-strategy-part-one-update (consulté 07/09/2026) — **détails incomplets, PDF non lu** |
| Australie — Nature Repair Market (Nature Repair Act 2023 / Rules 2024) | **Adopté**, marché opérationnel | Aucune méthode marine/côtière à ce jour ; 1 seule méthode approuvée = reboisement natif terrestre | Nature Repair Rules 2024 en vigueur le 23/12/2024 ; marché ouvert le 01/03/2025 ; méthode « Replanting » active depuis le 27/02/2025 ; réforme EPBC de 11/2025 permet d'utiliser les certificats NRM pour compenser des obligations EPBC | Propriétaires fonciers, « eligible persons » enregistrant des projets auprès du Clean Energy Regulator ; pour l'instant 2 projets enregistrés (mai 2026), 0 certificat émis | dcceew.gov.au (méthodes) ; cer.gov.au/schemes/nature-repair-market-scheme (consulté 07/09/2026) ; mallesons.com, whitecase.com (07/09/2026) |
| CSRD / ESRS E4 (biodiversité et écosystèmes) | **Adopté** à l'origine (ESRS Set 1, 2023), **en cours de simplification (« Omnibus »)** — statut 2025-2026 : réduction de champ ~80 % selon sources juridiques secondaires, seuils relevés | Impacts, dépendances, risques sur écosystèmes matériels — inclut potentiellement les écosystèmes marins si jugés matériels (ports, énergéticiens offshore, armateurs, croisiéristes) | Draft de simplification ESRS daté décembre 2025 ; état des lieux Omnibus daté septembre 2025 ; « finalisation » évoquée par Grant Thornton (rapport 05/2026) — **date exacte d'adoption définitive au Journal officiel non vérifiée directement dans cette recherche** | Grandes entreprises UE (seuil relevé, ~>1000 salariés + seuils financiers) ; champ réduit d'environ 80 % par rapport au périmètre CSRD initial selon financialregulations.eu | integritynext.com, cms.law, coolset.com, financialregulations.eu, grantthornton.com (résumés WebSearch, 07/09/2026) — accès direct efrag.org refusé (404) |
| Assurance paramétrique récifale — Mesoamerican Reef Programme (MAR Fund, Quintana Roo) | **Opérationnel**, programme privé/parapublic (pas une obligation réglementaire) | Récifs coralliens et plages, Mexique/Amérique centrale | Pilote lancé 2019 (Quintana Roo) ; payout Hurricane Delta 2020 (~850 000 $) ; 6e placement du programme régional (AXA Climate) ; période de police 2026-2027 couvrant désormais 12 aires protégées (2 nouvelles au Mexique) | Fideicomiso/CONANP côté Mexique, MAR Fund régional, AXA Climate comme structureur | marfund.org, greenfinanceinstitute.com, climate.axa (résumés, 07/09/2026) |
| Assurance paramétrique récifale — Hawaï | **Opérationnel** | Récifs des 8 îles principales d'Hawaï | Politique lancée 2022, renouvelée 2025 (couverture doublée, payout minimum porté à 200 000 $) | The Nature Conservancy (souscripteur), État d'Hawaï | nature.org (07/09/2026) |
| Compensation d'habitat obligatoire — mitigation banking humide/marin (États-Unis) | **Adopté** (cadre fédéral Clean Water Act §404 + réglementations d'État) | Zones humides côtières, herbiers en Floride ; habitats aquatiques en Californie/Washington/Oregon | Cadre en vigueur depuis des décennies ; prix actualisés 2025 | Promoteurs impactant des zones humides/habitats aquatiques, obligés d'acheter des crédits de compensation | floridadep.gov ; mitigationbankinginc.com (07/09/2026) — accès direct sites d'État complémentaires non tenté (hors domaines listés pour cet agent) |

---

## (b) Fiches détaillées

### 1. Carbone bleu — méthodologies et controverses

**VM0033 (Verra).** Seule méthodologie majeure et active dédiée aux herbiers marins et zones humides tidales
(mangroves, marais salés). Version 2.1 active depuis le 4 septembre 2023 ; permet l'ajustement de la zone de
projet pour suivre la migration des habitats liée à la montée du niveau marin, et impose l'usage du dernier
« VCS AFOLU Non-Permanence Risk Tool » de Verra. Aucune mise à jour majeure (v2.2/v3.0) identifiée en 2025-2026
— capacité vérifiée (source verra.org, consulté le 07/09/2026). Le document méthodologique ne liste pas
lui-même les projets enregistrés ; il renvoie au Verra Project Hub pour le registre — **lacune : nombre exact de
projets VM0033 actifs non confirmé dans cette recherche**, estimation générale du marché : près de 7 millions de
crédits carbone bleu (toutes méthodologies confondues, y compris mangroves) émis entre 2014 et 2025, prix moyen
pondéré 27 $/crédit (source : synthèse WebSearch citant senken.io/carboncredits.com, 07/09/2026).

**Kelp et macroalgues — pas de méthodologie acceptée.** Un article Frontiers in Climate (2026, équipe de
développement de méthodologie) confirme littéralement qu'« aucun cadre de crédit carbone accepté n'existe » pour
les macroalgues malgré une abondante littérature de modélisation. Une étude in situ publiée dans *Communications
Earth & Environment* (2026) montre que le kelp coulé en profondeur (zone de minimum d'oxygène du Pacifique
Nord-Est — donc directement pertinente pour le terrain du fondateur) perd plus de 90 % de sa biomasse en
environ 100 jours via l'activité microbienne et faunique, ce qui remet en question le potentiel de séquestration
par « ocean sinking ». Le scandale Running Tide (Maine) est documenté : la société a levé 54 M$ pour cultiver du
kelp destiné à être coulé, a vu son concept technique échouer, puis a coulé environ 21 000 tonnes de copeaux de
bois au large de l'Islande pour honorer des crédits déjà vendus à Microsoft et Shopify — un cas de figure cité
comme repoussoir par la communauté scientifique, qui appelle par ailleurs à un moratoire sur le « seaweed
sinking » (source : Hakai Magazine, Undark, Frontiers, Nature Comms Earth & Env., résumés WebSearch du
07/09/2026). **Fait daté et vérifié** : au 7 septembre 2026, aucun standard majeur (Verra, Gold Standard,
Plan Vivo) ne propose de méthodologie kelp opérationnelle.

**Gold Standard et Plan Vivo — blue carbon.** L'accès direct à goldstandard.org a échoué (404 sur l'URL testée) ;
aucune méthodologie blue carbon dédiée n'a pu être confirmée pour Gold Standard dans cette recherche — à vérifier
séparément. Plan Vivo dispose d'un protocole biodiversité (« PV Nature »), empilable uniquement avec les crédits
climat Plan Vivo (« PV Climate ») de son propre projet, mais aucun projet marin n'a été identifié dans les
sources disponibles (accès direct à planvivo.org bloqué, 403 ; information reconstituée via Carbon Pulse).

### 2. Crédits biodiversité et « nature credits »

**Feuille de route UE (proposition, pas un règlement).** Publiée le 7 juillet 2025 par la Commission
européenne (« Roadmap towards Nature Credits »), elle vise à créer des unités « quantifiables et fongibles »
représentant des résultats de biodiversité vérifiés, pouvant être enregistrées, mises en réserve et échangées.
Calendrier annoncé : 2025-2027 pour les pilotes, la normalisation méthodologique et le développement d'un cadre
réglementaire ; un groupe d'experts dédié a été constitué (candidatures closes le 10 septembre 2025). Aucune
mention explicite d'écosystèmes marins ou côtiers n'a été trouvée dans le texte consulté — les bénéficiaires
cités sont agriculteurs, forestiers, pêcheurs, propriétaires fonciers. **Texte = proposition/feuille de route,
pas encore un instrument juridique contraignant** (source : cinea.ec.europa.eu, 07/07/2025).

**Verra Nature Framework.** Lancé en version test le 29 octobre 2024 sous le programme SD VISta, il génère des
« Nature Credits » représentant 1 % des résultats nets de biodiversité mesurés en « quality hectares » (Qha) —
explicitement non conçus pour une compensation « like-for-like » en raison de la non-fongibilité de la
biodiversité. Depuis le 1er avril 2025, les projets pilotes conformes peuvent soumettre leurs documents et
commencer à générer des Nature Credits. Sur les 20 projets pilotes annoncés, deux sont directement benthiques/
marins : **SeaGrow** (restauration d'herbiers marins sur la Grande Barrière de corail, Australie) et **Misool**
(conservation marine et côtière en Indonésie). Gouvernance : consentement libre, préalable et éclairé (FPIC) et
partage des bénéfices avec les peuples autochtones (source : verra.org/verra-launches-nature-framework/,
consulté le 07/09/2026).

**Plan Vivo Nature / Wallacea.** Operation Wallacea (Wallacea Trust) est identifiée comme pionnière du crédit
biodiversité et à l'origine, via le Biodiversity Credit Alliance, du protocole biodiversité de Plan Vivo. RePlanet
(UK) émettrait des crédits biodiversité selon la méthodologie Wallacea Trust. Aucun lien direct avec des
écosystèmes benthiques marins n'a été confirmé dans les sources disponibles (source : résumé WebSearch citant
opwall.com et climateseed.com, 07/09/2026 — accès direct wallacea/planvivo non obtenu).

**UK Marine Net Gain (MNG).** Au 7 septembre 2026, **aucun régime obligatoire de MNG n'existe** au Royaume-Uni :
c'est une proposition en développement depuis plusieurs années via le Strategic Marine Net Gain (SMNG) Task &
Finish Group (Crown Estate, Seabed User and Developer Group, industries marines, ONG). Une 3e phase de travaux
est en cours depuis début 2025 ; un rapport final (« Local Application of Strategic Marine Net Gain (SMNG)
Targets in the East Marine Plan Area ») a été publié en 2026. En parallèle, le Royaume-Uni dispose déjà d'un
régime de Biodiversity Net Gain (BNG) obligatoire pour l'aménagement terrestre (Environment Act 2021), mais ce
régime **ne s'applique pas au milieu marin** — le MNG est conçu comme son pendant marin, encore non contraignant
(source : wildlifetrusts.org PDF, pinsentmasons.com, consulté 07/09/2026 ; connaissance générale du BNG terrestre
non re-vérifiée dans cette recherche, à considérer comme contexte).

**Australie — Nature Repair Market.** Cadre légal : Nature Repair Act 2023 et Nature Repair Rules 2024 (Cth),
ces dernières entrées en vigueur le 23 décembre 2024. Le marché est opérationnel depuis le 1er mars 2025. Une
seule méthode est approuvée à ce jour : la « Replanting Method » (reboisement d'écosystèmes forestiers natifs sur
terres historiquement déboisées), active depuis le 27 février 2025 — **aucune méthode marine ou côtière
(blue carbon, herbiers, mangroves) n'existe à ce jour**, confirmé par consultation directe de cer.gov.au (accès
dcceew.gov.au/methods bloqué, 503). Seulement 2 projets enregistrés au registre biodiversité (le second en
Nouvelle-Galles du Sud, annoncé le 28 mai 2026), aucun certificat encore émis. Une réforme du droit de
l'environnement adoptée en novembre 2025 permet désormais d'utiliser les projets du Nature Repair Market pour
satisfaire des obligations de compensation sous l'Environment Protection and Biodiversity Conservation Act 1999
(EPBC) — un signal fort de convergence entre marché volontaire et obligation réglementaire, potentiellement
extensible au marin à moyen terme (source : dcceew.gov.au, cer.gov.au, mallesons.com, whitecase.com, consultés
07/09/2026).

### 3. TNFD et CSRD

**ESRS E4 (biodiversité et écosystèmes) après l'Omnibus.** La CSRD (adoptée en 2022) et son standard ESRS E4
(ESRS Set 1, adopté par la Commission en 2023 — fait de connaissance générale non re-sourcé directement dans
cette recherche) font l'objet d'un processus de simplification dit « Omnibus » depuis 2025. Selon les synthèses
juridiques consultées (état des lieux daté de septembre 2025, projet de texte daté de décembre 2025, rapport
d'impact daté de mai 2026) : le champ d'application de la CSRD serait réduit d'environ 80 % (relèvement des
seuils, recentrage sur les grandes entreprises), la divulgation de politiques/cibles/actions ESRS E4 ne serait
obligatoire que si elles existent déjà et sont matérielles, et le plan de transition biodiversité ne serait exigé
que si l'entreprise en a déjà un. Le principe de double matérialité resterait le socle. **Statut à traiter comme
« simplification en cours de finalisation », et non comme un texte définitivement publié au Journal officiel de
l'UE à la date vérifiée dans cette recherche** — accès direct à efrag.org non obtenu (404). Conséquence pratique
pour les cibles marines du fondateur : les ports, armateurs, énergéticiens offshore et croisiéristes européens de
grande taille resteront soumis à ESRS E4 dès lors que les écosystèmes marins sont jugés matériels dans leur
analyse de double matérialité, mais le volume de données obligatoires attendu diminue nettement par rapport au
texte de 2023 (source : integritynext.com, cms.law, coolset.com, financialregulations.eu, grantthornton.com,
résumés WebSearch du 07/09/2026 — **lacune : texte consolidé officiel non lu directement**).

**TNFD.** Le cadre TNFD (recommandations publiées en septembre 2023 — connaissance générale, non re-sourcée ici)
fournit des indicateurs de dépendance et d'impact sur la nature applicables volontairement. L'accès direct à
tnfd.global/sector-guidance a échoué (403) ; je n'ai donc **pas pu confirmer directement l'existence ou le
contenu d'un guide sectoriel dédié aux ports, à l'armement, à l'énergie offshore ou aux croisiéristes** dans
cette recherche — à vérifier séparément. C'est une lacune identifiée, pas une absence confirmée.

### 4. Assurance paramétrique des récifs

**Quintana Roo / MAR Fund (Mexique et région mésoaméricaine).** Le pilote de Quintana Roo, lancé en 2019, est
présenté comme le premier programme mondial de financement du risque post-tempête pour un actif naturel
(récifs et plages) ; l'ouragan Delta (2020) a déclenché un paiement de près de 850 000 $. Le programme régional
du MAR Fund en est à son 6e placement (structuré par AXA Climate) ; la période de police 2026-2027 (1er juin 2026
au 31 mai 2027) couvre désormais 12 aires protégées dans la région, dont 2 nouvelles au Mexique (parcs nationaux
des récifs de Puerto Morelos et de Cozumel). Le mécanisme : déclenchement paramétrique sur seuil de vent/vague
(souscripteur : structure fiduciaire liée à CONANP/MAR Fund), les fonds sont ensuite utilisés par des brigades de
restauration locales pour réparer les récifs endommagés (« qui déclenche » = paramètre météo objectif ; « qui
mesure » = données satellite/météo tierces ; « qui répare » = brigades communautaires/ONG locales financées par
le payout) (source : marfund.org, greenfinanceinstitute.com, climate.axa, consultés 07/09/2026).

**Hawaï.** The Nature Conservancy a souscrit une police pour les récifs des 8 îles principales, lancée en 2022 et
renouvelée en 2025 ; la couverture a plus que doublé et le paiement minimum a été porté à 200 000 $. Présenté
comme le premier paiement d'assurance paramétrique pour un récif corallien aux États-Unis (source : nature.org,
insurancebusinessmag.com, consultés 07/09/2026).

**Fidji.** Aucune information spécifique trouvée dans cette recherche sur un programme d'assurance paramétrique
récifale à Fidji — **lacune confirmée**, à traiter séparément si le sujet doit être approfondi.

### 5. Compensation d'habitat obligatoire

**États-Unis — mitigation banking marin/côtier.** Cadre fédéral (Clean Water Act §404) complété par des règles
d'État. En Floride, les prix de crédits de mitigation varient fortement selon la qualité de l'habitat impacté :
de l'ordre de 30 000 $/acre-crédit pour une zone humide de faible qualité à environ 60 000 $/acre-crédit pour une
qualité moyenne, jusqu'à 360 000 $/acre-crédit dans les cas les plus contraints (source : mitigationbankinginc.com,
floridadep.gov, consultés 07/09/2026). Pour les États de l'Ouest (Washington, par extension Oregon/Californie),
un résumé sectoriel indique des ordres de grandeur allant jusqu'à 25 000 $/acre-crédit pour des compensations
d'espèces/habitats, 150 000-300 000 $+/acre-crédit pour des zones humides, et plus de 500 000 $/acre-crédit pour
des cours d'eau à saumon quinnat — **chiffres à traiter comme indicatifs (source secondaire generaliste, pas un
registre officiel de prix), marqués « estimation »**. Aucune donnée spécifique aux herbiers marins (seagrass
mitigation banking) n'a pu être isolée séparément du marché des zones humides dans cette recherche — **lacune**.

**Californie.** Pas de donnée de prix spécifique aux herbiers trouvée dans le budget de recherche imparti — à
creuser via coastal.ca.gov / wildlife.ca.gov (hors domaines WebFetch listés pour cet agent).

**Canada — habitat banking.** Aucune donnée trouvée dans cette recherche (dfo-mpo.gc.ca non inclus dans les
domaines WebFetch spécifiquement listés pour cet agent) — **lacune explicite**. Point à signaler : le Canada
dispose d'un cadre de compensation d'habitat de poisson sous la Loi sur les pêches (« fish habitat compensation »)
qui pourrait comporter un volet côtier/estuarien pertinent pour la Colombie-Britannique, mais aucun chiffre n'a
pu être vérifié ici — hypothèse non sourcée à valider séparément.

---

## (c) Populations captives et combien

| Population cible | Estimation | Statut du chiffre | Source / méthode |
|---|---|---|---|
| Projets pilotes Verra Nature Framework | 20 pilotes, dont 2 marins/côtiers (SeaGrow, Misool) | Vérifié | verra.org (29/10/2024) |
| Projets enregistrés au Nature Repair Market australien | 2 (un en NSW, annoncé 28/05/2026), 0 certificat émis, 1 méthode approuvée | Vérifié | cer.gov.au (consulté 07/09/2026) |
| Aires protégées couvertes par le programme d'assurance récifale MAR Fund | 12 aires protégées (période 2026-2027), dont 2 nouvelles au Mexique | Vérifié | marfund.org (consulté 07/09/2026) |
| Îles couvertes par l'assurance récifale d'Hawaï | 8 îles principales | Vérifié | nature.org (07/09/2026) |
| Crédits carbone bleu émis dans le monde (2014-2025) | ~7 millions de crédits, prix moyen pondéré 27 $/crédit | Estimation sourcée (synthèse de marché, pas un décompte de registre unique) | synthèse WebSearch citant senken.io/carboncredits.com |
| Volume de marché des crédits biodiversité volontaires (mondial) | Marché « naissant », volume total échangé estimé à moins de 2 millions $ | Estimation | synthèse WebSearch (trellis.net et sources associées) |
| Entreprises dans le champ CSRD/ESRS E4 avant Omnibus | Environ 50 000 entreprises UE (grandes entreprises + PME cotées) | **Estimation** (chiffre de connaissance générale largement cité dans la presse spécialisée, non re-vérifié directement dans cette recherche) | à confirmer sur efrag.org (accès bloqué) |
| Entreprises dans le champ CSRD après Omnibus | Réduction d'environ 80 % du périmètre initial (donc de l'ordre de quelques milliers de grandes entreprises) | **Estimation**, fourchette large | financialregulations.eu (résumé WebSearch, 07/09/2026) |
| Mitigation banks agréées en Floride | Non quantifié précisément dans cette recherche ; le marché est décrit comme actif avec des prix par acre-crédit documentés (30 000-360 000 $) | **Lacune sur le nombre exact d'opérateurs** | floridadep.gov, mitigationbankinginc.com |
| Programmes d'assurance paramétrique récifale actifs dans le monde | Au moins 2 confirmés et actifs (MAR Fund/Quintana Roo, Hawaï) ; Fidji non confirmé dans cette recherche | Vérifié pour 2, lacune pour le reste | nature.org, marfund.org |
| Méthodologies carbone bleu actives et opérationnelles (herbiers/zones humides) | 1 methodology majeure confirmée et active (VM0033 Verra) ; 0 méthodologie kelp acceptée par un standard majeur | Vérifié | verra.org ; Frontiers 2026 |

---

## (d) Acteurs et prix

### Vérificateurs / VVB (Validation and Verification Bodies)
- Pour VM0033 v1.0, les rapports d'évaluation historiques citent **ESI** et **DNV** comme organismes de
  validation/vérification (capacité vérifiée, source verra.org — mais liste non ré-confirmée pour la v2.1
  actuelle, aucun VVB spécifique n'y est nommément associé dans le document consulté).
- Le prix d'une vérification VVB dédiée au carbone bleu (coût par hectare ou par projet) **n'a pas pu être
  chiffré précisément** dans cette recherche — chiffre introuvable, à traiter comme lacune plutôt que comme
  estimation hasardeuse.

### Plateformes / registres
- **Verra Project Hub** : registre central pour VM0033 et le Nature Framework (SD VISta).
- **Clean Energy Regulator (Australie)** : registre du Biodiversity Market pour le Nature Repair Market —
  actuellement 2 projets, 0 certificat.
- **S&P Global Commodity Insights** : fournit une évaluation de prix quotidienne du carbone bleu (record à
  29,30 $/tCO2e en août 2025) — un acteur de « pricing » à surveiller comme référence de marché plutôt que
  concurrent produit.

### Prix des crédits
- Carbone bleu (mangroves/herbiers) : fourchette généralement citée 13-35 $/tCO2e ; un projet mangrove
  indonésien Verra AA+ (millésime 2025) coté à 32,75 $/tCO2e ; prix moyen pondéré 2014-2025 = 27 $/crédit
  (source : synthèse WebSearch, 07/09/2026).
- Crédits biodiversité (Nature Credits Verra, Nature Repair Market australien, biodiversité Plan Vivo) : marché
  trop récent pour un prix de référence stable ; volume total mondial échangé estimé à moins de 2 millions $ en
  valeur, ce qui indique un marché encore illiquide et à faible profondeur (source : trellis.net, résumé
  WebSearch).
- Compensation d'habitat obligatoire (mitigation banking, États-Unis) : 30 000 à 360 000 $ par acre-crédit selon
  la qualité de l'habitat en Floride ; jusqu'à 500 000 $+/acre-crédit pour les habitats les plus contraints
  (cours d'eau à saumon) dans l'Ouest américain — **la fourchette haute (Washington/Oregon/Californie) est une
  estimation issue d'une source sectorielle secondaire, à vérifier auprès des agences d'État**.
- Assurance paramétrique récifale : montants de payout documentés (Hurricane Delta 2020 : ~850 000 $ ;
  Hawaï : payout minimum porté à 200 000 $ en 2025) plutôt que des « prix de prime » publics — la structuration
  passe par des courtiers/réassureurs (AXA Climate identifié comme structureur du programme MAR).

---

## (e) Opportunités produit

### Opportunité 1 — Kit MRV terrain pour herbiers et forêts de kelp du Pacifique Nord-Ouest
- **Cible précise** : porteurs de projets de restauration d'herbiers de zostère (eelgrass) et de kelp en
  Colombie-Britannique, Washington et Oregon — programmes de restauration financés par DFO Canada (Salish Sea),
  Washington DNR/Puget Sound Partnership, ONG de restauration de kelp (type Kelp Forest Alliance et affiliés
  locaux). Nombre de clients potentiels : estimation de 30 à 80 sites de restauration actifs ou en projet dans
  la région PNW sur 2026-2028 (**estimation**, faute de registre unique consulté dans le budget imparti).
- **Problème / obligation** : les développeurs de projets carbone bleu (VM0033) et de « nature credits »
  (Verra Nature Framework, futurs pilotes UE) doivent produire des données de terrain standardisées
  (biomasse, couverture, carbone du sol, biodiversité associée) alors qu'aucune méthodologie acceptée n'existe
  pour le kelp — le vrai goulot d'étranglement est la donnée de référence elle-même, pas seulement le crédit.
- **Ce que fait le produit** : kit matériel du commerce (caméra 360, ROV grand public, capteurs de turbidité/
  température, échantillonneurs eDNA) associé à un pipeline IA de vision par ordinateur qui mesure automatiquement
  la couverture d'herbier/kelp, détecte les espèces indicatrices et alimente une base de données longitudinale
  compatible avec les exigences de VM0033 et du Verra Nature Framework (format Qha). Barrière à l'entrée :
  bibliothèque d'images annotées propre au Pacifique et modèles de segmentation spécifiques aux espèces
  régionales (zostère marine, *Nereocystis*, *Macrocystis*).
- **Prix et modèle** : abonnement SaaS + matériel (300-900 $/mois par site selon fréquence de collecte), pilotes
  payants avec agences publiques ou ONG (15-40 k$ pour une saison de mesure complète sur plusieurs sites).
- **Effort technologique** : vision par ordinateur sous-marine, base de données géospatiale, pas de matériel
  sur mesure (assemblage de capteurs du commerce).
- **Concurrents** : consultants environnementaux traditionnels (mesure manuelle, coûteuse, non standardisée) ;
  startups MRV nature-based génériques (terrestres, peu spécialisées marin) citées dans les résultats de
  recherche sans nom précis identifié comme concurrent direct marin/kelp.
- **Pourquoi maintenant (daté)** : l'absence de méthodologie kelp acceptée (confirmée par Frontiers, 2026) crée
  une fenêtre pour devenir la référence de données de terrain avant l'arrivée d'une méthodologie officielle ;
  le Verra Nature Framework a ouvert l'éligibilité aux crédits le 1er avril 2025 et inclut déjà un pilote herbier
  (SeaGrow) — la demande de données de terrain fiables est immédiate.
- **Premier client atteignable depuis Vancouver** : programmes de restauration d'eelgrass du Salish Sea /
  Pêches et Océans Canada ou clubs de plongée partenaires menant des relevés bénévoles, convertibles en client
  pilote payant.

### Opportunité 2 — Plateforme de preuve pour la compensation d'habitat obligatoire (mitigation banking marin)
- **Cible précise** : opérateurs de mitigation banks agréées en Floride et en Californie (zones humides côtières,
  herbiers), consultants environnementaux qui montent les dossiers de compensation auprès de l'US Army Corps of
  Engineers et des agences d'État. Nombre de clients potentiels : dizaines d'opérateurs de banks actifs en
  Floride selon la structure de marché décrite par floridadep.gov (**nombre exact non confirmé — lacune**,
  traiter comme dizaine à confirmer).
- **Problème / obligation** : le prix très élevé des crédits (30 000 à 360 000 $/acre en Floride) reflète en
  partie le coût et le risque de la mesure et du suivi de performance des banks sur plusieurs années — un
  logiciel de suivi réduisant ce coût crée une valeur directe et mesurable pour l'opérateur de bank.
- **Ce que fait le produit** : plateforme de suivi longitudinal (drones, caméras fixes, IA de classification
  d'habitat) qui génère automatiquement les rapports de performance exigés par les agences réglementaires,
  avec traçabilité photographique horodatée et géoréférencée pour chaque parcelle de crédit.
- **Prix et modèle** : licence SaaS par bank (500-2 000 $/mois selon le nombre de parcelles suivies) + service de
  déploiement initial facturé en pilote (20-60 k$).
- **Effort technologique** : vision par ordinateur pour classification d'habitats côtiers, gestion de séries
  temporelles géospatiales, pas de matériel propriétaire.
- **Concurrents** : cabinets de conseil environnemental traditionnels (Mitigation Banking Group et similaires,
  service humain non logiciel) ; pas de plateforme spécialisée « proof-as-a-service » identifiée dans cette
  recherche pour ce segment précis.
- **Pourquoi maintenant (daté)** : le marché de la compensation reste actif et à prix élevé en 2025 (chiffres de
  prix par acre confirmés), et le sujet devient plus visible avec la montée en parallèle des standards
  volontaires (Verra Nature Framework, avril 2025) qui augmentent l'attente de rigueur de mesure côté
  régulateurs et acheteurs.
- **Premier client atteignable à distance depuis Vancouver** : un opérateur de mitigation bank ou un consultant
  environnemental en Floride, contactable à distance pour un pilote sur une saison de suivi.

### Opportunité 3 — Système de déclenchement et de suivi de réparation pour assurance paramétrique récifale/kelp
- **Cible précise** : structures porteuses de programmes d'assurance paramétrique existants ou en projet
  (MAR Fund, The Nature Conservancy Hawaï) et organismes candidats à en créer un pour les forêts de kelp du
  Pacifique Nord-Ouest, frappées par les vagues de chaleur marine — un marché non encore couvert par un
  programme paramétrique connu (aucune source trouvée sur une assurance paramétrique kelp en 2025-2026).
  Nombre de clients potentiels immédiats : 2-3 programmes existants comme intégrateurs technologiques, et
  quelques ONG/agences PNW comme primo-clients d'un nouveau produit (**estimation**, marché naissant).
- **Problème / obligation** : la crédibilité et la rapidité du déclenchement (« qui déclenche »), la fiabilité de
  la mesure post-événement (« qui mesure ») et la vérification que les fonds ont bien servi à la réparation
  (« qui répare ») sont les trois maillons faibles identifiés dans le fonctionnement actuel de ces programmes.
- **Ce que fait le produit** : réseau de capteurs bon marché (bouées de température/houle, caméras fixes) combiné
  à l'analyse satellite/drone post-tempête ou post-vague de chaleur, avec un tableau de bord d'audit
  indépendant du déclenchement et du suivi de la réparation (photos horodatées, rapports de restauration).
- **Prix et modèle** : contrat de licence de plateforme avec le structureur d'assurance ou le fiduciaire local
  (pilote 20-80 k$ par programme), puis abonnement de maintien de la donnée en continu.
- **Effort technologique** : fusion de données satellite/capteurs in situ, modèles de détection d'anomalies
  thermiques/houle, pas de matériel sur mesure (bouées et caméras du commerce).
- **Concurrents** : AXA Climate et courtiers de réassurance structurent déjà ces programmes mais sans plateforme
  de preuve indépendante dédiée identifiée dans cette recherche ; c'est un rôle de fournisseur de données de
  confiance plutôt qu'un concurrent frontal des assureurs.
- **Pourquoi maintenant (daté)** : le programme MAR Fund vient d'entrer dans sa 6e période de placement avec une
  extension de couverture (période 2026-2027, 12 aires protégées) et Hawaï a renouvelé/doublé sa couverture en
  2025 — la classe d'actif est en expansion active et cherche à professionnaliser sa chaîne de preuve.
- **Premier client atteignable depuis Vancouver** : recherche appliquée avec une université ou un institut
  océanographique du Pacifique Nord-Ouest documentant les vagues de chaleur marine affectant le kelp, comme
  porte d'entrée vers un futur structureur d'assurance régional.

### Opportunité 4 — Tableau de bord ESRS E4 / TNFD marin pour ports, énergéticiens offshore et croisiéristes
- **Cible précise** : grandes entreprises européennes soumises à la CSRD/ESRS E4 opérant à proximité
  d'écosystèmes benthiques matériels — opérateurs portuaires, énergéticiens offshore (éolien), armateurs et
  croisiéristes. Nombre de clients potentiels : de l'ordre de quelques milliers de grandes entreprises UE
  restant dans le champ CSRD après la réduction de périmètre estimée à 80 % par l'Omnibus (**estimation**,
  fourchette large, chiffre de départ ~50 000 non re-vérifié directement).
- **Problème / obligation** : produire, sous double matérialité, une évaluation des dépendances et impacts sur
  les écosystèmes marins matériels (habitats benthiques proches des infrastructures) est coûteux en données —
  peu d'entreprises disposent en interne de données benthiquesà jour.
- **Ce que fait le produit** : agrégateur de données ouvertes (Copernicus Marine, NOAA, DFO, cartographie
  d'habitats), complété par des relevés propriétaires low-cost sur les sites les plus sensibles, avec génération
  automatisée des sections de reporting ESRS E4 / indicateurs TNFD pertinents pour le milieu marin.
- **Prix et modèle** : SaaS par site surveillé (500-2 000 $/mois), option service de relevé terrain en
  complément pour les sites jugés matériels.
- **Effort technologique** : intégration de données géospatiales multi-sources, moteur de règles de conformité
  ESRS E4, pas de matériel propriétaire obligatoire (option capteurs en extension).
- **Concurrents** : plateformes ESG génériques (peu spécialisées marin/benthique) ; consultants biodiversité
  spécialisés (service humain, non scalable).
- **Pourquoi maintenant (daté)** : le processus de simplification Omnibus (état des lieux septembre 2025, projet
  décembre 2025, rapport d'impact mai 2026) crée une fenêtre d'incertitude où les entreprises ont besoin d'un
  outil capable de s'adapter rapidement au texte final tout en couvrant dès maintenant les obligations qui
  restent — le marché a besoin de clarté logicielle pendant que le texte juridique bouge.
- **Premier client atteignable à distance** : un port ou énergéticien offshore européen de taille moyenne
  (contact à distance depuis Vancouver, marché visé « Europe » selon le brief fondateur), ou un armateur ayant
  une escale régulière à Vancouver comme porte d'entrée relationnelle.

### Opportunité 5 — Réseau de stations de mesure communautaires pour les pilotes de crédits nature
- **Cible précise** : porteurs de projets pilotes du Verra Nature Framework, de futurs pilotes de la feuille de
  route UE Nature Credits, et de projets communautaires/autochtones candidats à un futur élargissement marin du
  Nature Repair Market australien. Nombre de clients potentiels immédiat : les 20 pilotes Verra Nature Framework
  (dont 2 marins confirmés) comme cible d'amorçage, extensible aux futurs pilotes UE annoncés pour 2025-2027.
- **Problème / obligation** : les standards de crédits nature exigent un suivi multi-métrique (habitat, espèces,
  connectivité) souvent hors de portée financière des communautés locales/autochtones porteuses de projets,
  qui n'ont pas accès à des outils de mesure normalisés.
- **Ce que fait le produit** : stations de mesure déployables par les communautés elles-mêmes (caméras/capteurs
  low-cost, guide IA de collecte standardisée sur smartphone), alimentant une base de données atlas partagée qui
  produit directement les métriques attendues par Verra Nature Framework (Qha) et les futurs formats UE.
- **Prix et modèle** : licence de plateforme + vente/location de kits matériels aux porteurs de projet ou à leurs
  bailleurs de fonds (ONG, fondations) ; tarif pensé pour rester dans la fourchette « petits clients »
  (100-1 000 $/mois par site) plus des contrats de licence de données avec les standards ou les acheteurs de
  crédits en quête de vérifiabilité indépendante.
- **Effort technologique** : application mobile de collecte guidée, pipeline de vision par ordinateur, base de
  données atlas — développement logiciel significatif, matériel du commerce uniquement.
- **Concurrents** : startups MRV nature-based génériques mentionnées dans les résultats de recherche sans
  spécialisation marine confirmée ; pas de concurrent frontal identifié sur le segment marin/communautaire.
- **Pourquoi maintenant (daté)** : l'éligibilité aux Nature Credits Verra a démarré le 1er avril 2025 et la
  feuille de route UE (7 juillet 2025) prévoit explicitement des pilotes jusqu'en 2027 — la fenêtre
  d'implémentation des méthodologies de mesure est ouverte maintenant, avant que des standards de collecte
  propriétaires ne s'imposent.
- **Premier client atteignable depuis Vancouver ou à distance** : contact à distance avec un porteur de projet
  pilote Verra Nature Framework (SeaGrow, Australie, ou Misool, Indonésie) pour un test de kit sur un site, ou
  un projet communautaire de restauration d'herbiers en Colombie-Britannique comme vitrine locale.

---

## (f) Références et lacunes

### Références principales (URL et date de consultation : 07/09/2026 sauf indication contraire)
- Verra — VM0033 v2.1 : https://verra.org/methodologies/vm0033-methodology-for-tidal-wetland-and-seagrass-restoration-v2-1/
- Verra — lancement du Nature Framework : https://verra.org/verra-launches-nature-framework/
- Frontiers in Climate (2026) — état des méthodologies macroalgues : https://www.frontiersin.org/journals/climate/articles/10.3389/fclim.2026.1761760/full
- Communications Earth & Environment (2026) — dégradation du kelp coulé : https://www.nature.com/articles/s43247-026-03342-0
- Hakai Magazine — controverse Running Tide : https://hakaimagazine.com/features/kelp-gets-on-the-carbon-credit-bandwagon/
- Commission européenne / CINEA — Roadmap towards Nature Credits (07/07/2025) : https://cinea.ec.europa.eu/news-events/news/eu-publishes-nature-credits-roadmap-boost-private-investment-nature-positive-actions-2025-07-07_en
- TNFD Knowledge Bank — résumé de la feuille de route UE : https://tnfd.global/knowledge-bank/eu-publishes-nature-credits-roadmap-to-boost-private-investment-in-nature-positive-actions/
- Wildlife Trusts — rapport SMNG (2026) : https://www.wildlifetrusts.org/sites/default/files/2026-03/Marine_Net_Gain_Report_0.pdf
- DCCEEW — Nature Repair Market : https://www.dcceew.gov.au/environment/environmental-markets/nature-repair-market
- Clean Energy Regulator — Nature Repair Market scheme : https://cer.gov.au/schemes/nature-repair-market-scheme
- Mallesons / White & Case — analyses juridiques du Nature Repair Market : mallesons.com, whitecase.com
- CMS Law, IntegrityNext, Coolset, Grant Thornton, financialregulations.eu — état des lieux Omnibus/ESRS E4 (résumés WebSearch, 07/09/2026)
- MAR Fund — 6e placement du programme d'assurance récifale : https://marfund.org/en/the-mesoamerican-reef-insurance-programme-enters-its-sixth-placement-and-expands-to-cover-two-new-sites-in-mexico/
- The Nature Conservancy — assurance récifale Hawaï : https://www.nature.org/en-us/newsroom/first-ever-us-coral-reef-insurance-policy/
- Florida DEP — mitigation et mitigation banking : https://floridadep.gov/water/submerged-lands-environmental-resources-coordination/content/mitigation-and-mitigation-banking
- Mitigation Banking Group — prix des crédits en Floride : https://mitigationbankinginc.com/mitigation-credit-prices/
- Carbon Pulse — Plan Vivo biodiversité : https://carbon-pulse.com/189610/ et https://carbon-pulse.com/243681/ (résumés, accès direct au site refusé)

### Lacunes explicites (à traiter comme telles, pas comme absence de fait)
1. **Gold Standard — carbone bleu** : aucune méthodologie confirmée ; accès direct au site échoué (404) —
   à revérifier sur une autre URL du site.
2. **TNFD — guides sectoriels ports/armateurs/énergie offshore/croisiéristes** : existence et contenu non
   confirmés (accès tnfd.global/sector-guidance refusé, 403).
3. **EFRAG — texte consolidé ESRS E4 post-Omnibus** : non lu directement (efrag.org/en/projects/esrs-set-1-amendments/status → 404) ;
   toute l'analyse de la section CSRD repose sur des sources juridiques secondaires, cohérentes entre elles mais
   non croisées avec le texte officiel.
4. **UK Marine Net Gain vs Biodiversity Net Gain marin** : le PDF complet de 82 pages de la mise à jour de la
   « UK Marine Strategy Part One » n'a pas été lu (accès à la page sommaire seulement) — les obligations
   concrètes et échéances précises restent à vérifier.
5. **Assurance paramétrique récifale à Fidji** : aucune source trouvée dans le budget de recherche imparti.
6. **Prix des crédits de compensation d'habitat spécifiques aux herbiers (Californie)** : non isolés du marché
   général des zones humides ; les domaines coastal.ca.gov / wildlife.ca.gov n'étaient pas dans la liste de
   domaines WebFetch autorisée pour cet agent.
7. **Compensation d'habitat au Canada (Loi sur les pêches, habitat banking)** : aucune donnée trouvée
   (dfo-mpo.gc.ca hors liste de domaines WebFetch de cet agent) — lacune complète, prioritaire à combler pour un
   fondateur basé à Vancouver.
8. **Nombre exact d'opérateurs de mitigation banks actifs en Floride** : non quantifié précisément dans cette
   recherche.
9. **Coût de vérification (VVB) au hectare pour un projet blue carbon** : chiffre introuvable dans le budget
   imparti — aucune fourchette même « estimation » n'a pu être construite de façon fiable ; à traiter en priorité
   dans une recherche complémentaire car c'est une douleur centrale du brief.

---

## Résumé — meilleures opportunités (15 lignes max)

1. **Kit MRV herbiers/kelp Pacifique Nord-Ouest** : le plus solide car il répond à une lacune vérifiée (aucune
   méthodologie kelp acceptée, Frontiers 2026) tout en s'ancrant sur le terrain immédiat du fondateur
   (Colombie-Britannique, Washington) et sur un standard déjà actif (VM0033, Verra Nature Framework).
2. **Plateforme de preuve pour mitigation banking marin (Floride/Californie)** : marché à prix élevé et
   documenté (30 000-360 000 $/acre-crédit), douleur de coût de mesure claire, vente à distance possible.
3. **Système de déclenchement/suivi pour assurance paramétrique récifale et kelp** : classe d'actif en expansion
   active (MAR Fund 6e placement, Hawaï renouvelé 2025) et angle kelp/PNW inexploité (aucun programme identifié).
4. **Tableau de bord ESRS E4/TNFD marin** : fenêtre réglementaire ouverte par l'incertitude Omnibus 2025-2026,
   marché européen visé en priorité par le fondateur, mais dépend d'un texte encore mouvant.
5. **Réseau de stations communautaires pour pilotes de crédits nature** : aligné sur le calendrier UE
   (2025-2027) et sur les pilotes Verra actifs, mais marché encore très embryonnaire (< 2 M$ échangés).
Priorité recommandée pour un premier pilote payant : opportunité 1, puis 3 (angle kelp/PNW différenciant et
non couvert par la littérature trouvée), avec l'opportunité 2 comme diversification revenue rapide (marché
mitigation banking déjà mature et à prix élevés, vente à distance).
Lacune à combler en urgence avant d'investir : coût réel de vérification (VVB) au hectare, introuvable dans
cette recherche, et cadre canadien de compensation d'habitat (Loi sur les pêches), non exploré faute de domaine
WebFetch autorisé pour cet agent.
