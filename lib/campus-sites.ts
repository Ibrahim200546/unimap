import type { LocalizedText } from "@/lib/i18n";

export interface CampusPhotoLink {
  label: LocalizedText;
  url: string;
}

export interface CampusSite {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  description: LocalizedText;
  lat?: number;
  lng?: number;
  kind: "main" | "library" | "building" | "lecture";
  indoorAvailable?: boolean;
  linkedRoomId?: string;
  photoLinks?: CampusPhotoLink[];
}

export const CAMPUS_SITES: CampusSite[] = [
  {
    id: "main-building",
    kind: "main",
    name: {
      ru: "Корпус 1",
      kk: "1 корпус",
    },
    address: {
      ru: "Талдыкорган, ул. Ильяса Жансугурова, 187а",
      kk: "Талдықорған, Ілияс Жансүгіров көшесі, 187а",
    },
    description: {
      ru: "Главный корпус Жетісуского университета имени Ильяса Жансугурова.",
      kk: "Ілияс Жансүгіров атындағы Жетісу университетінің бас оқу корпусы.",
    },
    lat: 45.008698,
    lng: 78.349901,
    indoorAvailable: true,
    photoLinks: [
      {
        label: {
          ru: "Галерея корпуса",
          kk: "Корпус галереясы",
        },
        url: "https://zhetysu.edu.kz/%D0%B3%D0%B0%D0%BB%D0%B5%D1%80%D0%B5%D1%8F%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9-%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81/",
      },
    ],
  },
  {
    id: "library",
    kind: "library",
    name: {
      ru: "Библиотека",
      kk: "Кітапхана",
    },
    address: {
      ru: "Библиотечный блок кампуса",
      kk: "Кампус кітапхана блогы",
    },
    description: {
      ru: "Библиотека кампуса с читальными залами и тихими зонами для подготовки.",
      kk: "Оқу залдары мен тыныш дайындық аймақтары бар кампус кітапханасы.",
    },
    lat: 45.008469,
    lng: 78.35103,
    indoorAvailable: true,
    linkedRoomId: "LIBRARY",
    photoLinks: [
      {
        label: {
          ru: "Галерея библиотеки",
          kk: "Кітапхана галереясы",
        },
        url: "https://zhetysu.edu.kz/gallery-library-ru/",
      },
    ],
  },
  {
    id: "building-2",
    kind: "building",
    name: {
      ru: "Корпус 2",
      kk: "2 корпус",
    },
    address: {
      ru: "Талдыкорган, ул. Желтоксан, 220",
      kk: "Талдықорған, Желтоқсан көшесі, 220",
    },
    description: {
      ru: "Учебный корпус №2 с отдельными аудиториями и лекционными пространствами.",
      kk: "Жеке аудиториялары мен лекциялық кеңістіктері бар №2 оқу корпусы.",
    },
    lat: 45.003892,
    lng: 78.363291,
    photoLinks: [
      {
        label: {
          ru: "Галерея корпуса 2",
          kk: "2 корпус галереясы",
        },
        url: "https://zhetysu.edu.kz/gallery-2-korpus-ru/",
      },
      {
        label: {
          ru: "360",
          kk: "360",
        },
        url: "https://kuula.co/post/n1/collection/7MD9K",
      },
    ],
  },
  {
    id: "lecture-hall",
    kind: "lecture",
    name: {
      ru: "Лекционный зал в корпусе 2",
      kk: "2 корпустағы лекциялық зал",
    },
    address: {
      ru: "Корпус 2, ул. Желтоксан, 220",
      kk: "2 корпус, Желтоқсан көшесі, 220",
    },
    description: {
      ru: "Отдельная лекционная площадка корпуса 2.",
      kk: "2 корпусқа тиесілі жеке лекциялық алаң.",
    },
    lat: 45.004753,
    lng: 78.363278,
    photoLinks: [
      {
        label: {
          ru: "Фото 1",
          kk: "Фото 1",
        },
        url: "https://yandex.kz/maps/-/CPfSAFzR",
      },
      {
        label: {
          ru: "Фото 2",
          kk: "Фото 2",
        },
        url: "https://yandex.kz/maps/-/CPfSAWZA",
      },
    ],
  },
  {
    id: "building-3",
    kind: "building",
    name: {
      ru: "Корпус 3",
      kk: "3 корпус",
    },
    address: {
      ru: "Талдыкорган, ул. Кабанбай батыра, 27",
      kk: "Талдықорған, Қабанбай батыр көшесі, 27",
    },
    description: {
      ru: "Третий корпус университета в отдельном городском блоке.",
      kk: "Қаланың бөлек бөлігіндегі университеттің үшінші корпусы.",
    },
    lat: 45.019573,
    lng: 78.382894,
    photoLinks: [
      {
        label: {
          ru: "Галерея корпуса 3",
          kk: "3 корпус галереясы",
        },
        url: "https://zhetysu.edu.kz/%D0%B3%D0%B0%D0%BB%D0%B5%D1%80%D0%B5%D1%8F-3-%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81/",
      },
    ],
  },
];

export function getCampusSiteById(siteId: string) {
  return CAMPUS_SITES.find((site) => site.id === siteId) ?? null;
}
