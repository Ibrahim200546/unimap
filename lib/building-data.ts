import { type Locale, type LocalizedText, text } from "@/lib/i18n";

export const UNIVERSITY = {
  name: {
    ru: "Жетісуский государственный университет имени Ильяса Жансугурова",
    kk: "Ілияс Жансүгіров атындағы Жетісу мемлекеттік университеті",
  },
  lat: 45.008698,
  lng: 78.349901,
  address: {
    ru: "Талдыкорган, ул. Ильяса Жансугурова, 187а",
    kk: "Талдықорған, Ілияс Жансүгіров көшесі, 187а",
  },
  proximityRadius: 80,
};

export type RoomType =
  | "classroom"
  | "office"
  | "restroom"
  | "stairs"
  | "entrance"
  | "corridor"
  | "library"
  | "cafeteria"
  | "lab"
  | "service"
  | "elevator";

export interface Room {
  id: string;
  label: string;
  name: LocalizedText;
  type: RoomType;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  description?: LocalizedText;
  keywords?: string[];
  accessible?: boolean;
  capacity?: number;
}

export interface FloorData {
  id: number;
  rooms: Room[];
  corridors: { x: number; y: number; width: number; height: number }[];
  walls: { x1: number; y1: number; x2: number; y2: number }[];
}

export const GRID = {
  width: 800,
  height: 500,
  cellSize: 10,
};

const floor1Rooms: Room[] = [
  {
    id: "A101",
    label: "A101",
    name: {
      ru: "Поточная аудитория A101",
      kk: "A101 лекциялық аудиториясы",
    },
    type: "classroom",
    floor: 1,
    x: 60,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Лекции, потоковые занятия и быстрые встречи групп.",
      kk: "Дәрістер, ағындық сабақтар және топтық қысқа кездесулер.",
    },
    keywords: ["lecture", "аудитория", "дәріс", "поток", "сынып"],
    accessible: true,
    capacity: 60,
  },
  {
    id: "LIBRARY",
    label: "A102",
    name: {
      ru: "Библиотека",
      kk: "Кітапхана",
    },
    type: "library",
    floor: 1,
    x: 200,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Тихая зона, выдача литературы и рабочие места с компьютерами.",
      kk: "Тыныш аймақ, кітап беру бөлімі және компьютерлері бар жұмыс орындары.",
    },
    keywords: ["library", "books", "кітап", "читальный зал", "оқу залы"],
    accessible: true,
    capacity: 40,
  },
  {
    id: "CAFE",
    label: "A103",
    name: {
      ru: "Столовая",
      kk: "Асхана",
    },
    type: "cafeteria",
    floor: 1,
    x: 340,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Горячее меню, кофе-бар и выдача предзаказов.",
      kk: "Ыстық ас мәзірі, кофе-бар және алдын ала тапсырысты беру нүктесі.",
    },
    keywords: ["food", "menu", "еда", "ас", "кафе", "асхана"],
    accessible: true,
    capacity: 48,
  },
  {
    id: "A104",
    label: "A104",
    name: {
      ru: "Аудитория A104",
      kk: "A104 аудиториясы",
    },
    type: "classroom",
    floor: 1,
    x: 60,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Практические занятия и мини-семинары.",
      kk: "Практикалық сабақтар мен шағын семинарлар.",
    },
    keywords: ["семинар", "practice", "практика", "тәжірибе"],
    accessible: true,
    capacity: 28,
  },
  {
    id: "SERVICE",
    label: "A105",
    name: {
      ru: "Студенческий сервисный центр",
      kk: "Студенттерге қызмет көрсету орталығы",
    },
    type: "service",
    floor: 1,
    x: 200,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Справки, документы, обращения и быстрые консультации.",
      kk: "Анықтамалар, құжаттар, өтініштер және жедел консультациялар.",
    },
    keywords: ["support", "help", "документы", "құжат", "справка", "қызмет"],
    accessible: true,
    capacity: 12,
  },
  {
    id: "COWORK",
    label: "A106",
    name: {
      ru: "Коворкинг и проектная зона",
      kk: "Коворкинг және жоба аймағы",
    },
    type: "service",
    floor: 1,
    x: 340,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Командная работа, короткие встречи и резервируемые слоты.",
      kk: "Командалық жұмыс, қысқа кездесулер және броньдалатын слоттар.",
    },
    keywords: ["coworking", "project room", "коворкинг", "жоба", "бронь"],
    accessible: true,
    capacity: 8,
  },
  {
    id: "DEAN",
    label: "A107",
    name: {
      ru: "Офис декана",
      kk: "Декан кеңсесі",
    },
    type: "office",
    floor: 1,
    x: 540,
    y: 40,
    width: 100,
    height: 110,
    description: {
      ru: "Административные вопросы и согласование документов.",
      kk: "Әкімшілік мәселелер және құжаттарды келісу.",
    },
    keywords: ["dean", "office", "администрация", "кеңсе", "деканат"],
    accessible: true,
    capacity: 4,
  },
  {
    id: "ELEVATOR1",
    label: "L1",
    name: {
      ru: "Лифт",
      kk: "Лифт",
    },
    type: "elevator",
    floor: 1,
    x: 650,
    y: 40,
    width: 90,
    height: 110,
    description: {
      ru: "Безбарьерный подъём на верхний этаж.",
      kk: "Жоғарғы қабатқа кедергісіз көтерілу нүктесі.",
    },
    keywords: ["lift", "accessible", "лифт"],
    accessible: true,
  },
  {
    id: "RESTROOM1",
    label: "WC",
    name: {
      ru: "Санузел",
      kk: "Дәретхана",
    },
    type: "restroom",
    floor: 1,
    x: 540,
    y: 310,
    width: 100,
    height: 110,
    description: {
      ru: "Санузел рядом с сервисной зоной.",
      kk: "Қызмет көрсету аймағының жанындағы дәретхана.",
    },
    keywords: ["wc", "restroom", "туалет", "дәретхана"],
    accessible: true,
  },
  {
    id: "STAIRS1",
    label: "S1",
    name: {
      ru: "Лестница",
      kk: "Баспалдақ",
    },
    type: "stairs",
    floor: 1,
    x: 650,
    y: 310,
    width: 90,
    height: 110,
    description: {
      ru: "Основной переход между этажами.",
      kk: "Қабаттар арасындағы негізгі өту жолы.",
    },
    keywords: ["stairs", "лестница", "баспалдақ"],
  },
  {
    id: "ENTRANCE",
    label: "ENT",
    name: {
      ru: "Главный вход",
      kk: "Бас кіреберіс",
    },
    type: "entrance",
    floor: 1,
    x: 340,
    y: 430,
    width: 130,
    height: 40,
    description: {
      ru: "Точка входа для гостей и старт маршрутов по корпусу.",
      kk: "Қонақтарға арналған негізгі кіру нүктесі және ішкі маршруттардың бастауы.",
    },
    keywords: ["entry", "entrance", "вход", "кіреберіс"],
    accessible: true,
  },
];

