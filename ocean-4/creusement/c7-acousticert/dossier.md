# Dossier AcoustiCert — creusement (passe 4, candidat 7)

Origine : section (b), candidat 1 du dossier armateurs-assureurs. Méthode : 6 WebSearch (quota du brief de
creusement) + WebFetch libre (plusieurs échecs, voir claude.md). Date de référence : 7 septembre 2026.

## Trois angles candidats

1. **Angle A, substitut d'attestation** : une attestation tierce, construite à partir des hydrophones publics
   de Vancouver, remplace l'essai en mer dédié et suffit à obtenir le rabais EcoAction du Port de Vancouver.
2. **Angle B, surveillance de dérive entre essais officiels** : un abonnement qui suit, entre deux essais
   officiels, la trajectoire acoustique d'un navire à chaque passage naturel devant les hydrophones, pour
   signaler une dérive (encrassement, hélice) avant l'expiration de la notation.
3. **Angle C, export vers d'autres ports** : le même service, sans essai dédié, vendu à des ports qui
   envisagent une grille tarifaire type EcoAction mais n'ont pas de station d'écoute permanente.

### Angle A : confirme / contredit / verdict
Confirme : les notations SILENT-E, UWN, URN existent et sont chères à obtenir (essai en mer dédié).
Contredit, **vérifié cette session** : le Port de Vancouver liste nommément les notations acceptées pour le
rabais EcoAction : ABS Underwater Noise (UWN), BV Underwater Radiated Noise (URN), DNV SILENT-E, LR UWN-L,
RINA (portvancouver.com, résumé WebSearch ; safety4sea.com). Aucune mention trouvée d'une attestation tierce
acceptée en substitut. Verdict : **réfuté en l'état**. Le port paie pour une notation de société de
classification, pas pour une mesure indépendante, aussi fiable soit-elle.

### Angle B : confirme / contredit / verdict
Confirme : Clear Seas distingue explicitement deux méthodes reconnues, l'essai actif (« ranging », navire
coopérant, passages répétés à vitesses fixées) et le suivi passif de long terme par hydrophones fixes
(clearseas.org, WebFetch réussi) — la surveillance passive a un rôle documenté, différent de la notation.
Contredit, **vérifié cette session** : la station de Boundary Pass (opérée par JASCO Applied Sciences pour
Transports Canada, pas Orcasound ni le Port) fait déjà de « l'analyse automatisée en temps réel qui mesure le
bruit rayonné de chaque navire individuellement », avec cartographie acoustique de coque pour certains navires,
sur 4 000 à 5 000 transits par an (tc.canada.ca, jasco.com, WebSearch). JASCO, l'opérateur de la station
gratuite, vend aussi via ShipConsult des mesures de bruit rayonné à la commande et publie sa propre méthode de
notation A à D à partir de mesures (jasco.com/public-reports). Verdict : **partiellement réfuté** — l'attribution
automatisée par navire existe déjà côté infrastructure publique/JASCO ; l'angle différenciateur ne peut être
« mesurer chaque navire », seulement « le restituer en continu, par flotte, à l'armateur », ce que ni Transports
Canada (recherche) ni JASCO (mesures ponctuelles à la commande) ne semblent faire aujourd'hui — **non vérifié
dans un sens ou dans l'autre**, aucune page trouvée ne confirme ni n'exclut un tel service de restitution.

### Angle C : confirme / contredit / verdict
Confirme : Green Marine (285 membres, candidat 4 du même dossier) montre un appétit du secteur pour des
notations environnementales portuaires ; l'idée d'autres ports adoptant une grille type EcoAction est plausible.
Contredit : aucune recherche cette session (budget déjà consacré aux angles A et B) ne confirme qu'un autre port
prépare une telle grille ; et l'avantage « pas d'essai dédié » disparaît précisément là où il n'y a pas de
station d'écoute permanente de type Boundary Pass, ce qui obligerait à financer du matériel (hors moyens du
fondateur seul, moins de 25 k$ CAD). Verdict : **écarté, capex non finançable, marché non confirmé**.

