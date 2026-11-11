// The names of South Korea's metropolitan cities and provinces as addresses write them: the official name in Korean, its short
// form, and the romanisations people use, by the province's ISO 3166-2 code (without KR-). Official names are facts; the
// forms are common usage.

const KR_PROVINCE_NAMES: Readonly<Record<string, readonly string[]>> = {
  "11": ["서울특별시", "서울", "Seoul", "Seoul-si", "Seoul Special City"],
  "26": ["부산광역시", "부산", "Busan", "Busan-si", "Pusan"],
  "27": ["대구광역시", "대구", "Daegu", "Daegu-si", "Taegu"],
  "28": ["인천광역시", "인천", "Incheon", "Incheon-si", "Inchon"],
  "29": ["광주광역시", "광주", "Gwangju", "Gwangju-si", "Kwangju"],
  "30": ["대전광역시", "대전", "Daejeon", "Daejeon-si", "Taejon"],
  "31": ["울산광역시", "울산", "Ulsan", "Ulsan-si"],
  "50": ["세종특별자치시", "세종", "Sejong", "Sejong-si", "Sejong City"],
  "41": ["경기도", "경기", "Gyeonggi", "Gyeonggi-do", "Kyonggi"],
  "42": ["강원특별자치도", "강원도", "강원", "Gangwon", "Gangwon-do", "Gangwon State"],
  "43": ["충청북도", "충북", "Chungcheongbuk-do", "Chungbuk", "North Chungcheong"],
  "44": ["충청남도", "충남", "Chungcheongnam-do", "Chungnam", "South Chungcheong"],
  "45": ["전북특별자치도", "전라북도", "전북", "Jeollabuk-do", "Jeonbuk", "North Jeolla"],
  "46": ["전라남도", "전남", "Jeollanam-do", "Jeonnam", "South Jeolla"],
  "47": ["경상북도", "경북", "Gyeongsangbuk-do", "Gyeongbuk", "North Gyeongsang"],
  "48": ["경상남도", "경남", "Gyeongsangnam-do", "Gyeongnam", "South Gyeongsang"],
  "49": ["제주특별자치도", "제주도", "제주", "Jeju", "Jeju-do", "Jeju Island"],
};

export { KR_PROVINCE_NAMES };
