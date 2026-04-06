export const UNIVERSITY = {
  name: "Smart Campus",
  lat: 44.8488,
  lng: 65.4823,
  address: "Campus Avenue 1",
  proximityRadius: 80,
}

export type RoomType =
  | 'classroom'
  | 'office'
  | 'restroom'
  | 'stairs'
  | 'entrance'
  | 'corridor'
  | 'library'
  | 'cafeteria'
  | 'lab'
  | 'service'
  | 'elevator'

export interface Room {
  id: string
  label: string
  name: string
  type: RoomType
  floor: number
  x: number
  y: number
  width: number
  height: number
  description?: string
  keywords?: string[]
  accessible?: boolean
  capacity?: number
}

export interface FloorData {
  id: number
  label: string
  rooms: Room[]
  corridors: { x: number; y: number; width: number; height: number }[]
  walls: { x1: number; y1: number; x2: number; y2: number }[]
}

export const GRID = {
  width: 800,
  height: 500,
  cellSize: 10,
}

const floor1Rooms: Room[] = [
  {
    id: 'A101',
    label: 'A101',
    name: 'Поточная аудитория A101',
    type: 'classroom',
    floor: 1,
    x: 60,
    y: 40,
    width: 130,
    height: 110,
    description: 'Лекции, потоковые занятия и быстрые сборы групп.',
    keywords: ['лекция', 'lecture', 'поток', 'аудитория'],
    accessible: true,
    capacity: 60,
  },
  {
    id: 'LIBRARY',
    label: 'A102',
    name: 'Библиотека',
    type: 'library',
    floor: 1,
    x: 200,
    y: 40,
    width: 130,
    height: 110,
    description: 'Тихая зона, выдача литературы и рабочие места с компьютерами.',
    keywords: ['library', 'books', 'читальный зал', 'тихая зона'],
    accessible: true,
    capacity: 40,
  },
  {
    id: 'CAFE',
    label: 'A103',
    name: 'Столовая',
    type: 'cafeteria',
    floor: 1,
    x: 340,
    y: 40,
    width: 130,
    height: 110,
    description: 'Горячее меню, кофе-бар и выдача предзаказов.',
    keywords: ['еда', 'food', 'menu', 'кафе', 'столовая'],
    accessible: true,
    capacity: 48,
  },
  {
    id: 'A104',
    label: 'A104',
    name: 'Аудитория A104',
    type: 'classroom',
    floor: 1,
    x: 60,
    y: 310,
    width: 130,
    height: 110,
    description: 'Практические занятия и мини-семинары.',
    keywords: ['семинар', 'classroom', 'практика'],
    accessible: true,
    capacity: 28,
  },
  {
    id: 'SERVICE',
    label: 'A105',
    name: 'Студенческий сервисный центр',
    type: 'service',
    floor: 1,
    x: 200,
    y: 310,
    width: 130,
    height: 110,
    description: 'Справки, документы, обращения и быстрые консультации.',
    keywords: ['support', 'help', 'документы', 'справка', 'деканат'],
    accessible: true,
    capacity: 12,
  },
  {
    id: 'COWORK',
    label: 'A106',
    name: 'Коворкинг и проектная зона',
    type: 'service',
    floor: 1,
    x: 340,
    y: 310,
    width: 130,
    height: 110,
    description: 'Командная работа, короткие встречи и резервируемые слоты.',
    keywords: ['coworking', 'project room', 'коворкинг', 'бронь'],
    accessible: true,
    capacity: 8,
  },
  {
    id: 'DEAN',
    label: 'A107',
    name: 'Офис декана',
    type: 'office',
    floor: 1,
    x: 540,
    y: 40,
    width: 100,
    height: 110,
    description: 'Административные вопросы и согласование документов.',
    keywords: ['dean', 'office', 'администрация'],
    accessible: true,
    capacity: 4,
  },
  {
    id: 'ELEVATOR1',
    label: 'L1',
    name: 'Лифт',
    type: 'elevator',
    floor: 1,
    x: 650,
    y: 40,
    width: 90,
    height: 110,
    description: 'Безбарьерный подъём на верхний этаж.',
    keywords: ['lift', 'accessible', 'лифт'],
    accessible: true,
  },
  {
    id: 'RESTROOM1',
    label: 'WC',
    name: 'Санузел',
    type: 'restroom',
    floor: 1,
    x: 540,
    y: 310,
    width: 100,
    height: 110,
    description: 'Санузел рядом с сервисной зоной.',
    keywords: ['wc', 'restroom', 'туалет'],
    accessible: true,
  },
  {
    id: 'STAIRS1',
    label: 'S1',
    name: 'Лестница',
    type: 'stairs',
    floor: 1,
    x: 650,
    y: 310,
    width: 90,
    height: 110,
    description: 'Основной переход между этажами.',
    keywords: ['stairs', 'ступени', 'лестница'],
  },
  {
    id: 'ENTRANCE',
    label: 'Вход',
    name: 'Главный вход',
    type: 'entrance',
    floor: 1,
    x: 340,
    y: 430,
    width: 130,
    height: 40,
    description: 'Точка входа для гостей и старт маршрутов по корпусу.',
    keywords: ['entry', 'entrance', 'main entrance', 'вход'],
    accessible: true,
  },
]

const floor1Corridors = [
  { x: 40, y: 160, width: 700, height: 140 },
  { x: 340, y: 300, width: 130, height: 130 },
]

