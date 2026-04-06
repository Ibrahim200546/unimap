export interface NavigationCollection {
  id: string
  label: string
  description: string
  roomIds: string[]
}

export interface ScheduleItem {
  id: string
  time: string
  title: string
  teacher: string
  group: string
  roomId: string
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  time: string
  priority: 'high' | 'medium' | 'normal'
}

export interface DiningItem {
  id: string
  name: string
  price: string
  badge: string
}

export interface BookingSlot {
  id: string
  roomId: string
  title: string
  timeLabel: string
  status: 'available' | 'busy'
  features: string[]
}

export interface LostFoundItem {
  id: string
  title: string
  locationNote: string
  reportedAt: string
  status: 'new' | 'processing' | 'ready'
  roomId?: string
}

export const NAVIGATION_COLLECTIONS: NavigationCollection[] = [
  {
    id: 'everyday',
    label: 'Каждый день',
    description: 'Частые точки между парами и после занятий.',
    roomIds: ['LIBRARY', 'CAFE', 'SERVICE', 'COWORK'],
  },
  {
    id: 'study',
    label: 'Учёба',
    description: 'Аудитории, лаборатории и места для подготовки.',
    roomIds: ['A101', 'B202', 'ROBOTICS', 'B204'],
  },
  {
    id: 'support',
    label: 'Поддержка',
    description: 'Документы, консультации и административные сервисы.',
    roomIds: ['SERVICE', 'DEAN', 'ENTRANCE'],
  },
]

export const TODAY_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '09:00',
    title: 'Программирование',
    teacher: 'А. Нургалиев',
    group: 'CS-201',
    roomId: 'B202',
  },
  {
    id: 'sch-2',
    time: '11:00',
    title: 'Проектный практикум',
    teacher: 'М. Жумабекова',
    group: 'SE-202',
    roomId: 'COWORK',
  },
  {
    id: 'sch-3',
    time: '14:00',
    title: 'Робототехника',
    teacher: 'Д. Сейтов',
    group: 'EE-301',
    roomId: 'ROBOTICS',
  },
]

export const CAMPUS_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Открыта запись на карьерный трек',
    summary: 'Студенты 2-4 курсов могут подать заявку в сервисном центре до пятницы.',
    time: 'Сегодня, 08:30',
    priority: 'high',
  },
  {
    id: 'news-2',
    title: 'В библиотеке появились новые места для команд',
    summary: 'Тихая зона на первом этаже работает до 20:00 и доступна без брони.',
    time: 'Сегодня, 10:15',
    priority: 'medium',
  },
  {
    id: 'news-3',
    title: 'Робо-лаборатория открыта для демо-команд',
    summary: 'После 16:00 можно прийти на консультацию по железу и 3D-печати.',
    time: 'Вчера, 17:40',
    priority: 'normal',
  },
]

export const DINING_MENU: DiningItem[] = [
  {
    id: 'food-1',
    name: 'Плов с овощами и салатом',
    price: '1450 тг',
    badge: 'Хит дня',
  },
  {
    id: 'food-2',
    name: 'Куриный рамен',
    price: '1600 тг',
    badge: 'Новинка',
  },
  {
    id: 'food-3',
    name: 'Сэндвич + фильтр-кофе',
    price: '1200 тг',
    badge: 'Быстрый перекус',
  },
]

export const BOOKING_SLOTS: BookingSlot[] = [
  {
    id: 'booking-1',
    roomId: 'COWORK',
    title: 'Коворкинг A106',
    timeLabel: 'Свободно 13:00-15:00',
    status: 'available',
    features: ['8 мест', 'TV-панель', 'Розетки'],
  },
  {
    id: 'booking-2',
    roomId: 'B205',
    title: 'Переговорная B205',
    timeLabel: 'Свободно с 15:00',
    status: 'busy',
    features: ['6 мест', 'Маркерная стена'],
  },
  {
    id: 'booking-3',
    roomId: 'MEDIA',
    title: 'Медиастудия B206',
    timeLabel: 'Свободно 17:00-18:30',
    status: 'available',
    features: ['Микрофоны', 'Свет', 'Запись видео'],
  },
]

export const LOST_AND_FOUND_ITEMS: LostFoundItem[] = [
  {
    id: 'lf-1',
    title: 'Чёрный power bank',
    locationNote: 'Найден возле библиотеки',
    reportedAt: '30 мин назад',
    status: 'new',
    roomId: 'LIBRARY',
  },
  {
    id: 'lf-2',
    title: 'Студенческий пропуск',
    locationNote: 'Передан в сервисный центр',
    reportedAt: 'Сегодня, 09:45',
    status: 'processing',
    roomId: 'SERVICE',
  },
  {
    id: 'lf-3',
    title: 'Наушники в кейсе',
    locationNote: 'Ожидают владельца у охраны',
    reportedAt: 'Вчера, 18:20',
    status: 'ready',
    roomId: 'ENTRANCE',
  },
]
