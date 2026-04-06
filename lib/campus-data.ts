import type { LocalizedText } from "@/lib/i18n";

export interface NavigationCollection {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  roomIds: string[];
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: LocalizedText;
  teacher: string;
  group: string;
  roomId: string;
}

export interface NewsItem {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  time: LocalizedText;
  priority: "high" | "medium" | "normal";
}

export interface DiningItem {
  id: string;
  name: LocalizedText;
  price: string;
  badge: LocalizedText;
}

export interface BookingSlot {
  id: string;
  roomId: string;
  title: LocalizedText;
  timeLabel: LocalizedText;
  status: "available" | "busy";
  features: LocalizedText[];
}

export interface LostFoundItem {
  id: string;
  title: LocalizedText;
  locationNote: LocalizedText;
  reportedAt: LocalizedText;
  status: "new" | "processing" | "ready";
  roomId?: string;
}

export const NAVIGATION_COLLECTIONS: NavigationCollection[] = [
  {
    id: "everyday",
    label: {
      ru: "Каждый день",
      kk: "Күнделікті",
    },
    description: {
      ru: "Частые точки между парами и после занятий.",
      kk: "Сабақ арасында және сабақтан кейін жиі қолданылатын нүктелер.",
    },
    roomIds: ["LIBRARY", "CAFE", "SERVICE", "COWORK"],
  },
  {
    id: "study",
    label: {
      ru: "Учёба",
      kk: "Оқу",
    },
    description: {
      ru: "Аудитории, лаборатории и места для подготовки.",
      kk: "Аудиториялар, зертханалар және дайындалуға арналған орындар.",
    },
    roomIds: ["A101", "B202", "ROBOTICS", "B204"],
  },
  {
    id: "support",
    label: {
      ru: "Поддержка",
      kk: "Қолдау",
    },
    description: {
      ru: "Документы, консультации и административные сервисы.",
      kk: "Құжаттар, консультациялар және әкімшілік қызметтер.",
    },
    roomIds: ["SERVICE", "DEAN", "ENTRANCE"],
  },
];

export const TODAY_SCHEDULE: ScheduleItem[] = [
  {
    id: "sch-1",
    time: "09:00",
    title: {
      ru: "Программирование",
      kk: "Бағдарламалау",
    },
    teacher: "А. Нургалиев",
    group: "CS-201",
    roomId: "B202",
  },
  {
    id: "sch-2",
    time: "11:00",
    title: {
      ru: "Проектный практикум",
      kk: "Жобалық практикум",
    },
    teacher: "М. Жумабекова",
    group: "SE-202",
    roomId: "COWORK",
  },
  {
    id: "sch-3",
    time: "14:00",
    title: {
      ru: "Робототехника",
      kk: "Робот техникасы",
    },
    teacher: "Д. Сейтов",
    group: "EE-301",
    roomId: "ROBOTICS",
  },
];

export const CAMPUS_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: {
      ru: "Открыта запись на карьерный трек",
      kk: "Карьера трегіне тіркелу ашылды",
    },
    summary: {
      ru: "Студенты 2-4 курсов могут подать заявку в сервисном центре до пятницы.",
      kk: "2-4 курс студенттері жұмаға дейін сервис орталығына өтінім бере алады.",
    },
    time: {
      ru: "Сегодня, 08:30",
      kk: "Бүгін, 08:30",
    },
    priority: "high",
  },
  {
    id: "news-2",
    title: {
      ru: "В библиотеке появились новые места для команд",
      kk: "Кітапханада командаларға арналған жаңа орындар ашылды",
    },
    summary: {
      ru: "Тихая зона на первом этаже работает до 20:00 и доступна без брони.",
      kk: "Бірінші қабаттағы тыныш аймақ 20:00-ге дейін жұмыс істейді және броньсыз қолжетімді.",
    },
    time: {
      ru: "Сегодня, 10:15",
      kk: "Бүгін, 10:15",
    },
    priority: "medium",
  },
  {
    id: "news-3",
    title: {
      ru: "Робо-лаборатория открыта для демо-команд",
      kk: "Робо зертхана демо-командаларға ашық",
    },
    summary: {
      ru: "После 16:00 можно прийти на консультацию по железу и 3D-печати.",
      kk: "16:00-ден кейін теміржинақ пен 3D-баспа бойынша консультация алуға болады.",
    },
    time: {
      ru: "Вчера, 17:40",
      kk: "Кеше, 17:40",
    },
    priority: "normal",
  },
];

