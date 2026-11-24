// Datos del juego: zonas, guardianes y retos de inglés.
// Los tipos de pregunta nuevos (escuchar, parejas, escribir) se suman a los originales.

export type Q =
  | {
      tipo: "clasificar";
      texto: string;
      pista?: string;
      palabras: { texto: string; futuro: boolean }[];
      explicacion: string;
      correcta: string;
    }
  | {
      tipo: "ordenar";
      texto: string;
      contexto?: string;
      pista?: string;
      correcta: string;
      /** Fragmento fijo antes / después de las fichas que coloca el jugador */
      antes?: string;
      despues?: string;
      extras?: string[];
      explicacion: string;
    }
  | {
      tipo: "elegir";
      texto: string;
      pista?: string;
      imagen?: string;
      opciones: string[];
      correcta: string;
      explicacion: string;
    }
  | { tipo: "hacha"; texto: string; correcta: string; explicacion: string }
  | {
      tipo: "esquivar";
      texto: string;
      lado: "izquierda" | "derecha";
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "esquiva-frase";
      texto: string;
      opciones: string[];
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "hechizo";
      texto: string;
      frase: string[];
      insertar: string;
      posicion: number;
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "promesa";
      texto: string;
      contexto?: string;
      nodos: string[];
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "zona";
      texto: string;
      senal?: { imagen?: string; alt: string; luz?: "roja" };
      zonas: { texto: string; icono: string }[];
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "escuchar";
      texto: string;
      audio: string;
      opciones: string[];
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "parejas";
      texto: string;
      pares: { en: string; es: string }[];
      correcta: string;
      explicacion: string;
    }
  | {
      tipo: "escribir";
      texto: string;
      antes: string;
      despues: string;
      pista?: string;
      correcta: string;
      alternativas?: string[];
      explicacion: string;
    };

export type Leccion = {
  titulo: string;
  puntos: { en: string; es: string }[];
  consejo: string;
};

export type Nivel = {
  numero: 1 | 2 | 3 | 4;
  nombre: string;
  tema: string;
  guardian: string;
  fondo: string;
  arte: string;
  golpe: string;
  efecto: string;
  vida: number;
  dano: number;
  debilidad: AtaqueId;
  remate?: "solar" | "cruzado" | "sombras";
  derrota?: boolean;
  color: string;
  leccion: Leccion;
  preguntas: Q[];
};

export type AtaqueId = "hachazo" | "barrido" | "escudo" | "rayo" | "fenix";

export type Ataque = {
  id: AtaqueId;
  nombre: string;
  dano: number;
  descripcion: string;
  magia?: boolean;
  curacion?: number;
  efecto: string;
  icono: string;
};

export const ATAQUES: Ataque[] = [
  { id: "hachazo", nombre: "Hachazo descendente", dano: 24, descripcion: "Golpe pesado", efecto: "/images/bosque-del-alba/hachazo.svg", icono: "🪓" },
  { id: "barrido", nombre: "Barrido de hacha", dano: 22, descripcion: "Corte veloz", efecto: "/images/caballero/barrido.svg", icono: "🌀" },
  { id: "escudo", nombre: "Golpe de escudo", dano: 21, descripcion: "Reduce el próximo golpe", efecto: "/images/caballero/escudo.svg", icono: "🛡️" },
  { id: "rayo", nombre: "Rayo del Alba", dano: 27, descripcion: "Relámpago · 1 uso por duelo", magia: true, efecto: "/images/magia/rayo.svg", icono: "⚡" },
  { id: "fenix", nombre: "Llama del Fénix", dano: 20, descripcion: "Cura hasta 12 de vida", magia: true, curacion: 12, efecto: "/images/magia/fenix.svg", icono: "🔥" },
];