const floor1Corridors = [
  { x: 40, y: 160, width: 700, height: 140 },
  { x: 340, y: 300, width: 130, height: 130 },
];

const floor2Rooms: Room[] = [
  {
    id: "B201",
    label: "B201",
    name: {
      ru: "Аудитория B201",
      kk: "B201 аудиториясы",
    },
    type: "classroom",
    floor: 2,
    x: 60,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Аудитория для лекций и открытых консультаций.",
      kk: "Дәрістер мен ашық консультацияларға арналған аудитория.",
    },
    keywords: ["lecture", "аудитория", "дәріс"],
    accessible: true,
    capacity: 36,
  },
  {
    id: "B202",
    label: "B202",
    name: {
      ru: "Компьютерная лаборатория",
      kk: "Компьютерлік зертхана",
    },
    type: "lab",
    floor: 2,
    x: 200,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Рабочие станции для занятий по программированию.",
      kk: "Бағдарламалау сабақтарына арналған жұмыс станциялары.",
    },
    keywords: ["computer lab", "it", "лаборатория", "зертхана", "компьютер"],
    accessible: true,
    capacity: 24,
  },
  {
    id: "B203",
    label: "B203",
    name: {
      ru: "Аудитория B203",
      kk: "B203 аудиториясы",
    },
    type: "classroom",
    floor: 2,
    x: 340,
    y: 40,
    width: 130,
    height: 110,
    description: {
      ru: "Небольшие занятия и встречи с наставниками.",
      kk: "Шағын сабақтар мен менторлармен кездесулер.",
    },
    keywords: ["mentor", "classroom", "аудитория", "кеңес"],
    accessible: true,
    capacity: 24,
  },
  {
    id: "B204",
    label: "B204",
    name: {
      ru: "Тихая учебная аудитория",
      kk: "Тыныш оқу аудиториясы",
    },
    type: "classroom",
    floor: 2,
    x: 60,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Подготовка к экзаменам и работа в малых группах.",
      kk: "Емтиханға дайындалуға және шағын топпен жұмыс істеуге арналған орын.",
    },
    keywords: ["study", "focus", "тихая зона", "оқу"],
    accessible: true,
    capacity: 20,
  },
  {
    id: "B205",
    label: "B205",
    name: {
      ru: "Переговорная B205",
      kk: "Келіссөз бөлмесі B205",
    },
    type: "service",
    floor: 2,
    x: 200,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Комната для встреч, броней и защиты проектов.",
      kk: "Кездесулерге, броньға және жобаларды қорғауға арналған бөлме.",
    },
    keywords: ["booking", "meeting room", "переговорная", "кездесу"],
    accessible: true,
    capacity: 6,
  },
  {
    id: "MEDIA",
    label: "B206",
    name: {
      ru: "Медиастудия",
      kk: "Медиа студия",
    },
    type: "lab",
    floor: 2,
    x: 340,
    y: 310,
    width: 130,
    height: 110,
    description: {
      ru: "Подкасты, видео и презентации для студенческих команд.",
      kk: "Студенттік командаларға арналған подкаст, видео және презентация студиясы.",
    },
    keywords: ["media", "podcast", "студия", "бейне"],
    accessible: true,
    capacity: 10,
  },
  {
    id: "ROBOTICS",
    label: "LAB",
    name: {
      ru: "Робототехническая лаборатория",
      kk: "Робот техникасы зертханасы",
    },
    type: "lab",
    floor: 2,
    x: 540,
    y: 40,
    width: 100,
    height: 110,
    description: {
      ru: "Прототипирование, электроника и тесты оборудования.",
      kk: "Прототип жасау, электроника және жабдықты сынау аймағы.",
    },
    keywords: ["robotics", "hardware", "engineering", "робот", "зертхана"],
    accessible: true,
    capacity: 14,
  },
  {
    id: "ELEVATOR2",
    label: "L2",
    name: {
      ru: "Лифт",
      kk: "Лифт",
    },
    type: "elevator",
    floor: 2,
    x: 650,
    y: 40,
    width: 90,
    height: 110,
    description: {
      ru: "Безбарьерный переход на нижний этаж.",
      kk: "Төменгі қабатқа кедергісіз түсу нүктесі.",
    },
    keywords: ["lift", "accessible", "лифт"],
    accessible: true,
  },
  {
    id: "RESTROOM2",
    label: "WC",
    name: {
      ru: "Санузел",
      kk: "Дәретхана",
    },
    type: "restroom",
    floor: 2,
    x: 540,
    y: 310,
    width: 100,
    height: 110,
    description: {
      ru: "Санузел рядом с лабораторным блоком.",
      kk: "Зертханалар блогының жанындағы дәретхана.",
    },
    keywords: ["wc", "restroom", "туалет", "дәретхана"],
    accessible: true,
  },
  {
    id: "STAIRS2",
    label: "S2",
    name: {
      ru: "Лестница",
      kk: "Баспалдақ",
    },
    type: "stairs",
    floor: 2,
    x: 650,
    y: 310,
    width: 90,
    height: 110,
    description: {
      ru: "Основной переход между этажами.",
      kk: "Қабаттар арасындағы негізгі өту жолы.",
    },
    keywords: ["stairs", "лестница", "баспалдақ"],
  },
];