const floor2Rooms: Room[] = [
  {
    id: 'B201',
    label: 'B201',
    name: 'Аудитория B201',
    type: 'classroom',
    floor: 2,
    x: 60,
    y: 40,
    width: 130,
    height: 110,
    description: 'Аудитория для лекций и открытых консультаций.',
    keywords: ['лекция', 'classroom', 'аудитория'],
    accessible: true,
    capacity: 36,
  },
  {
    id: 'B202',
    label: 'B202',
    name: 'Компьютерная лаборатория',
    type: 'lab',
    floor: 2,
    x: 200,
    y: 40,
    width: 130,
    height: 110,
    description: 'Рабочие станции для занятий по программированию.',
    keywords: ['computer lab', 'it', 'лаборатория', 'компьютеры'],
    accessible: true,
    capacity: 24,
  },
  {
    id: 'B203',
    label: 'B203',
    name: 'Аудитория B203',
    type: 'classroom',
    floor: 2,
    x: 340,
    y: 40,
    width: 130,
    height: 110,
    description: 'Небольшие занятия и встречи с наставниками.',
    keywords: ['classroom', 'mentor', 'семинар'],
    accessible: true,
    capacity: 24,
  },
  {
    id: 'B204',
    label: 'B204',
    name: 'Тихая учебная аудитория',
    type: 'classroom',
    floor: 2,
    x: 60,
    y: 310,
    width: 130,
    height: 110,
    description: 'Подготовка к экзаменам и работа в малых группах.',
    keywords: ['study', 'focus', 'тихая зона'],
    accessible: true,
    capacity: 20,
  },
  {
    id: 'B205',
    label: 'B205',
    name: 'Переговорная B205',
    type: 'service',
    floor: 2,
    x: 200,
    y: 310,
    width: 130,
    height: 110,
    description: 'Комната для бронирования встреч и защиты проектов.',
    keywords: ['booking', 'meeting room', 'переговорная', 'бронь'],
    accessible: true,
    capacity: 6,
  },
  {
    id: 'MEDIA',
    label: 'B206',
    name: 'Медиастудия',
    type: 'lab',
    floor: 2,
    x: 340,
    y: 310,
    width: 130,
    height: 110,
    description: 'Подкасты, видео и презентации для студенческих команд.',
    keywords: ['media', 'podcast', 'студия', 'видео'],
    accessible: true,
    capacity: 10,
  },
  {
    id: 'ROBOTICS',
    label: 'LAB',
    name: 'Робототехническая лаборатория',
    type: 'lab',
    floor: 2,
    x: 540,
    y: 40,
    width: 100,
    height: 110,
    description: 'Прототипирование, электроника и тесты железа.',
    keywords: ['robotics', 'hardware', 'engineering', 'лаборатория'],
    accessible: true,
    capacity: 14,
  },
  {
    id: 'ELEVATOR2',
    label: 'L2',
    name: 'Лифт',
    type: 'elevator',
    floor: 2,
    x: 650,
    y: 40,
    width: 90,
    height: 110,
    description: 'Безбарьерный переход на нижний этаж.',
    keywords: ['lift', 'accessible', 'лифт'],
    accessible: true,
  },
  {
    id: 'RESTROOM2',
    label: 'WC',
    name: 'Санузел',
    type: 'restroom',
    floor: 2,
    x: 540,
    y: 310,
    width: 100,
    height: 110,
    description: 'Санузел рядом с лабораторным блоком.',
    keywords: ['wc', 'restroom', 'туалет'],
    accessible: true,
  },
  {
    id: 'STAIRS2',
    label: 'S2',
    name: 'Лестница',
    type: 'stairs',
    floor: 2,
    x: 650,
    y: 310,
    width: 90,
    height: 110,
    description: 'Основной переход между этажами.',
    keywords: ['stairs', 'ступени', 'лестница'],
  },
]

const floor2Corridors = [{ x: 40, y: 160, width: 700, height: 140 }]

export const FLOORS: FloorData[] = [
  {
    id: 1,
    label: '1 этаж',
    rooms: floor1Rooms,
    corridors: floor1Corridors,
    walls: [],
  },
  {
    id: 2,
    label: '2 этаж',
    rooms: floor2Rooms,
    corridors: floor2Corridors,
    walls: [],
  },
]

export function getAllRooms(): Room[] {
  return FLOORS.flatMap((floor) => floor.rooms)
}

export function getRoomById(id: string): Room | undefined {
  return getAllRooms().find((room) => room.id === id)
}

export function getRoomDisplayName(room: Room): string {
  return room.name || room.label
}

export function getRoomTypeLabel(type: RoomType): string {
  switch (type) {
    case 'classroom':
      return 'Аудитория'
    case 'office':
      return 'Офис'
    case 'restroom':
      return 'Санузел'
    case 'stairs':
      return 'Лестница'
    case 'entrance':
      return 'Вход'
    case 'library':
      return 'Библиотека'
    case 'cafeteria':
      return 'Столовая'
    case 'lab':
      return 'Лаборатория'
    case 'service':
      return 'Сервис'
    case 'elevator':
      return 'Лифт'
    default:
      return 'Точка'
  }
}

export function searchRooms(query: string): Room[] {
  if (!query.trim()) return []
  const normalizedQuery = query.toLowerCase().trim()

  return getAllRooms().filter((room) => {
    const haystack = [
      room.id,
      room.label,
      room.name,
      room.description,
      room.type,
      ...(room.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}