export const NIVELES: Nivel[] = [
  {
    numero: 1,
    nombre: "Bosque del Alba",
    tema: "Introducción al futuro",
    guardian: "Grifo del Alba",
    fondo: "/images/arenas/bosque-del-alba-animado.svg",
    arte: "/images/personajes-mate/grifo",
    golpe: "Zarpazo del Alba",
    efecto: "/images/bosque-del-alba/zarpazo.svg",
    vida: 114,
    dano: 23,
    debilidad: "hachazo",
    derrota: true,
    color: "#7bd88f",
    leccion: {
      titulo: "Expresiones de tiempo: futuro y pasado",
      puntos: [
        { en: "tomorrow · next week · tonight", es: "mañana · la próxima semana · esta noche (futuro)" },
        { en: "yesterday · last night · two days ago", es: "ayer · anoche · hace dos días (pasado)" },
        { en: "We are going to explore the forest next week.", es: "Vamos a explorar el bosque la próxima semana." },
        { en: "The patrol leaves in two days.", es: "La patrulla sale dentro de dos días." },
      ],
      consejo: "«In + tiempo» mira hacia adelante (in two days). «Tiempo + ago» mira hacia atrás (two days ago).",
    },
    preguntas: [
      {
        tipo: "clasificar",
        texto: "Drag future words to the hero and past words to the monster.",
        pista: "Tomorrow, next week y tonight miran hacia adelante.",
        palabras: [
          { texto: "tomorrow", futuro: true },
          { texto: "yesterday", futuro: false },
          { texto: "next week", futuro: true },
          { texto: "last night", futuro: false },
          { texto: "tonight", futuro: true },
          { texto: "two days ago", futuro: false },
        ],
        correcta: "Héroe: tomorrow, next week, tonight · Monstruo: yesterday, last night, two days ago",
        explicacion: "Tomorrow, next week y tonight indican futuro. Yesterday, last night y two days ago indican pasado.",
      },
      {
        tipo: "ordenar",
        texto: "Put the expedition plan in order.",
        contexto: "Planeamos explorar el bosque la próxima semana.",
        correcta: "We are going to explore the forest next week.",
        extras: ["was"],
        pista: "Empieza con el sujeto: We…",
        explicacion: "Estructura: sujeto + are going to + verbo + expresión de tiempo.",
      },
      {
        tipo: "elegir",
        texto: "Which phrase refers to the future?",
        opciones: ["Yesterday", "Next week", "Last night"],
        correcta: "Next week",
        explicacion: "Next week significa «la próxima semana».",
      },
      {
        tipo: "hacha",
        texto: "The griffin will strike!",
        correcta: "Cut all three energy balls.",
        explicacion: "Cortaste las tres bolas de energía antes de que te alcanzaran.",
      },
      {
        tipo: "escuchar",
        texto: "Listen. When does the patrol leave?",
        audio: "The patrol leaves in two days.",
        opciones: ["Two days ago", "In two days", "Yesterday"],
        correcta: "In two days",
        explicacion: "«In two days» significa «dentro de dos días».",
      },
      {
        tipo: "ordenar",
        texto: "Write the time expression for the next patrol.",
        contexto: "La patrulla sale dentro de 48 horas. Usa la palabra days.",
        antes: "The patrol leaves",
        despues: ".",
        correcta: "The patrol leaves in two days.",
        extras: ["ago"],
        explicacion: "In two days significa «dentro de dos días».",
      },
      {
        tipo: "parejas",
        texto: "Match each time expression with its meaning.",
        pares: [
          { en: "tomorrow", es: "mañana" },
          { en: "yesterday", es: "ayer" },
          { en: "next week", es: "la próxima semana" },
          { en: "tonight", es: "esta noche" },
        ],
        correcta: "Todas las parejas",
        explicacion: "Tomorrow = mañana · yesterday = ayer · next week = la próxima semana · tonight = esta noche.",
      },
      {
        tipo: "escribir",
        texto: "Type the missing word.",
        antes: "I am",
        despues: "to check the gate tonight.",
        pista: "Es el verbo de movimiento en ‘be going to’.",
        correcta: "going",
        explicacion: "«Am going to» expresa un plan que el caballero ya tiene.",
      },
    ],
  },
  {
    numero: 2,
    nombre: "Puente del Río",
    tema: "Be going to",
    guardian: "Basilisco del Río",
    fondo: "/images/arenas/puente-del-rio-animado.svg",
    arte: "/images/personajes-mate/rio",
    golpe: "Coletazo del Río",
    efecto: "/images/jefes/rio/coletazo.svg",
    vida: 117,
    dano: 25,
    debilidad: "escudo",
    remate: "cruzado",
    color: "#6ec6ff",
    leccion: {
      titulo: "Be going to: planes y predicciones",
      puntos: [
        { en: "I am going to cross the bridge.", es: "Voy a cruzar el puente. (plan)" },
        { en: "He is not going to cross the bridge.", es: "Él no va a cruzar el puente. (negativa)" },
        { en: "Look! It is going to fall.", es: "¡Mira! Se va a caer. (predicción con evidencia)" },
        { en: "I am · you are · he/she/it is · we/they are", es: "Formas de be: am · are · is · are" },
      ],
      consejo: "Después de «going to» siempre va el verbo en forma base: going to attack, going to fall.",
    },
    preguntas: [
      {
        tipo: "ordenar",
        texto: "Cancel the crossing. Make the sentence negative.",
        contexto: "Modelo: He is going to cross the bridge.",
        correcta: "He is not going to cross the bridge.",
        extras: ["does"],
        pista: "«not» va justo después de is.",
        explicacion: "Coloca not después de is para formar la negativa.",
      },
      {
        tipo: "esquivar",
        texto: "The basilisk is going to attack on the left!",
        lado: "izquierda",
        correcta: "Move right.",
        explicacion: "On the left indica que el ataque viene por la izquierda. Mueve al héroe a la derecha.",
      },
      {
        tipo: "elegir",
        texto: "We ___ going to cross the river.",
        opciones: ["are", "am", "is"],
        correcta: "are",
        explicacion: "Con we se usa are going to.",
      },
      {
        tipo: "hacha",
        texto: "The basilisk is going to attack!",
        correcta: "Cut all three energy balls.",
        explicacion: "Cortaste las tres bolas de energía antes de que te alcanzaran.",
      },
      {
        tipo: "esquiva-frase",
        texto: "It ___ attack!",
        opciones: ["are going to", "is going to", "am going to"],
        correcta: "is going to",
        explicacion: "Con it usamos is going to seguido del verbo base: It is going to attack!",
      },
      {
        tipo: "escribir",
        texto: "Type the correct form of be.",
        antes: "They",
        despues: "going to build a boat.",
        pista: "Con they usamos la misma forma que con we.",
        correcta: "are",
        explicacion: "They are going to build a boat. Con they usamos are.",
      },
      {
        tipo: "ordenar",
        texto: "Warn the knight using be going to.",
        contexto: "¡Mira! Una piedra suelta se desliza del puente.",
        antes: "It",
        despues: "fall.",
        correcta: "It is going to fall.",
        extras: ["are"],
        explicacion: "La piedra ya se está moviendo: usamos is going to para predecir lo que va a pasar a partir de esa pista.",
      },
      {
        tipo: "escuchar",
        texto: "Listen. Which way should the knight move?",
        audio: "The basilisk is going to attack on the right!",
        opciones: ["Move left", "Move right", "Stay still"],
        correcta: "Move left",
        explicacion: "On the right: el ataque viene por la derecha, así que te mueves a la izquierda.",
      },
    ],
  },
  {
    numero: 3,
    nombre: "Torre del Viento",
    tema: "Will",
    guardian: "Águila de la Tormenta",
    fondo: "/images/arenas/torre-del-viento-animado.svg",
    arte: "/images/personajes-mate/viento",
    golpe: "Picado de la Tormenta",
    efecto: "/images/jefes/viento/picado.svg",
    vida: 120,
    dano: 27,
    debilidad: "barrido",
    remate: "solar",
    color: "#c9a8ff",
    leccion: {
      titulo: "Will: promesas y predicciones",
      puntos: [
        { en: "I will help you.", es: "Te ayudaré. (promesa)" },
        { en: "I think the storm will reach the tower.", es: "Creo que la tormenta llegará a la torre. (predicción)" },
        { en: "The hero will not fall. (won't)", es: "El héroe no caerá. (negativa)" },
        { en: "I'll = I will", es: "Contracción de I will" },
      ],
      consejo: "Will no cambia con el sujeto (I will, he will, they will) y siempre va seguido del verbo base.",
    },
    preguntas: [
      {
        tipo: "ordenar",
        texto: "Complete the prediction about the storm.",
        contexto: "Usa el verbo reach.",
        antes: "I think the",
        despues: "the tower tonight.",
        correcta: "I think the storm will reach the tower tonight.",
        extras: ["reaches", "to"],
        pista: "Faltan: storm, will y reach.",
        explicacion: "Después de will usamos el verbo base: reach.",
      },
      {
        tipo: "hechizo",
        texto: "Make the spell negative. Place NOT in the right gap.",
        frase: ["The", "hero", "will", "fall!"],
        insertar: "not",
        posicion: 3,
        correcta: "The hero will not fall.",
        explicacion: "Coloca not después de will para negar lo que anuncia el hechizo: The hero will not fall.",
      },
      {
        tipo: "elegir",
        texto: "I will ___ you.",
        opciones: ["helped", "helps", "help"],
        correcta: "help",
        explicacion: "Después de will va el verbo en su forma base: help.",
      },
      {
        tipo: "hacha",
        texto: "The eagle will strike!",
        correcta: "Cut all three energy balls.",
        explicacion: "Cortaste las tres bolas de energía antes de que te alcanzaran.",
      },
      {
        tipo: "promesa",
        texto: "Promise to protect the ally. Connect the right words.",
        contexto: "Promise you will protect me!",
        nodos: ["I", "will", "did", "protect you."],
        correcta: "I will protect you.",
        explicacion: "I will protect you expresa una promesa. Will va seguido del verbo base protect.",
      },
      {
        tipo: "parejas",
        texto: "Match the words from the tower.",
        pares: [
          { en: "promise", es: "promesa" },
          { en: "storm", es: "tormenta" },
          { en: "tower", es: "torre" },
          { en: "key", es: "llave" },
        ],
        correcta: "Todas las parejas",
        explicacion: "Promise = promesa · storm = tormenta · tower = torre · key = llave.",
      },
      {
        tipo: "escuchar",
        texto: "Listen. What does the knight promise?",
        audio: "I will return the key tomorrow.",
        opciones: ["To return the key", "To lose the key", "To buy a new key"],
        correcta: "To return the key",
        explicacion: "«I will return the key» significa «devolveré la llave».",
      },
      {
        tipo: "ordenar",
        texto: "Complete the knight's promise.",
        contexto: "Promete devolver la llave mañana. Usa will.",
        correcta: "I promise I will return the key tomorrow.",
        extras: ["did"],
        explicacion: "Will sirve para expresar un compromiso futuro. I'll es la contracción de I will.",
      },
    ],
  },
  {
    numero: 4,
    nombre: "Puerta Real",
    tema: "Traffic signs and rules",
    guardian: "Dragón de la Puerta Real",
    fondo: "/images/arenas/puerta-real-animado.svg",
    arte: "/images/personajes-mate/real",
    golpe: "Aliento Escarlata",
    efecto: "/images/jefes/real/aliento.svg",
    vida: 126,
    dano: 31,
    debilidad: "escudo",
    remate: "sombras",
    color: "#ff8a6b",
    leccion: {
      titulo: "Señales y reglas de tránsito",
      puntos: [
        { en: "STOP → Stop at the line.", es: "STOP → Detente en la línea." },
        { en: "YIELD → Wait and give way.", es: "CEDA EL PASO → Espera y cede el paso." },
        { en: "NO ENTRY → You cannot go in.", es: "PROHIBIDO EL PASO → No puedes entrar." },
        { en: "Red light → Stop before the crossing. Put on your helmet!", es: "Luz roja → Detente antes del cruce. ¡Ponte el casco!" },
      ],
      consejo: "Los verbos de las reglas van en imperativo: Stop! Wait! Put on your helmet!",
    },
    preguntas: [
      {
        tipo: "zona",
        texto: "Bring the rider to a complete stop.",
        senal: { imagen: "/images/signs/stop.svg", alt: "Octágono rojo con la palabra STOP" },
        zonas: [
          { texto: "Go past the line", icono: "↑" },
          { texto: "Stop at the line", icono: "▬" },
          { texto: "Go through the crossing", icono: "↑" },
        ],
        correcta: "Stop at the line",
        explicacion: "Ante STOP, detente por completo en la línea.",
      },
      {
        tipo: "zona",
        texto: "Let the other rider go first.",
        senal: { imagen: "/images/signs/yield.svg", alt: "Triángulo invertido con borde rojo" },
        zonas: [
          { texto: "Enter first", icono: "↗" },
          { texto: "Overtake", icono: "↑" },
          { texto: "Wait and give way", icono: "◷" },
        ],
        correcta: "Wait and give way",
        explicacion: "Give way significa «ceder el paso».",
      },
      {
        tipo: "elegir",
        texto: "What does this sign mean?",
        imagen: "/images/signs/no-entry.svg",
        opciones: ["Go faster", "No entry", "Park here"],
        correcta: "No entry",
        explicacion: "Una señal roja con una barra blanca significa «prohibido el paso» (no entry).",
      },
      {
        tipo: "hacha",
        texto: "The dragon will breathe fire!",
        correcta: "Cut all three energy balls.",
        explicacion: "Cortaste las tres bolas de energía antes de que te alcanzaran.",
      },
      {
        tipo: "ordenar",
        texto: "Equip the rider before the ride.",
        contexto: "Escribe el objeto que protege la cabeza del jinete.",
        correcta: "Put on your helmet before the ride.",
        extras: ["puts"],
        explicacion: "Helmet significa «casco». Put on = ponerse.",
      },
      {
        tipo: "zona",
        texto: "Move the rider according to the traffic light.",
        senal: { alt: "Semáforo con la luz roja encendida", luz: "roja" },
        zonas: [
          { texto: "Move forward", icono: "↑" },
          { texto: "Stop before the crossing", icono: "▬" },
          { texto: "Change lanes", icono: "↔" },
        ],
        correcta: "Stop before the crossing",
        explicacion: "La luz roja indica que debes detenerte antes de entrar al cruce.",
      },
      {
        tipo: "parejas",
        texto: "Match the road words.",
        pares: [
          { en: "stop", es: "detenerse" },
          { en: "give way", es: "ceder el paso" },
          { en: "helmet", es: "casco" },
          { en: "crossing", es: "cruce" },
        ],
        correcta: "Todas las parejas",
        explicacion: "Stop = detenerse · give way = ceder el paso · helmet = casco · crossing = cruce.",
      },
      {
        tipo: "escuchar",
        texto: "Listen. Which sign is it?",
        audio: "Slow down and give way to other riders.",
        opciones: ["STOP", "Yield / Give way", "No entry"],
        correcta: "Yield / Give way",
        explicacion: "«Give way» significa «ceder el paso»: es la señal de Yield.",
      },
    ],
  },
];

export function getNivel(n: number) {
  return NIVELES.find((x) => x.numero === n);
}
