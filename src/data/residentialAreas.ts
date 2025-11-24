export const residentialAreas = {
  "Beirut Governorate": {
    "Beirut": [
      "Achrafieh",
      "Ain El Mreisseh",
      "Bachoura",
      "Hamra",
      "Karantina",
      "Minet El Hosn",
      "Mousaytbeh",
      "Qantari",
      "Raouche",
      "Ras Beirut",
      "Remeil",
      "Saifi",
      "Zokak El Blat",
      "Marfaa"
    ]
  },
  "Mount Lebanon Governorate": {
    "Baabda District": [
      "Baabda",
      "Hadath",
      "Hazmieh",
      "Furn El Chebbak",
      "Haret Hreik",
      "Chiyah",
      "Kfarshima",
      "Aramoun",
      "Bchamoun",
      "Jdeideh Baabda",
      "Louaizeh",
      "Yarze",
      "Ain Saadeh",
      "Deir Qoubel"
    ],
    "Metn District": [
      "Antelias",
      "Bikfaya",
      "Beit Mery",
      "Broumana",
      "Dbayeh",
      "Dekwaneh",
      "Jal El Dib",
      "Mansourieh",
      "Mazraat Yachouh",
      "Rabieh",
      "Sinn El Fil",
      "Zalka",
      "Jdaideh",
      "Ain Najm"
    ],
    "Keserwan District": [
      "Jounieh",
      "Kaslik",
      "Adma",
      "Tabarja",
      "Ghazir",
      "Harissa",
      "Zouk Mikael",
      "Zouk Mosbeh",
      "Kfarhbab",
      "Faytroun",
      "Faraya",
      "Ghosta"
    ],
    "Chouf District": [
      "Beiteddine",
      "Barouk",
      "Baakline",
      "Bchamoun",
      "Damour",
      "Deir El Qamar",
      "Joun",
      "Mazraat El Chouf"
    ],
    "Aley District": [
      "Aley",
      "Bhamdoun",
      "Choueifat",
      "Ras El Matn",
      "Souk El Gharb",
      "Ainab",
      "Ain Dara",
      "Kaifoun"
    ]
  },
  "North Lebanon": {
    "Tripoli District": [
      "Tripoli",
      "El Mina",
      "Qalamoun",
      "Abi Samra",
      "Bab El Tebbaneh"
    ],
    "Zgharta District": [
      "Zgharta",
      "Ehden",
      "Kfarhata"
    ],
    "Batroun District": [
      "Batroun",
      "Kfifan",
      "Tannourine",
      "Douma"
    ],
    "Koura District": [
      "Amioun",
      "Kousba",
      "Bhersaf"
    ],
    "Bcharre District": [
      "Bcharre",
      "Hadath El Jebbeh",
      "Bqaa Kafra"
    ]
  },
  "Akkar Governorate": {
    "Akkar District": [
      "Halba",
      "Bebnine",
      "Fnaydek",
      "Qobayat",
      "Hokr El Dahri",
      "Wadi Khaled"
    ]
  },
  "Bekaa Governorate": {
    "Zahle District": [
      "Zahle",
      "Taalabaya",
      "Saadnayel",
      "Bar Elias",
      "Qabb Elias",
      "Niha"
    ],
    "West Bekaa District": [
      "Jeb Jennine",
      "Saghbine",
      "Mashghara",
      "Qaraoun"
    ],
    "Rashaya District": [
      "Rashaya",
      "Kawkaba",
      "Ain Ata"
    ]
  },
  "Baalbek-Hermel Governorate": {
    "Baalbek District": [
      "Baalbek",
      "Brital",
      "Chmistar",
      "Duris"
    ],
    "Hermel District": [
      "Hermel",
      "Al Qasr",
      "Fakiha"
    ]
  },
  "Nabatieh Governorate": {
    "Nabatieh District": [
      "Nabatieh",
      "Kfar Roummane",
      "Habbouch"
    ],
    "Marjeyoun District": [
      "Marjeyoun",
      "Khiam",
      "Deir Mimas"
    ],
    "Bint Jbeil District": [
      "Bint Jbeil",
      "Aitaroun",
      "Maroun El Ras"
    ],
    "Hasbaya District": [
      "Hasbaya",
      "Kawkaba",
      "Fardis"
    ]
  },
  "South Lebanon Governorate": {
    "Saida (Sidon) District": [
      "Saida",
      "Abra",
      "Ghazieh",
      "Haret Saida"
    ],
    "Jezzine District": [
      "Jezzine",
      "Bkassine",
      "Roum"
    ],
    "Tyre District": [
      "Tyre",
      "Abbasieh",
      "Bourj El Shamali",
      "Qana"
    ]
  }
};

export type Governorate = keyof typeof residentialAreas;
export type District<G extends Governorate> = keyof typeof residentialAreas[G];