## Angle retenu et pourquoi les deux autres tombent
Aucun angle ne survient intact. L'angle A est réfuté par les critères publiés du Port de Vancouver : le rabais
EcoAction exige nommément une notation de société de classification, pas une attestation tierce. L'angle C est
écarté faute de capex et de marché vérifié ailleurs. Il reste l'angle B, mais fortement rétréci : non plus
« attestation qui remplace l'essai », mais **service de restitution et d'alerte de dérive acoustique entre deux
essais officiels**, vendu à l'armateur (pas au port), en s'appuyant sur les passages gratuits déjà mesurés par
Boundary Pass et Orcasound. C'est un produit de renseignement pour l'armateur, pas un substitut de certification.
Il ne délivre PAS le rabais EcoAction lui-même ; il aide à décider quand payer le vrai essai ISO 17208 et
détecte une dérive (encrassement, avarie d'hélice) qui ferait perdre la notation avant l'échéance normale.

## Acheteur
Responsable technique / surintendant de flotte d'un armateur dont les navires transitent régulièrement par le
détroit de Georgia et Boundary Pass (escales répétées à Vancouver). Dépense actuelle : droits portuaires non
réduits (écart -23 % à -47 % documenté, portvancouver.com/SAFETY4SEA) pour les navires sans notation à jour, et
coût de l'essai officiel de renotation, **chiffre introuvable cette session** (estimation : au moins plusieurs
dizaines de milliers de USD par essai, non confirmé). Qui signe un bon de commande de 2 000 $ : ce surintendant,
pour un rapport pilote sur un ou deux navires de sa flotte, sans validation d'un comité budgétaire plus large.

## Produit (6 lignes)
1. Le client fournit la liste IMO de sa flotte et ses dates d'escale à Vancouver.
2. Le service recoupe l'AIS (transpondeur de position) avec les passages captés par Boundary Pass et Orcasound.
3. Il restitue un indice acoustique par transit, positionné sur l'échelle des grilles EcoAction/URN, **supposé**
   corrélé aux seuils réels (non validé face à une notation officielle cette session).
4. Il alerte si l'indice dérive dans le temps (tendance à la hausse depuis la dernière notation).
5. **Vérifié** : passages et transits mesurés par la station ; **supposé** : que l'attribution acoustique
   reste fiable navire par navire dans un chenal fréquenté par plusieurs bâtiments en même temps.
6. Le rapport n'est ni une notation officielle ni accepté par le Port ; il sert à décider si l'essai ISO
   17208 (payant, société de classification) vaut la peine d'être commandé cette année.

## Prix et modèle
Abonnement annuel par navire suivi (ordre de grandeur à tester : quelques centaines à ~1 000 USD/navire/an,
non validé). Le client revient l'année suivante parce que la dérive acoustique (encrassement, usure d'hélice)
est propre à chaque navire et à chaque cycle de cale sèche : c'est une série temporelle par navire, pas un
rapport unique (critère du BRIEF, « pourquoi il revient »).

## Faisabilité seul depuis Vancouver
AIS : flux commercial payant ou sources partielles gratuites, non vérifié cette session. Orcasound : réseau
communautaire ouvert, couverture limitée (déjà noté au dossier d'origine, non revérifié). Boundary Pass : station
opérée par JASCO pour Transports Canada ; **accès aux données brutes non confirmé cette session** (portvancouver.com
et jasco.com/uls ont refusé ou n'ont pas répondu au WebFetch) — c'est le point qui peut tuer le projet si les
données ne sont pas ouvertes. Aucun matériel propre requis si les flux existants sont accessibles ; sinon,
projet non finançable seul. Permis : aucun identifié pour un usage de données déjà publiques ; à vérifier si
les données Boundary Pass sont sous licence restrictive (recherche gouvernementale).

## La preuve se retourne-t-elle contre l'acheteur
Oui, potentiellement plus que dans la version originale de l'idée : un indice qui détecte une dérive acoustique
négative pourrait, s'il fuit ou s'il est demandé par un assureur ou une autorité portuaire, documenter une
non-conformité que l'armateur n'avait pas déclarée. Architecture recommandée : rapport livré uniquement au
client, jamais transmis automatiquement à un tiers (port, assureur, régulateur), le client restant seul décideur
de le communiquer ou non.

## Test à moins de 2 000 $ et deux semaines
Choisir un navire dont les transits Boundary Pass sont publics (via les publications JASCO/Transports Canada
citées en source), recouper avec l'AIS de ce même navire sur 5 à 10 passages, et vérifier si l'indice acoustique
reconstruit est stable et plausible (pas de valeurs aberrantes navire à navire) sur ces passages. Critère chiffré :
un coefficient de variation de l'indice inférieur à 15 % entre passages d'un même navire à vitesse comparable,
sans intervention manuelle de nettoyage des données.

## Ce qui reste incertain, et la question à poser au client
Incertain : si les données de Boundary Pass sont accessibles à un tiers commercial (pas seulement à la
recherche) ; le coût réel d'un essai ISO 17208 officiel ; si un armateur paierait pour un indice non reconnu
par le port ; la fiabilité de la séparation de sources dans un chenal à trafic dense (recherche 2022-2025
encore en cours, pas de déploiement commercial confirmé). Question à poser au client : accepterait-il un
service qui ne donne jamais accès direct au rabais portuaire, seulement une aide à décider quand investir dans
la vraie notation ?
