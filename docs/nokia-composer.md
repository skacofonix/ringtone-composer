# Le « Compositeur » des Nokia (3310 et contemporains)

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

**À valider :** la correspondance entre les octaves Nokia 1–3 et les octaves RTTTL (probablement 5–7, éventuellement 4–6).

## Clavier T9

| Touche | Action |
|---|---|
| `1` à `7` | insère `c d e f g a b` avec la durée et l'octave courantes |
| `0` | insère un silence |
| `8` | raccourcit la durée de la note courante (4 → 8 → 16…) |
| `9` | allonge la durée de la note courante (4 → 2 → 1…) |
| `*` | change l'octave de la note courante (1 → 2 → 3 → 1) |
| `#` | ajoute ou retire le dièse de la note courante |
| `C` / effacer | supprime la note avant le curseur |
| flèches (navi-roller) | déplacent le curseur dans la partition |

**À valider :** comment obtenir une note pointée (appuis répétés sur `8` ou `9` ?) et quel est l'effet exact d'un appui long.

## Écran du 3310

- LCD monochrome **84 × 48 pixels**, avec des pixels sombres sur un fond vert-gris rétroéclairé.
- Le compositeur affiche la partition sur quelques lignes, avec un curseur clignotant.
- Rendu prévu : un `<canvas>` en 84 × 48 mis à l'échelle sans lissage (`image-rendering: pixelated`), avec une petite police bitmap maison.

## Menu du compositeur (fidélité optionnelle)

- **Jouer** ;
- **Tempo** : valeurs prédéfinies ;
- **Envoyer** : chez nous, partage par lien ;
- **Effacer**, **Quitter**.
