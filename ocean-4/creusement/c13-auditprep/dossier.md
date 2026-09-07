# Dossier de creusement, candidat 13 : AuditPrep
Copilote qui lit les journaux d'une ferme aquacole ou d'un navire de pêche et les pré-cartographie
contre les grilles ASC, MSC ou BAP avant l'auditeur. Vendu aux sites certifiés ou aux organismes
certificateurs. Rédigé le 7 septembre 2026. Dossiers d'origine : agents/aquaculture-peche
(candidat 2) et agents/bureaux-labos (candidat 5), qui proposent tous deux, indépendamment, une
version de ce produit. Acronymes : **ASC** (Aquaculture Stewardship Council), **MSC** (Marine
Stewardship Council), **BAP** (Best Aquaculture Practices, programme de la **GSA**, Global Seafood
Alliance), **CoC** (Chain of Custody, traçabilité de la chaîne de contrôle), **CAB** (Conformity
Assessment Body, organisme certificateur accrédité), **GFSI** (Global Food Safety Initiative,
référentiel générique de sécurité alimentaire), **LLM** (grand modèle de langage).

## 1. Trois angles candidats
A. Gabarit réglementaire versionné : correspondance exacte, tenue à jour à chaque révision de
norme, entre un journal brut et les indicateurs numérotés d'ASC, MSC ou BAP, qu'un LLM générique
avec un simple gabarit ne fait pas de lui même.
B. Historique cumulé par site : mémoire, d'un cycle d'audit à l'autre, des non conformités et des
corrections, absente d'un consultant ponctuel ou d'un outil générique sans mémoire.
C. Position bifronte : vendu à la fois au site et à l'organisme certificateur (Bureau Veritas, DNV,
SCS, Intertek) pour accélérer sa revue documentaire.

## 2. Confirmation, contradiction, verdict
**A.** Confirme : référentiels publics et détaillés (25 indicateurs MSC, seuils 60/80 ; standards
BAP Farm 3.1, Hatchery 2.1, Feed Mill 3.3, Processing 6.0), vérifiée msc.org et bapcertification.org
; aucun outil commercial dédié trouvé. Contredit : MSC/ASC ont digitalisé leur plateforme d'audit
CoC (remplacement du système eCert, généralisée septembre 2023) et BAP a un portail nommé Prism
(prism-landing.globalseafood.org, existence vérifiée, contenu non accessible) ; les certificateurs
bâtissent déjà leurs rails numériques et pourraient absorber ce mapping en interne. Verdict : angle
réel aujourd'hui, fragile à moyen terme.

**B.** Confirme : retour annuel vérifié pour MSC (« audits every year of the five-year certification
period », msc.org). Contredit : tout logiciel à mémoire accumule par construction, un concurrent qui
copie A accumule aussi dès l'année 2. Verdict : bon argument de rétention (Q7), pas un
différenciateur d'entrée.

**C.** Confirme : le dossier bureaux-labos nomme déjà les CAB comme acheteurs potentiels, SCS vend
explicitement des services de certification ASC et MSC. Contredit : les CAB facturent au temps ou à
la complexité, un outil qui accélère leur revue réduit leurs honoraires, désincitatif économique
direct. Verdict : angle qui tombe.

## 3. Angle retenu
Angle A, avec B comme mécanisme de rétention et non comme différenciateur d'entrée. C tombe pour le
conflit d'intérêt ci dessus. B tombe en tant qu'angle autonome : n'importe quel logiciel à mémoire
produit le même effet après un ou deux cycles. Ce qui reste : aucune trace, dans ce budget de
recherche, d'un gabarit journal vers indicateur pour ASC, MSC et BAP tenu à jour, avec citation
exacte du passage source pour chaque case cochée.

## 4. Acheteur, terre à terre
Le responsable qualité ou durabilité d'un site aquacole certifié ou en voie de certification, ou le
coordinateur technique d'un CAB local. Dépense actuelle : un audit MSC coûte 15 000 à 120 000 USD
(jusqu'à 250 000 USD selon d'autres prestataires), chiffre qualifié d'« anecdotique » par le MSC
lui même (vérifiée, msc.org). Aucun chiffre équivalent trouvé pour ASC ou BAP malgré une tentative
WebFetch dédiée (lacune assumée). Comparanda hors secteur marin : un consultant de préparation
GFSI facture 2 500 à 12 000 USD (vérifiée, comparanda seulement). Qui signe un bon de 2 000 dollars
: le responsable qualité du site lui même, sans comité, pour un pré-audit ponctuel sous son budget
consultant habituel.

## 5. Fonctionnalités, dans l'ordre de vente
1. Le site téléverse ses journaux (traitements, mortalité, registres, PDF scannés, tableurs,
   plusieurs langues).
