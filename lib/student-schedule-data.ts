export interface StudentScheduleItem {
  id: number;
  day: string;
  lessonNumber: string;
  time: string;
  subject: string;
  lessonType: string;
  teacher: string;
  room: string;
  meetingUrl?: string;
}

export const STUDENT_SCHEDULE: StudentScheduleItem[] = [
  {
    id: 1,
    day: "ВТ",
    lessonNumber: "5",
    time: "12:20-13:10",
    subject: "Операциялық жүйелер, орталар және қабықшалар",
    lessonType: "Дәріс",
    teacher:
      "техника ғылымдарының кандидаты\nоқытушы - дәріскер\nУзденбаев Жанбай Шуйншалиевич",
    room: "Кабинет Хуавей (№ 1 оқу ғимараты)",
    meetingUrl: "https://meetingsamer40.webex.com/meet/pr1260996562",
  },
  {
    id: 2,
    day: "СР",
    lessonNumber: "7",
    time: "14:10-15:00",
    subject: "Интеллектуалды робототехникалық жүйелер",
    lessonType: "Зертханалық сабақ",
    teacher:
      "магистр\nоқытушы - дәріскер\nОразбаева Асель Айтмухамедовна",
    room: "321 (Компьютерліук желілер зертханасы) (№ 2 оқу ғимараты)",
    meetingUrl: "http://meet.google.com/mhi-wnyv-ind",
  },
  {
    id: 3,
    day: "СР",
    lessonNumber: "8",
    time: "15:15-16:05",
    subject: "Интеллектуалды робототехникалық жүйелер",
    lessonType: "Зертханалық сабақ",
    teacher:
      "магистр\nоқытушы - дәріскер\nОразбаева Асель Айтмухамедовна",
    room: "321 (Компьютерліук желілер зертханасы) (№ 2 оқу ғимараты)",
    meetingUrl: "http://meet.google.com/mhi-wnyv-ind",
  },
  {
    id: 4,
    day: "СР",
    lessonNumber: "9",
    time: "16:10-17:00",
    subject: "Математикалық және компьютерлік модельдеу",
    lessonType: "Практикалық сабақ",
    teacher:
      "магистр\nоқытушы - ассистент\nИбраимов Анет Советович",
    room: "Лаборатория робототехники и мехатроники (№ 2 оқу ғимараты)",
  },
  {
    id: 5,
    day: "ЧТ",
    lessonNumber: "5",
    time: "12:20-13:10",
    subject: "Интеллектуалды робототехникалық жүйелер",
    lessonType: "Дәріс",
    teacher:
      "магистр\nоқытушы - дәріскер\nОразбаева Асель Айтмухамедовна",
    room: "317 (№ 2 оқу ғимараты)",
    meetingUrl: "http://meet.google.com/mhi-wnyv-ind",
  },
  {
    id: 6,
    day: "ЧТ",
    lessonNumber: "6",
    time: "13:15-14:05",
    subject: "С#. Жоғары деңгейдегі тілдерде программалау",
    lessonType: "Дәріс",
    teacher:
      "педагогика ғылымдарының кандидаты\nкафедра меңгерушісі\nСмагулова Лаура Амангельдиевна",
    room: "322 (Компьютер саулеті және ақпараттық қауіпсіздік зертханасы) (№ 2 оқу ғимараты)",
    meetingUrl: "https://meet.google.com/hzr-epvd-kgv",
  },
  {
    id: 7,
    day: "ЧТ",
    lessonNumber: "7",
    time: "14:10-15:00",
    subject: "С#. Жоғары деңгейдегі тілдерде программалау",
    lessonType: "Дәріс",
    teacher:
      "педагогика ғылымдарының кандидаты\nкафедра меңгерушісі\nСмагулова Лаура Амангельдиевна",
    room: "322 (Компьютер саулеті және ақпараттық қауіпсіздік зертханасы) (№ 2 оқу ғимараты)",
    meetingUrl: "https://meet.google.com/hzr-epvd-kgv",
  },
  {
    id: 8,
    day: "ПТ",
    lessonNumber: "5",
    time: "12:20-13:10",
    subject: "С#. Жоғары деңгейдегі тілдерде программалау",
    lessonType: "Практикалық сабақ",
    teacher:
      "педагогика ғылымдарының кандидаты\nкафедра меңгерушісі\nСмагулова Лаура Амангельдиевна",
    room: "321 (Компьютерліук желілер зертханасы) (№ 2 оқу ғимараты)",
    meetingUrl: "https://meet.google.com/hzr-epvd-kgv",
  },
  {
    id: 9,
    day: "ПТ",
    lessonNumber: "9",
    time: "16:10-17:00",
    subject: "Математикалық және компьютерлік модельдеу",
    lessonType: "Дәріс",
    teacher:
      "магистр\nоқытушы - дәріскер\nШалтабаев Алтай Аканович",
    room: "№3. Ілияс Жансүгіров атындағы дәріс залы (№ 2 оқу ғимараты)",
    meetingUrl: "https://meet.google.com/fdm-dokz-dhz",
  },
  {
    id: 10,
    day: "ПТ",
    lessonNumber: "10",
    time: "17:05-17:55",
    subject: "Математикалық және компьютерлік модельдеу",
    lessonType: "Дәріс",
    teacher:
      "магистр\nоқытушы - дәріскер\nШалтабаев Алтай Аканович",
    room: "№3. Ілияс Жансүгіров атындағы дәріс залы (№ 2 оқу ғимараты)",
    meetingUrl: "https://meet.google.com/fdm-dokz-dhz",
  },
  {
    id: 11,
    day: "СБ",
    lessonNumber: "2",
    time: "09:25-10:15",
    subject: "Операциялық жүйелер, орталар және қабықшалар",
    lessonType: "Зертханалық сабақ",
    teacher:
      "магистр\nоқытушы - ассистент\nСатқұлов Бақтияр Бағланұлы",
    room: "Талдыкорган қ, Жансугуров көшксі 226",
    meetingUrl: "г.Талдыкорган ул. Жансугурова 226",
  },
  {
    id: 12,
    day: "СБ",
    lessonNumber: "3",
    time: "10:30-11:20",
    subject: "Операциялық жүйелер, орталар және қабықшалар",
    lessonType: "Зертханалық сабақ",
    teacher:
      "магистр\nоқытушы - ассистент\nСатқұлов Бақтияр Бағланұлы",
    room: "Талдыкорган қ, Жансугуров көшксі 226",
    meetingUrl: "г.Талдыкорган ул. Жансугурова 226",
  },
];
