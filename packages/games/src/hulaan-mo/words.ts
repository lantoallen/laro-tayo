export type PackId = "food" | "places" | "things";

export interface WordPack {
  id: PackId;
  name: string;
  words: string[];
}

export const PACKS: WordPack[] = [
  {
    id: "food",
    name: "Food",
    words: [
      "Adobo", "Sinigang", "Lechon", "Halo-halo", "Balut", "Pancit", "Lumpia", "Kare-kare",
      "Sisig", "Bibingka", "Puto", "Taho", "Turon", "Ensaymada", "Pandesal", "Longganisa",
      "Tapsilog", "Bulalo", "Tinola", "Dinuguan", "Leche flan", "Ube halaya", "Champorado",
      "Arroz caldo", "Bicol express", "Laing", "Pinakbet", "Chicharon", "Fishball", "Kwek-kwek",
      "Isaw", "Banana cue", "Kamote cue", "Mais con yelo", "Buko pie", "Polvoron", "Siopao",
      "Dried mangoes", "Bistek", "Palabok",
    ],
  },
  {
    id: "places",
    name: "Places",
    words: [
      "Boracay", "Palawan", "Baguio", "Vigan", "Manila", "Cebu", "Davao", "Bohol",
      "Chocolate Hills", "Mayon Volcano", "Taal Volcano", "Intramuros", "Rizal Park",
      "Banaue Rice Terraces", "Batanes", "Siargao", "Puerto Princesa", "Tagaytay", "Batangas",
      "Iloilo", "Bacolod", "Zamboanga", "Pampanga", "Laguna", "Quezon City", "Makati",
      "EDSA", "Pasig River", "Corregidor", "Manila Bay", "Coron", "El Nido", "Camiguin",
      "Dumaguete", "Sagada", "Hundred Islands", "Lipa", "Pagudpud", "Mount Apo", "Binondo",
    ],
  },
  {
    id: "things",
    name: "Things",
    words: [
      "Jeepney", "Tricycle", "Sari-sari store", "Tsinelas", "Bahay kubo", "Banig",
      "Walis tingting", "Tabo", "Karaoke", "Parol", "Barong", "Salakot", "Bayong", "Sungka",
      "Sipa", "Patintero", "Tumbang preso", "Kalesa", "Bangka", "Fiesta", "Simbang gabi",
      "Noche Buena", "Balikbayan box", "Pasalubong", "Tinikling", "Harana", "Palengke",
      "Carinderia", "Basketball court", "Barangay hall", "Jollibee", "Pabitin", "Piñata",
      "Sampaguita", "Anahaw", "Kalamansi", "Yo-yo", "Abaniko", "Kulambo", "Bilao",
    ],
  },
];

export function packWords(pack: PackId | "mixed"): string[] {
  if (pack === "mixed") return PACKS.flatMap((p) => p.words);
  return PACKS.find((p) => p.id === pack)!.words;
}