2. Cartographie contre la grille cible (25 indicateurs MSC, BAP Farm 3.1 ou équivalent ASC) :
   couvert, manquant, ambigu, indicateur par indicateur.
3. Chaque case couverte cite le passage source exact, jamais une affirmation libre.
4. Signale les incohérences entre documents (dates, chiffres discordants).
5. Produit un rapport de pré-audit priorisé, gardé en interne au site.
6. Mémorise les écarts et corrections d'un cycle à l'autre.
Ce que l'IA fait précisément : extraction multimodale puis mise en correspondance sémantique contre
un gabarit fixe, jamais de décision de conformité elle même. Vérifié : contenu des référentiels,
coûts MSC, existence de Prism et de la plateforme CoC digitale. Supposé : performance sur journaux
dégradés multilingues, volonté des sites de partager leurs documents, acceptation par les CAB d'un
pré-rapport tiers.

## 6. Prix, modèle, retour l'année suivante
Prix par pré-audit ponctuel (quelques centaines à environ 1 500 USD) ou abonnement annuel incluant
la mémoire de cycle. Le client revient l'année suivante parce que son historique d'écarts et de
corrections vit dans le produit : changer d'outil signifie repayer le temps de remise en contexte
(réponse à Q7, angle B en soutien de l'angle A).

## 7. Faisabilité depuis Vancouver
Référentiels publics et téléchargeables (asc-aqua.org, msc.org, bapcertification.org, licence de
consultation non vérifiée précisément). Les journaux de sites ne sont pas publics : il faut un
client pilote, c'est un problème de confiance commerciale, pas de licence. Matériel : aucun, API LLM
plus OCR standard. Permis : aucun permis réglementaire requis, seule une clause de confidentialité
contractuelle si les journaux contiennent des données sensibles. Vrai blocage : obtenir un premier
site pilote et convaincre un CAB de prendre au sérieux un pré-rapport tiers.

## 8. La preuve se retourne-t-elle contre l'acheteur
Oui, potentiellement. Un rapport précis des non conformités devient une preuve documentaire que le
site savait et n'a pas corrigé, exploitable s'il atteint l'auditeur ou un tiers. L'architecture
garde le rapport strictement privé au site (jamais transmis automatiquement au certificateur),
laisse le site choisir ses corrections, et permet la suppression du détail des écarts corrigés
plutôt qu'un historique immuable horodaté.

## 9. Test à moins de 2 000 dollars, deux semaines
Un site pilote (ferme moyenne, hors majors) prêt à partager un ou deux ans de journaux réels et sa
dernière grille d'audit. Prototype sur 10 à 15 indicateurs choisis. Critère chiffré : au moins 80 %
classés correctement (couvert, manquant, ambigu) en accord avec un connaisseur du référentiel (le
site ou un consultant freelance payé sur le budget restant), coût API sous 200 dollars.

## 10. Incertitudes et question au client
Incertain : coût réel ASC et BAP (non trouvé, contrairement à MSC) ; volonté des sites de partager
leurs journaux ; acceptation par les CAB d'un pré-rapport externe ; ampleur du risque de la
section 8. Question au client : accepteriez vous de partager un échantillon anonymisé de vos
journaux et les écarts de votre dernier audit pour un test gratuit, et combien d'heures internes ou
de consultant dépensez vous aujourd'hui pour préparer un audit ASC, MSC ou BAP.

---

**Résumé en 8 lignes.** AuditPrep cartographie les journaux d'un site contre les grilles publiques
ASC, MSC et BAP avant l'audit humain. L'angle retenu est un gabarit réglementaire versionné et
sourcé, absent des outils génériques trouvés (iAuditor, Intelex, EcoVadis ne couvrent pas ces
référentiels) et non répliqué par un LLM nu. L'angle « vendre aussi aux certificateurs » tombe : ils
facturent au temps, un outil qui accélère leur revue réduit leurs honoraires. L'acheteur solide est
le responsable qualité d'un site moyen, dépense actuelle 15 000 à 120 000 USD par audit MSC (ASC et
BAP non chiffrés). Le vrai risque n'est pas technique mais probatoire : un rapport d'écarts trop
précis peut se retourner contre le site, d'où un produit strictement privé. Le lien avec la
préservation de l'océan reste indirect : la littérature académique doute de l'efficacité
environnementale réelle d'ASC et MSC eux mêmes, donc mieux préparer un audit fiabilise le dossier et
libère du temps d'auditeur, sans améliorer la norme. Test proposé : un site pilote, 80 % de
classement correct validé par un connaisseur, sous 2 000 dollars.
