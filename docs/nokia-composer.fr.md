# Le « Compositeur » des Nokia (3310 et contemporains)

[English](nokia-composer.md) · **Français**

Ce document sert de référence pour le **mode rétro**. Les points marqués **À valider** doivent être confirmés, par exemple avec un vrai 3310, un émulateur ou des vidéos d'époque, avant d'être figés dans le code.

## Notation affichée à l'écran

Chaque note s'écrit `<durée><#?><note><octave>`, séparée par des espaces :

```
4c1 8#d2 16g2 2- 4.a1
```

- durée : `1 2 4 8 16 32` ;
- `.` après la durée : note pointée ;
- `#` : dièse ;
- note : `c d e f g a b`, ou `-` pour un silence ;
- octave : `1`, `2` ou `3`.

Correspondance avec RTTTL : **octave Nokia = octave RTTTL − 3**, donc Nokia 1 = RTTTL 4. C'est ce que faisait la version C# de 2015 (`NokiaComposerConverter`, `OffsetScale = 3`), qui acceptait les octaves Nokia 1 à 4. La position du point est incohérente dans l'ancien code : le parseur l'attendait avant l'octave (`8#f.2`), l'export l'écrivait après (`8#f2.`). On accepte les deux.

## Clavier T9

| Touche                | Action                                                     |
| --------------------- | ---------------------------------------------------------- |
| `1` à `7`             | insère `c d e f g a b` avec la durée et l'octave courantes |
| `0`                   | insère un silence                                          |
| `8`                   | raccourcit la durée de la note courante (4 → 8 → 16…)      |
| `9`                   | allonge la durée de la note courante (4 → 2 → 1…)          |
| `*`                   | monte l'octave de la note courante (1 → 2 → 3 → 1)         |
| `#`                   | ajoute ou retire le dièse de la note courante              |
| `C` / effacer         | supprime la note avant le curseur                          |
| flèches (navi-roller) | déplacent le curseur dans la partition                     |

**Note pointée :** obtenue par un **appui long** sur la touche de la note. La version de 2015 notait l'appui long avec des parenthèses : `(5)`.

**À valider :** le comportement exact de `*` en fin de cycle (retour à 1 ou blocage), et la durée initiale sur un vrai 3310.

### Séquences de touches

Les magazines de l'époque publiaient les sonneries sous forme de touches à taper. La version de 2015 (`NokiaKeypressConverter`) savait les lire et les écrire, avec ces règles :

- état de départ : durée 8, octave Nokia 1 ;
- pour chaque note : la touche de la note (entre parenthèses si pointée), puis autant de `8` ou de `9` que nécessaire pour atteindre la durée voulue depuis la durée précédente, puis `#` si dièse, puis autant de `*` que nécessaire pour atteindre l'octave voulue ;
- la durée et l'octave courantes **sont conservées** d'une note à la suivante ;
- tempo par défaut du compositeur : 120 BPM.

Exemple : `5 9 (6) 8 #**`

L'application lit et écrit ces séquences (menu **Plus → Touches Nokia**, code dans `src/core/keypress.ts`). La lecture rejoue les touches sur la même machine à états T9 que le clavier rétro. L'écriture donne les touches pour taper une mélodie sur un vrai 3310 ; les octaves hors de portée du Compositeur (RTTTL 7) sont ramenées à l'octave Nokia 3, et l'application le signale.

## Écran du 3310

- LCD monochrome **84 × 48 pixels**, avec des pixels sombres sur un fond vert-gris rétroéclairé.
- Le compositeur affiche la partition sur quelques lignes, avec un curseur clignotant.
- Rendu dans l'application : un `<canvas>` qui peint une image 84 × 48 calculée par `src/ui/retro/screen.ts`, avec une police bitmap 5×7 maison (`src/ui/retro/font.ts`).

## Menu du compositeur (fidélité optionnelle)

- **Jouer** ;
- **Tempo** : valeurs prédéfinies ;
- **Envoyer** : chez nous, partage par lien ;
- **Effacer**, **Quitter**.

## Choix d'implémentation (`src/core/nokia.ts`)

Ces choix sont à corriger si un vrai 3310 dit autre chose :

- Notation affichée : durée, point, dièse, note, octave, par exemple `8.#f2`. Un silence s'écrit `16-` ou `2.-`.
- Une nouvelle note reprend la durée de la note précédente et l'octave du dernier `Tone`. La toute première note part de `NOKIA_START` (durée 8, octave Nokia 1).
- `#` sur `e` ou `b`, ou `*`/`#` sur un silence : sans effet.
- `*` après l'octave 3 revient à 1. Une octave importée hors plage (RTTTL 7) revient aussi à 1.
- Appui long sur `C` : efface tout, après confirmation (il n'y a pas d'annulation).
- Clavier d'ordinateur : maintenir une touche enfoncée équivaut à un appui long, grâce à la répétition automatique du clavier.
