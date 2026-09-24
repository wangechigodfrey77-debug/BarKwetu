export interface CountyLocation {
  name: string;
  towns: string[];
}

export const KENYA_COUNTIES: CountyLocation[] = [
  {
    name: 'Nyeri',
    towns: [
      'Karatina CBD / Commercial Street',
      'Ragati / Railway',
      'Blue Valley / Karatina Stadium',
      'Gwa-Kairu / Market Rd',
      'Mathira / Giagatika',
      'Tumutumu / Jamii Hospital',
      'Jomo Kenyatta Road / State Lodge',
      'Hiriga / Ruthagati',
      'Kiahiti / Gikambo',
      'Nyeri Town / Skuta / King\'ong\'o',
      'Othaya Town',
      'Mukurwe-ini Junction',
    ],
  },
  {
    name: 'Kirinyaga',
    towns: [
      'Kerugoya CBD',
      'Kutus / KAG University',
      'Sagana / River Camp',
      'Kagio Market',
      'Wang\'uru / Mwea',
    ],
  },
  {
    name: 'Nairobi',
    towns: [
      'Westlands / Parklands',
      'Kilimani / Kileleshwa / Hurlingham',
      'Lavington / Riverside',
      'Karen / Langata',
      'Nairobi CBD',
      'Upper Hill / Community',
      'South B / South C',
      'Gigiri / Runda / Muthaiga',
      'Ngong Road / Junction',
      'Kasarani / Roysambu / Thika Road',
      'Embakasi / Syokimau / JKIA',
      'Eastleigh / Pangani',
    ],
  },
  {
    name: 'Kiambu',
    towns: [
      'Thika Town',
      'Ruaka / Two Rivers',
      'Kikuyu / Uthiru',
      'Kiambu Town',
      'Ruiru / Kamakis',
      'Juja',
      'Limuru',
    ],
  },
  {
    name: 'Embu',
    towns: [
      'Embu CBD',
      'Runyenjes',
      'Siakago',
      'Dallas / Majengo',
    ],
  },
  {
    name: 'Meru',
    towns: [
      'Meru CBD / Makutano',
      'Nkubu',
      'Maua',
    ],
  },
  {
    name: 'Mombasa',
    towns: [
      'Nyali',
      'Mombasa Island / CBD',
      'Bamburi / Shanzu',
      'Mtwapa',
      'Likoni / Diani',
    ],
  },
  {
    name: 'Nakuru',
    towns: [
      'Nakuru CBD / Milimani',
      'Naivasha',
      'Njoro',
      'Lanet',
    ],
  },
];

