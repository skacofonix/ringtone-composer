/**
 * French texts: the reference dictionary. Other languages must provide the
 * same keys (checked by TypeScript through the `Messages` type).
 * In help texts, `backticks` mark a key and are shown as <kbd>.
 */
export const fr = {
  common: {
    play: 'Jouer',
    stop: 'Stop',
    close: 'Fermer',
    untitled: 'Sans titre',
    clearAllConfirm: 'Effacer toutes les notes ?',
  },
  app: {
    modes: 'Mode de saisie',
    undo: 'Annuler',
    redo: 'Rétablir',
    retro: 'Rétro 3310',
    modern: 'Moderne',
    openShared: (shared: string, current: string) =>
      `Ouvrir la sonnerie partagée « ${shared} » ?\n« ${current} » sera remplacée.`,
  },
  toolbar: {
    classics: 'Classiques',
    share: 'Partager',
    ringtone: 'Sonnerie',
    more: 'Plus',
  },
  menu: {
    title: 'Plus',
    rtttl: 'Texte RTTTL',
    keys: 'Touches Nokia',
    help: 'Aide',
    clearAll: 'Tout effacer',
    language: 'Langue',
    theme: 'Thème',
    version: (version: string) => `Version ${version}`,
    releases: 'Nouveautés',
  },
  themes: {
    system: 'Auto',
    light: 'Clair',
    dark: 'Sombre',
  },
  summary: {
    edit: "Modifier le nom, le tempo et l'instrument",
    title: 'Réglages de la mélodie',
    done: 'OK',
  },
  help: {
    retro: 'Mode rétro 3310',
    modern: 'Mode moderne',
  },
  settings: {
    name: 'Nom',
    tempo: 'Tempo',
    instrument: 'Instrument',
  },
  instruments: {
    buzzer: 'Buzzer (Nokia)',
    chiptune: 'Console 8-bit',
    flute: 'Flûte',
    organ: 'Orgue',
    musicBox: 'Boîte à musique',
    electricPiano: 'Piano électrique',
  },
  rtttl: {
    hint: "Colle un RTTTL ici pour l'importer.",
    copy: 'Copier',
    copied: 'Copié !',
    copyFailed: 'Copie impossible : sélectionne le texte',
    error: (message: string, position: number) =>
      `${message} (position ${position})`,
    errors: {
      format: () => 'Format attendu : « nom:d=4,o=6,b=63:notes »',
      parameter: (d: string) => `Paramètre invalide « ${d} »`,
      defaultDuration: (d: string) => `Durée par défaut invalide : ${d}`,
      defaultOctave: (d: string) => `Octave par défaut invalide : ${d}`,
      tempo: (d: string) => `Tempo invalide : ${d}`,
      note: (d: string) => `Note invalide « ${d} »`,
      duration: (d: string) => `Durée invalide « ${d} »`,
      sharpRest: (d: string) => `Un silence ne peut pas être dièse « ${d} »`,
      doubleSharp: (d: string) => `Double dièse « ${d} »`,
      octave: (d: string) => `Octave invalide « ${d} »`,
      noSharp: (d: string) => `« ${d} » n'existe pas (pas de dièse sur e et b)`,
    },
  },
  modern: {
    score: 'Partition',
    emptyScore: 'Touche le piano pour ajouter des notes',
    rest: 'Silence',
    deleteNote: 'Effacer la note avant le curseur',
    keyboardOctaves: 'Octaves du clavier',
    octaves: (low: number, high: number) => `Octaves ${low}–${high}`,
    lowerOctave: 'Octave plus grave',
    higherOctave: 'Octave plus aiguë',
    piano: 'Clavier de piano',
    nextDuration: 'Durée des prochaines notes',
    durations: {
      1: 'Ronde',
      2: 'Blanche',
      4: 'Noire',
      8: 'Croche',
      16: 'Double croche',
      32: 'Triple croche',
    },
    dotted: 'Note pointée',
    dottedTitle: 'Note pointée (durée × 1,5)',
    edit: {
      label: 'Modifier la note courante',
      shorter: 'Plus courte',
      longer: 'Plus longue',
      dotted: 'Pointée',
      sharp: 'Dièse',
      octaveDown: 'Octave en dessous',
      octaveUp: 'Octave au-dessus',
    },
    help: [
      'Touche le piano pour ajouter la note au curseur.',
      'Choisis la durée des prochaines notes ; `•` pour une note pointée.',
      'Touche une note de la partition pour placer le curseur après elle, touche-la encore pour le placer avant.',
      '`⌫` efface la note avant le curseur.',
      'La barre sous la partition modifie la note courante (celle avant le curseur) : durée `−` / `+`, pointée `•`, dièse `♯`, octave `↓` / `↑`.',
    ],
  },
  retro: {
    keys: {
      '1': 'Do',
      '2': 'Ré',
      '3': 'Mi',
      '4': 'Fa',
      '5': 'Sol',
      '6': 'La',
      '7': 'Si',
      '8': 'Plus court',
      '9': 'Plus long',
      '*': 'Octave',
      '0': 'Silence',
      '#': 'Dièse',
    },
    moveCursor: 'Déplacer le curseur',
    previousNote: 'Note précédente',
    nextNote: 'Note suivante',
    clearKey: 'Effacer (appui long : tout effacer)',
    screen: (name: string, count: number, bpm: number) =>
      `Écran : ${name}, ${count} notes, tempo ${bpm}`,
    help: [
      '`1` à `7` : notes do à si. `0` : silence.',
      'Appui long sur une note : note pointée (durée × 1,5).',
      '`8` / `9` : note courante plus courte / plus longue.',
      '`*` : octave suivante, `#` : dièse.',
      '`C` : effacer la note, appui long : tout effacer. ◀ ▶ : déplacer le curseur.',
      'Grande touche centrale : jouer / arrêter.',
      "Au clavier d'ordinateur : chiffres, `*`, `#`, `Retour arrière`, flèches et `Entrée`. Garder une touche enfoncée = appui long.",
    ],
  },
  keys: {
    intro:
      'Les touches à taper dans le Compositeur d’un vrai Nokia 3310 pour obtenir cette mélodie. Tu peux aussi coller une séquence publiée dans un magazine pour l’importer.',
    legend:
      '`1`–`7` : notes, `0` : silence, `(5)` : appui long (note pointée), `8` / `9` : plus court / plus long, `#` : dièse, `*` : octave.',
    hint: 'Colle une séquence ici pour l’importer.',
    approximated:
      'Certaines notes sont hors de portée du 3310 : elles sont ramenées à l’octave la plus proche.',
    copy: 'Copier',
    copied: 'Copié !',
    copyFailed: 'Copie impossible : sélectionne le texte',
    error: (message: string, position: number) =>
      `${message} (position ${position})`,
    errors: {
      invalidKey: (d: string) => `Touche inconnue « ${d} »`,
      invalidLongPress: (d: string) =>
        `Appui long invalide « ${d} » : seules (0) à (7) existent`,
    },
  },
  catalog: {
    title: 'Classiques',
    listen: (title: string) => `Écouter ${title}`,
    stopListening: (title: string) => `Arrêter ${title}`,
    replace: (current: string, next: string) =>
      `Remplacer « ${current} » par « ${next} » ?`,
    note: 'Uniquement des œuvres du domaine public. Toucher un titre le charge dans le compositeur.',
  },
  share: {
    title: 'Partager',
    intro: (name: string) =>
      `Ce lien ouvre l'application avec « ${name} ». La mélodie est dans le lien lui-même, rien n'est envoyé sur un serveur.`,
    linkLabel: 'Lien de partage',
    message: (name: string) => `Écoute ma sonnerie « ${name} »`,
    share: 'Partager…',
    copyLink: 'Copier le lien',
    copied: 'Lien copié !',
    shareFailed: 'Partage impossible, copie le lien.',
    copyFailed: 'Copie impossible : sélectionne le lien.',
    localhost:
      "Attention : ce lien pointe vers ta machine (localhost). Il ne marchera pour les autres qu'une fois l'application publiée.",
  },
  export: {
    title: 'Utiliser comme sonnerie',
    intro: (name: string, seconds: string) =>
      `« ${name} » dure ${seconds} s. Le fichier exporté est au format WAV, lisible par Android et par GarageBand sur iPhone.`,
    tooLong: (max: number) =>
      `Plus de ${max} s : l'iPhone coupera la sonnerie.`,
    create: 'Créer le fichier audio',
    creating: 'Création…',
    shareFile: 'Partager / Enregistrer…',
    download: (file: string) => `Télécharger ${file}`,
    failed: (reason: string) => `Création du fichier impossible : ${reason}`,
    shareFailed: 'Partage impossible : utilise « Télécharger ».',
    defaultFileName: 'sonnerie',
    instrument: (name: string) => `Instrument : ${name}.`,
    midiSummary: 'Fichier MIDI (pour aller plus loin)',
    midiIntro:
      "Le fichier .mid s'ouvre dans GarageBand, MuseScore ou tout logiciel de musique, pour retravailler la mélodie avec l'instrument de ton choix.",
    midiDownload: (file: string) => `Télécharger ${file}`,
    androidSummary: 'Sur Android',
    android: [
      'Télécharge le fichier.',
      'Ouvre Paramètres → Sons (et vibrations) → Sonnerie du téléphone.',
      'Choisis « Ajouter » ou « + » (selon le modèle), puis sélectionne le fichier dans Téléchargements.',
    ],
    iphoneSummary: 'Sur iPhone (avec GarageBand, gratuit)',
    iphone: [
      '« Partager / Enregistrer… » → « Enregistrer dans Fichiers ».',
      "Dans GarageBand, crée un projet « Enregistreur audio », passe en vue pistes, touche l'icône des boucles → « Fichiers » et glisse le fichier sur la piste.",
      'Reviens à « Mes morceaux », appui long sur le projet → Partager → Sonnerie → Exporter.',
      'Puis Réglages → Sons et vibrations → Sonnerie.',
    ],
  },
};

export type Messages = typeof fr;