export const DINING_MENU: DiningItem[] = [
  {
    id: "food-1",
    name: {
      ru: "Плов с овощами и салатом",
      kk: "Көкөніс пен салат қосылған палау",
    },
    price: "1450 ₸",
    badge: {
      ru: "Хит дня",
      kk: "Күн хиті",
    },
  },
  {
    id: "food-2",
    name: {
      ru: "Куриный рамен",
      kk: "Тауық рамені",
    },
    price: "1600 ₸",
    badge: {
      ru: "Новинка",
      kk: "Жаңалық",
    },
  },
  {
    id: "food-3",
    name: {
      ru: "Сэндвич и фильтр-кофе",
      kk: "Сэндвич пен фильтр-кофе",
    },
    price: "1200 ₸",
    badge: {
      ru: "Быстрый перекус",
      kk: "Жылдам ас",
    },
  },
];

export const BOOKING_SLOTS: BookingSlot[] = [
  {
    id: "booking-1",
    roomId: "COWORK",
    title: {
      ru: "Коворкинг A106",
      kk: "Коворкинг A106",
    },
    timeLabel: {
      ru: "Свободно 13:00-15:00",
      kk: "Бос уақыт 13:00-15:00",
    },
    status: "available",
    features: [
      { ru: "8 мест", kk: "8 орын" },
      { ru: "TV-панель", kk: "TV-панель" },
      { ru: "Розетки", kk: "Розеткалар" },
    ],
  },
  {
    id: "booking-2",
    roomId: "B205",
    title: {
      ru: "Переговорная B205",
      kk: "Келіссөз бөлмесі B205",
    },
    timeLabel: {
      ru: "Свободно с 15:00",
      kk: "15:00-ден бастап бос",
    },
    status: "busy",
    features: [
      { ru: "6 мест", kk: "6 орын" },
      { ru: "Маркерная стена", kk: "Маркер тақтасы" },
    ],
  },
  {
    id: "booking-3",
    roomId: "MEDIA",
    title: {
      ru: "Медиастудия B206",
      kk: "Медиа студия B206",
    },
    timeLabel: {
      ru: "Свободно 17:00-18:30",
      kk: "Бос уақыт 17:00-18:30",
    },
    status: "available",
    features: [
      { ru: "Микрофоны", kk: "Микрофондар" },
      { ru: "Свет", kk: "Жарық" },
      { ru: "Запись видео", kk: "Видео жазу" },
    ],
  },
];

export const LOST_AND_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: "lf-1",
    title: {
      ru: "Чёрный power bank",
      kk: "Қара power bank",
    },
    locationNote: {
      ru: "Найден возле библиотеки",
      kk: "Кітапхана жанынан табылды",
    },
    reportedAt: {
      ru: "30 мин назад",
      kk: "30 минут бұрын",
    },
    status: "new",
    roomId: "LIBRARY",
  },
  {
    id: "lf-2",
    title: {
      ru: "Студенческий пропуск",
      kk: "Студенттік рұқсатнама",
    },
    locationNote: {
      ru: "Передан в сервисный центр",
      kk: "Қызмет орталығына тапсырылды",
    },
    reportedAt: {
      ru: "Сегодня, 09:45",
      kk: "Бүгін, 09:45",
    },
    status: "processing",
    roomId: "SERVICE",
  },
  {
    id: "lf-3",
    title: {
      ru: "Наушники в кейсе",
      kk: "Қаптағы құлаққап",
    },
    locationNote: {
      ru: "Ожидают владельца у охраны",
      kk: "Иесін күзет орнында күтіп тұр",
    },
    reportedAt: {
      ru: "Вчера, 18:20",
      kk: "Кеше, 18:20",
    },
    status: "ready",
    roomId: "ENTRANCE",
  },
];
