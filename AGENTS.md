# AGENTS.md

Guide de référence pour les agents de code (Claude Code, Codex, Copilot…) et les humains qui contribuent à **RingtoneComposer**.
Ce fichier est la source de vérité ; `CLAUDE.md` l'importe.

## Le projet

Un compositeur de sonneries façon Nokia des années 2000 (3310), sous forme de **PWA** installable sur Android et iPhone.

L'utilisateur peut :

1. **Composer** une mélodie monophonique, note par note ;
2. **L'écouter** avec un son « buzzer » (onde carrée) ;
3. **Sauvegarder / importer / partager** la mélodie au format texte **RTTTL** (y compris via un lien) ;
4. **Exporter un fichier audio** pour en faire sa sonnerie ;
5. **Charger un classique** depuis un catalogue préchargé (Nokia Tune, Tetris…).

Deux modes de saisie, branchés sur **le même modèle de mélodie** :

- **Rétro** : un Nokia 3310 avec écran LCD monochrome pixelisé et clavier T9, qui reproduit le « Compositeur » d'origine ;
- **Moderne** : un clavier de piano et une vue claire des notes et des durées.

## Stack

| Sujet                   | Choix                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Build / dev server      | [Vite](https://vite.dev)                                                            |
| Langage                 | TypeScript (`strict`)                                                               |
| UI                      | [Svelte 5](https://svelte.dev) (runes : `$state`, `$derived`, `$props`)             |
| PWA                     | `vite-plugin-pwa` (manifest + service worker, fonctionnement hors ligne)            |
| Audio                   | Web Audio API (`OscillatorNode` type `square`), `OfflineAudioContext` pour l'export |
| Tests                   | Vitest                                                                              |
| Qualité                 | ESLint (`typescript-eslint`, `eslint-plugin-svelte`) + Prettier                     |
| Gestionnaire de paquets | npm                                                                                 |
| Node                    | voir `.nvmrc`                                                                       |

Pas de backend. Tout tourne dans le navigateur. Le partage se fait par URL : le RTTTL est encodé dans le fragment `#`.

## Architecture

```
src/
  core/          # TypeScript pur, AUCUNE dépendance au DOM ni à Svelte, testé unitairement
    melody.ts      # modèle : Melody, Note = Tone | Rest, fréquences et durées
    editor.ts      # opérations d'édition (curseur d'insertion, ajout, suppression, tempo)
    rtttl.ts       # parse / serialize RTTTL (aller-retour sans perte)
    nokia.ts       # notation Composer Nokia + machine à états du clavier T9
    share.ts       # encodage/décodage de la mélodie dans l'URL
  audio/         # dépend de Web Audio API
    schedule.ts    # mélodie -> timeline (début, durée, fréquence), pur et testé
    player.ts      # lecture temps réel (oscillateur carré), aperçu d'une note
    buzzer.ts      # oscillateur carré + enveloppes, commun à la lecture et à l'export
    render.ts      # rendu hors ligne -> PCM (OfflineAudioContext)
    encoders/      # PCM -> WAV (maison)
  catalog/       # sonneries classiques en RTTTL (données)
  ui/
    retro/         # Nokia 3310 : LCD pixelisé + clavier T9
    modern/        # piano + éditeur de notes
    shared/        # état partagé (composition.svelte.ts), panneau RTTTL, export, partage
  App.svelte
  main.ts
docs/            # spécifications (RTTTL, notation Nokia…)
```

**Règle d'or :** l'UI ne manipule jamais directement une chaîne RTTTL. Elle travaille sur le modèle `Melody` de `src/core`, et le RTTTL n'est qu'un format d'entrée/sortie. Toute logique non visuelle (navigation dans le clavier T9, changement d'octave, calcul de durée…) va dans `core/` et est testée.

> L'arborescence ci-dessus reflète le code actuel. Le catalogue ne contient que des œuvres du domaine public : ne pas y ajouter de thèmes de films, de séries ou de jeux encore protégés.
>
> `ui/retro/` contient aussi une police bitmap 5×7 (`font.ts`) et un rendu pur de l'écran 84×48 (`screen.ts`, testé) que `Lcd.svelte` se contente de peindre. `ui/shared/storage.ts` sauvegarde la mélodie (en RTTTL) et le mode dans `localStorage`. Mets cette section à jour quand la structure réelle évolue.
>
> Une première version en C# (Xamarin, 2015) existe : <https://github.com/skacofonix/RingtoneComposer>. Son dossier `RingtoneComposer.Core/Business/Converter/` est une bonne référence métier (RTTTL, notation Nokia, séquences de touches). Les points utiles sont repris dans `docs/`.

## Commandes

```bash
npm install          # installer les dépendances
npm run dev          # serveur de dev (ajouter --host pour tester sur un téléphone du réseau local)
npm run build        # build de production dans dist/
npm run preview      # servir le build (nécessaire pour tester le service worker / la PWA)
npm test             # tests unitaires (Vitest)
npm run check        # vérification de types (svelte-check + tsc)
npm run lint         # ESLint
npm run format       # Prettier (écrit les fichiers)
npm run verify       # tout ce que vérifie la CI : format, lint, types, tests, build
```

Avant de considérer une tâche terminée, `npm run verify` doit passer. La CI GitHub Actions (`.github/workflows/ci.yml`) lance la même commande.

## Conventions

- **Langue :** le code, les identifiants et les commentaires sont en anglais. La documentation (`docs/`, README) et les textes de l'UI sont en français pour l'instant.
- TypeScript `strict`, pas de `any` sans justification en commentaire.
- On préfère les fonctions pures et les données immuables dans `core/`. Pas de classes si une fonction suffit.
- Composants Svelte petits, un composant par fichier, nommés en `PascalCase.svelte`.
- CSS dans les composants (scoped). Variables CSS globales (`--lcd-bg`, `--lcd-ink`…) dans un seul fichier de thème.
- Pas de nouvelle dépendance sans raison claire. Le projet doit rester compréhensible par un dev qui vient du vanilla JS.
- Commits courts, à l'impératif, en anglais (`Add RTTTL parser`).

## Points de domaine à connaître

- **RTTTL** : voir [docs/rtttl.md](docs/rtttl.md). Le parseur doit tolérer les variantes réelles (espaces, majuscules, `#` avant ou après l'octave, valeurs par défaut absentes).
- **Composer Nokia** : notation du type `8c2 8#d2 4g2`, avec un clavier T9 où les touches 1 à 7 donnent les notes et 0 le silence. Voir [docs/nokia-composer.md](docs/nokia-composer.md).
- **Audio iOS** : l'`AudioContext` doit être créé ou repris (`resume()`) dans un geste utilisateur (tap), sinon aucun son. Le mode silencieux de l'iPhone peut couper le son web.
- **Définir comme sonnerie** : impossible depuis le web. On exporte un fichier (MP3/OGG pour Android, `.m4r` pour iPhone, via GarageBand) et on guide l'utilisateur. Sur iOS, la durée max d'une sonnerie est d'environ 30 s.
- **Polyphonie** : hors périmètre pour la v1, le RTTTL étant monophonique par nature. Piste envisagée : plusieurs voix RTTTL jouées en parallèle (comme les sonneries polyphoniques des Nokia suivants), sans casser le modèle mono.

## Feuille de route

1. ✅ Squelette Vite + Svelte + TS + PWA, tests en place
2. ✅ `core/` : modèle `Melody`, parseur et sérialiseur RTTTL (+ tests)
3. ✅ Lecteur audio (onde carrée)
4. ✅ Mode moderne (piano)
5. ✅ Mode rétro Nokia 3310 (LCD + T9), sauvegarde automatique
6. ✅ Catalogue de classiques (domaine public)
7. ✅ Partage par lien (RTTTL dans le fragment `#rtttl=`)
8. ✅ Export audio WAV + guide « définir comme sonnerie » (Android, iPhone via GarageBand). Plus tard, si besoin : MP3 ou M4R.
9. Polyphonie (exploratoire)
10. Plus tard : emballage Capacitor pour Android (bouton natif « Définir comme sonnerie », Play Store)
