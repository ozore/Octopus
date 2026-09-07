# Mémoire de session, c4-greenmarine

Compteur WebSearch : 6/6 utilisés (quota respecté).

## Requêtes qui ont marché
1. `Green Marine verification fee cost auditor "Green Marine" certification price` : pas de tarif exact, mais a mené vers certification_policy.pdf et deux cabinets vérificateurs (EA, Blackbird EHS).
2. `Green Marine sustainability coordinator job description annual self-evaluation hours` : a confirmé la fenêtre janvier à mi-mars pour l'autoévaluation.
3. `"Green Marine" external verification "verifier" cost consultant hired port terminal audit` : a trouvé les pages de service d'EA et Blackbird EHS, sans tarif.
4. `ESG reporting software automation port terminal AI compliance pricing per year` : bonne fourchette de marché ESG générique (3 000 à 150 000 $ US/an selon taille).
5. `"Green Marine" self-evaluation report preparation weeks hours consultant help submission` : a confirmé qu'ECO Canada a été mandaté pour réviser le processus de vérification, sans détail d'heures.
6. `AI copilot audit preparation certification compliance ESG "sustainability report" startup 2025 2026` : a confirmé qu'aucun outil maritime spécifique n'existe, mais que le marché ESG générique revendique déjà 70 % de gain de temps et un chaînage preuve-affirmation, ce qui affaiblit l'angle du simple gabarit tracé.

## WebFetch utiles (non comptés dans le quota)
- certification_policy.pdf (via Read après échec WebFetch sur binaire) : seule source ayant livré du texte structuré exploitable, confirme la règle de progression annuelle obligatoire et l'interdiction de conflit d'intérêt entre conseil et vérification. Aucun montant en dollars.
- eaest.com/green-marine-verification/ et blackbirdehs.ca (page verification) : décrivent le processus (visite, entretiens, revue documentaire) mais aucun des deux ne publie de prix en ligne, recommandation de contacter directement.
- green-marine.org/certification/verifiers/ : confirme le cycle biennal, renvoie vers un Verifiers Handbook non consulté cette passe.

## Sources mortes ou bloquées
- WebFetch direct sur le PDF certification_policy.pdf a d'abord échoué (contenu binaire non lisible par le modèle rapide de WebFetch) ; contournement : le fichier téléchargé automatiquement par WebFetch a été relu avec l'outil Read, qui gère les PDF nativement. Leçon à répéter dans les prochaines passes.
- green-marine.org/about/frequently-asked-questions/ : HTTP 404 au moment du WebFetch, alors que WebSearch l'indexe encore, page probablement déplacée ou renommée.

## Leçons
- Le tarif de vérification externe Green Marine (frais de vérificateur, cotisation annuelle) est introuvable par recherche web ouverte, ni sur green-marine.org, ni chez les cabinets vérificateurs tiers qui ne publient pas leurs prix. Il faudra le demander directement à un coordinateur ou à Green Marine pour la prochaine passe.
- Quand WebFetch renvoie un PDF binaire illisible, il le sauvegarde quand même sur disque (chemin donné dans la sortie) : relire ce fichier avec l'outil Read plutôt que de considérer la source comme morte.
- Le marché ESG générique (hors maritime) est déjà mature et revendique des gains de temps et une traçabilité preuve-affirmation comparables à l'angle A envisagé au départ ; cela a fait tomber cet angle comme différenciateur autonome pendant cette passe, au profit de la mémoire longitudinale par site (angle B).
