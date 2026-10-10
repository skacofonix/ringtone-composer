# Format RTTTL

**RTTTL** (_Ring Tone Text Transfer Language_) est le format texte créé par Nokia pour décrire des sonneries monophoniques.

## Structure

Trois sections séparées par `:`.

```
<nom>:<valeurs par défaut>:<notes>
Tetris:d=4,o=5,b=160:e6,8b,8c6,8d6,16e6,16d6,8c6,8b,a,8a,8c6,e6,8d6,8c6,b,8b,8c6,d6,e6,c6,a,2a
```

### 1. Nom

Le titre de la sonnerie. Historiquement limité à 10 caractères ; on l'accepte plus long en lecture et on le tronque éventuellement à l'export.

### 2. Valeurs par défaut

Une liste `clé=valeur` séparée par des virgules. Chaque clé est optionnelle.

| Clé | Signification                    | Valeurs                                    | Défaut si absent |
| --- | -------------------------------- | ------------------------------------------ | ---------------- |
| `d` | durée par défaut                 | 1, 2, 4, 8, 16, 32 (1 = ronde, 4 = noire…) | 4                |
| `o` | octave par défaut                | 4 à 7 (on tolère 3 à 8)                    | 6                |
| `b` | tempo en BPM (noires par minute) | 25 à 900 dans la spec d'origine            | 63               |

### 3. Notes

Une liste de notes séparées par des virgules :

```
[durée] note [#] [.] [octave] [.]
```

- `durée` : optionnelle, sinon `d`.
- `note` : `c d e f g a b` ou `p` pour un silence (_pause_). Certains fichiers utilisent `h` pour `b`, notation allemande.
- `#` : dièse. Les dièses valides sont `c# d# f# g# a#`.
- `.` : note pointée (durée × 1,5). Selon les sources, le point apparaît avant ou après l'octave : il faut accepter les deux.
- `octave` : optionnelle, sinon `o`.

## Calculs

- Durée d'une note en ms : `(60000 / b) * (4 / durée)`, × 1,5 si pointée.
- Fréquence : `440 * 2^((n - 69) / 12)` où `n` est le numéro MIDI. Ici on considère que l'octave RTTTL suit la convention scientifique (`a4` = 440 Hz). **À valider** sur des fichiers réels : certaines implémentations décalent d'une octave. La version C# de 2015 utilisait `a4` = 880 Hz. Ce choix tient dans une seule constante, `RTTTL_OCTAVE_SHIFT` dans `src/core/melody.ts`.

## Règles pour notre parseur

- Insensible à la casse ; ignorer les espaces et les retours à la ligne.
- Accepter `nom:notes` sans section de valeurs par défaut, et le dièse avant la note (`#f`), deux variantes que gérait la version de 2015.
- Tolérer les valeurs par défaut absentes ou partielles.
- Signaler les erreurs avec la position du caractère fautif, plutôt que d'ignorer silencieusement.
- Sérialisation canonique : choisir `d` et `o` les plus fréquents pour minimiser la taille, puis vérifier que `serialize(parse(x))` donne une mélodie équivalente.
