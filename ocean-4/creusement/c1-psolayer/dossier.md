# Dossier de creusement, PSO/PAM Layer (candidats fusionnes 1+2)

Passe 4 (validation et creusement), 7 septembre 2026. Idee : couche de fusion des capteurs d'observation de
mammiferes marins (PSO, Protected Species Observer) et de surveillance acoustique passive (PAM, Passive Acoustic
Monitoring) pendant les travaux en mer, qui genere le rapport de conformite NMFS (National Marine Fisheries
Service, agence federale americaine) ou JNCC (Joint Nature Conservation Committee, organisme statutaire
britannique), vendue aux prestataires d'observateurs (RPS Group, A.I.S. Inc., Coastwise Consulting, Seiche Ltd),
pas aux developpeurs. Sources d'origine : ports-terminaux candidat 1 (Sentinelle-PSO), energie-cables candidat 1
(couche de fusion multi-capteurs JNCC), bureaux-labos candidat 3 (agent de conformite acoustique PAM). 6 WebSearch
utilises (quota impose), WebFetch libre.

## 1. Trois angles candidats

1. **Synthese narrative multi-source tracable** : le produit relie chaque phrase du rapport de conformite a sa
   donnee brute (log de detection, fiche terrain, condition meteo), ce qu'un LLM generique avec un gabarit ne fait
   pas faute d'acces aux flux proprietaires de plusieurs fournisseurs a la fois.
2. **Corpus historique par site qui s'accumule** : chaque rapport soumis et son sort (accepte ou retourne par le
   regulateur) nourrit un modele de ce qui passe pour ce site et ce permis precis, avantage qui grandit avec
   l'usage.
3. **Detection ou vision IA proprietaire qui remplace ou augmente le PSO humain** : camera thermique/optique ou
   classificateur acoustique proprietaire, vendu comme produit de detection plutot que de rapport.

## 2. Verdict par angle

**Angle 1.** Confirme : le reglement federal (eCFR 50 CFR 217/218/219, "Requirements for monitoring and
reporting") exige que le rapport contienne dates et heures, position des PSO, conditions environnementales,
comptages par espece, actions de mitigation declenchees et les fiches PSO brutes en annexe, soit une synthese
multi-source, verifie (recherche WebSearch, cette session). Contredit : cote britannique, JNCC fournit deja un
formulaire Excel standardise avec feuilles integrees pour la capture terrain, verifie (JNCC Resource Hub, cette
session) : la partie collecte est deja un gabarit. Verdict : l'angle tient pour la redaction narrative post
capture (le "MMO report" qui detaille la mise en oeuvre du protocole et les incidents, distinct du formulaire de
capture), pas pour remplacer la fiche terrain elle meme.

**Angle 2.** Confirme : plus de 50 autorisations IHA (Incidental Harassment Authorization) actives en continu
cote NMFS, meme site revenant chaque annee avec un nouveau projet, verifie (dossier ports-terminaux, session
precedente). Contredit : aucune base publique de rapports acceptes ou rejetes par NMFS/JNCC trouvee cette
session ; le mecanisme d'apprentissage par retour du regulateur reste une hypothese non testee. Verdict : l'angle
tombe en phase intuition, faute de preuve d'un signal de feedback exploitable.

**Angle 3.** Confirme : la detection est deja commoditisee, au moins cinq produits concurrents identifies dans
les dossiers d'origine (WhaleSpotter, ThermalTracker-3D/PNNL, Seiche RADES, RPS Neptune, PAMGuard gratuit),
verifie. Contredit rien de plus : le reglement JNCC comme l'autorisation NMFS exigent en plus un observateur
certifie present (formation accreditee JNCC obligatoire sur le plateau continental britannique, verifie ; PSO
certifie exige par les IHA, verifie dossier source), donc un produit de detection seul ne supprime pas
l'obligation d'observateur humain payant. Verdict : l'angle tombe, terrain deja occupe et non differenciant.

**Angle retenu : 1.** La couche de synthese narrative tracable est la seule confirmee a la fois par le texte
reglementaire (contenu exige multi-source) et par l'absence de concurrent identifie sur ce maillon precis (RPS
Neptune, Seiche RADES et PAMGuard couvrent la detection, aucun ne montre de generation de rapport dans les
resultats trouves cette session).

## 3. Acheteur, terre a terre