const floor2Corridors = [{ x: 40, y: 160, width: 700, height: 140 }];

export const FLOORS: FloorData[] = [
  {
    id: 1,
    rooms: floor1Rooms,
    corridors: floor1Corridors,
    walls: [],
  },
  {
    id: 2,
    rooms: floor2Rooms,
    corridors: floor2Corridors,
    walls: [],
  },
];

export function getAllRooms(): Room[] {
  return FLOORS.flatMap((floor) => floor.rooms);
}

export function getRoomById(id: string): Room | undefined {
  return getAllRooms().find((room) => room.id === id);
}

export function getRoomDisplayName(room: Room, locale: Locale): string {
  return text(room.name, locale);
}

export function getRoomDescription(
  room: Room,
  locale: Locale
): string | undefined {
  return room.description ? text(room.description, locale) : undefined;
}

export function getFloorLabel(floorId: number, locale: Locale): string {
  if (locale === "kk") {
    return `${floorId}-қабат`;
  }

  return `${floorId} этаж`;
}

export function getRoomTypeLabel(type: RoomType, locale: Locale): string {
  const labels: Record<RoomType, LocalizedText> = {
    classroom: { ru: "Аудитория", kk: "Аудитория" },
    office: { ru: "Офис", kk: "Кеңсе" },
    restroom: { ru: "Санузел", kk: "Дәретхана" },
    stairs: { ru: "Лестница", kk: "Баспалдақ" },
    entrance: { ru: "Вход", kk: "Кіру" },
    corridor: { ru: "Коридор", kk: "Дәліз" },
    library: { ru: "Библиотека", kk: "Кітапхана" },
    cafeteria: { ru: "Столовая", kk: "Асхана" },
    lab: { ru: "Лаборатория", kk: "Зертхана" },
    service: { ru: "Сервис", kk: "Қызмет" },
    elevator: { ru: "Лифт", kk: "Лифт" },
  };

  return text(labels[type], locale);
}

export function searchRooms(query: string): Room[] {
  if (!query.trim()) return [];
  const normalizedQuery = query.toLowerCase().trim();

  return getAllRooms().filter((room) => {
    const haystack = [
      room.id,
      room.label,
      room.name.ru,
      room.name.kk,
      room.description?.ru,
      room.description?.kk,
      room.type,
      ...(room.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
