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
  {
    id: "dormitory-1",
    kind: "building",
    name: {
      ru: "Общежитие 1",
      kk: "1 жатақхана",
      en: "Dormitory 1",
    },
    address: {
      ru: "Талдыкорган, общежитие 1",
      kk: "Талдықорған, 1 жатақхана",
      en: "Taldykorgan, Dormitory 1",
    },
    description: {
      ru: "Студенческое общежитие №1 Жетісуского университета.",
      kk: "Жетісу университетінің №1 студенттік жатақханасы.",
      en: "Zhetysu University student dormitory No. 1.",
    },
    lat: 45.010267,
    lng: 78.353745,
    photoLinks: [
      {
        label: {
          ru: "Галерея",
          kk: "Галерея",
          en: "Gallery",
        },
        url: "https://yandex.kz/maps/?ll=78.353745%2C45.010267&z=18&mode=search&text=%D0%9E%D0%B1%D1%89%D0%B5%D0%B6%D0%B8%D1%82%D0%B8%D0%B5%201",
      },
    ],
  },
  {
    id: "dormitory-2",
    kind: "building",
    name: {
      ru: "Общежитие 2",
      kk: "2 жатақхана",
      en: "Dormitory 2",
    },
    address: {
      ru: "Талдыкорган, общежитие 2",
      kk: "Талдықорған, 2 жатақхана",
      en: "Taldykorgan, Dormitory 2",
    },
    description: {
      ru: "Студенческое общежитие №2 Жетісуского университета.",
      kk: "Жетісу университетінің №2 студенттік жатақханасы.",
      en: "Zhetysu University student dormitory No. 2.",
    },
    lat: 45.003939,
    lng: 78.363339,
    photoLinks: [
      {
        label: {
          ru: "Галерея",
          kk: "Галерея",
          en: "Gallery",
        },
        url: "https://yandex.kz/maps/?ll=78.363339%2C45.003939&z=18&mode=search&text=%D0%9E%D0%B1%D1%89%D0%B5%D0%B6%D0%B8%D1%82%D0%B8%D0%B5%202",
      },
    ],
  },
  {
    id: "dormitory-3",
    kind: "building",
    name: {
      ru: "Общежитие 3",
      kk: "3 жатақхана",
      en: "Dormitory 3",
    },
    address: {
      ru: "Талдыкорган, общежитие 3",
      kk: "Талдықорған, 3 жатақхана",
      en: "Taldykorgan, Dormitory 3",
    },
    description: {
      ru: "Студенческое общежитие №3 Жетісуского университета.",
      kk: "Жетісу университетінің №3 студенттік жатақханасы.",
      en: "Zhetysu University student dormitory No. 3.",
    },
    lat: 45.020437,
    lng: 78.395984,
    photoLinks: [
      {
        label: {
          ru: "Галерея",
          kk: "Галерея",
          en: "Gallery",
        },
        url: "https://yandex.kz/maps/?ll=78.395984%2C45.020437&z=18&mode=search&text=%D0%9E%D0%B1%D1%89%D0%B5%D0%B6%D0%B8%D1%82%D0%B8%D0%B5%203",
      },
    ],
  },
];

export function getCampusSiteById(siteId: string) {
  return CAMPUS_SITES.find((site) => site.id === siteId) ?? null;
}