Prestataires de PSO/MMO/PAM identifies par le brief : A.I.S. Inc. (Alaska, Texas, Massachusetts, PSO 15 a 45
$US/h, verifie dossier source) et Coastwise Consulting Inc. (formateur PSO reconnu NOAA, observateurs a 250
$US/jour ou plus, embarques 20 a 30 jours, verifie recherche cette session) sont des PME de sous-traitance sans
departement logiciel visible dans les pages trouvees (offres d'emploi terrain uniquement). Seiche Ltd vend du
materiel PAM et une app iPad (RADES) mais s'appuie sur PAMGuard gratuit pour la classification, verifie recherche
cette session : signe d'achat de brique plutot que de construction interne. RPS Group est plus gros, a deja
Neptune (IA proprietaire, partenariat Microsoft/cloud), verifie recherche cette session : acheteur plus risque
(tentation de construire en interne). Fonction qui signerait un bon de commande de 2 000 $ : probablement un
responsable operations ou projet chez A.I.S./Coastwise/Seiche, titre exact non trouve, **question a poser au
client**. Depense actuelle documentee : day rate observateur (200 a 700 $US/jour selon seniorite, verifie
dossier source), aucune ligne budgetaire logicielle dediee au rapport identifiee cette session, estimation.

## 4. Produit en 6 lignes, prix, retour annuel

1. Ingestion des logs deja produits (detections PAM, fiches terrain PSO, alertes camera de detecteurs existants).
2. Alignement automatique sur le gabarit exige par le permis (IHA/NMFS ou protocole JNCC).
3. Brouillon de rapport narratif avec chaque chiffre trace a sa source (pas de generation sans citation).
4. Signalement des trous de donnees (heures d'observation manquantes, especes sans fiche associee).
5. Validation humaine obligatoire avant soumission, le prestataire signe, pas l'outil.
6. Export au format attendu par le regulateur, archive par site pour le cycle suivant.
Verifie : le contenu exige (point 2) et l'absence de generateur concurrent (point 3). Suppose : la fiabilite de
l'alignement multi-fournisseur (point 1) et le taux d'adoption reel par les PME ciblees.
Prix : abonnement par projet ou par rapport, en dessous du cout d'un jour d'observateur (moins de 200 a 700
$US/rapport), modele a valider. Retour l'annee suivante (Q7) : chaque nouveau chantier redemande un permis et un
rapport, et l'historique par site (formats acceptes, especes locales, contacts regulateur) reste dans l'outil du
prestataire, cout de changement pour lui, pas de preuve chiffree de retention cette session, suppose.

## 5. Faisabilite depuis Vancouver

Donnees publiques exploitables : rapports PSO deja soumis et publies par NOAA Fisheries (PDF telechargeables sur
fisheries.noaa.gov, ex. FugroWD-2025LOA-MonRep-OPR1.pdf, domaine public federal americain), formulaires Excel
JNCC (JNCC Resource Hub, licence a verifier). Materiel : aucun, ingestion de PDF/Excel/logs suffit, faisable sur
un ordinateur portable. Permis : aucun permis terrain necessaire, le fondateur ne fait pas d'observation lui
meme. Blocage reel : acces aux formats de logs proprietaires reels (export Neptune, RADES, PAMGuard) non public,
necessite un partenariat client pour tester sur donnees reelles non publiees ; en attendant, les rapports NMFS
deja publies servent de corpus d'entrainement et de validation.

## 6. La preuve se retourne-t-elle contre l'acheteur ?

Oui, potentiellement : un rapport de conformite errone (chiffre mal recopie, resume incomplet) expose le
prestataire a une non-conformite face a NMFS/JNCC, avec un risque reglementaire reel. L'architecture l'evite en
restant strictement assistant de redaction avec citation obligatoire de chaque affirmation vers sa donnee source,
validation humaine finale avant tout envoi, et aucune fonction de decision de mitigation en temps reel (pas de
controle d'arret de chantier) : l'outil ne fait jamais foi seul.

## 7. Test a moins de 2 000 $ et deux semaines

Prendre 10 a 20 rapports PSO deja soumis a NMFS et publics (fisheries.noaa.gov), reconstituer les logs source a
partir des annexes brutes, generer un brouillon avec l'outil, faire evaluer en aveugle par un ancien PSO ou
consultant freelance (environ 500 a 1 000 $ pour 5 a 10 heures de revue) contre le rapport reellement soumis.
Critere chiffre : au moins 80 % des champs obligatoires (dates, comptages par espece, actions de mitigation)
extraits sans erreur factuelle, en moins de 10 minutes de generation par rapport contre plusieurs heures a la
main.

## 8. Incertitudes et question au client

Format exact des logs proprietaires (Neptune, RADES, PAMGuard) non documente publiquement, a obtenir aupres d'un
prestataire. Titre et process d'achat reels chez A.I.S./Coastwise/Seiche non trouves. Mecanisme de retour du
regulateur (accepte/rejete) non confirme accessible. Question a poser au client : combien de vos rapports ont ete
retournes ou contestes par NMFS ou JNCC l'an dernier, et sur quels points precisement ?
