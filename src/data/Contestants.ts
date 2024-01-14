import { Contestant } from "./Contestant";

//export const supportedYears = ["1967","2019", "2021","2022", "2023", "2024"];
export const supportedYears = Array.from({ length: 2024 - 1956 + 1 }, (v, i) => ((1956 + i).toString())).reverse();

export function sanitizeYear(contestYear: string | null): string {
  if (contestYear?.length === 2) {
      if ((parseInt(contestYear) < 40)) {
          return '20' + contestYear;
      } else {
          return '19' + contestYear;
      }
  } else if (contestYear?.length === 4) {
    return contestYear;
  }
  return defaultYear;
}

export const defaultYear = '2023';

export const contestants2024: Contestant[] = [
  { countryKey: 'al', artist: 'Besa Kokëdhima', song: 'Zemrën n\'dorë', youtube: 'https://www.youtube.com/watch?v=7rEDP1lSoDQ' },
  { countryKey: 'am', artist: 'TBD', song: '' }, // Armenia
  { countryKey: 'au', artist: 'TBD', song: '' }, // Australia
  { countryKey: 'at', artist: 'TBD Dec 23', song: '' }, // Austria
  { countryKey: 'az', artist: 'TBD', song: '' }, // Azerbaijan
  { countryKey: 'be', artist: 'Mustii', song: 'TBD Feb 24' }, // Belgium
  { countryKey: 'hr', artist: 'TBD Feb 24', song: '' }, // Croatia
  { countryKey: 'cy', artist: 'Silia Kapsis', song: 'Liar' }, // Cyprus
  { countryKey: 'cz', artist: 'Aiko', song: 'Pedestal', youtube: 'https://www.youtube.com/watch?v=5DbRldMKFUU' }, // Czechia
  { countryKey: 'dk', artist: 'TBD Feb 24', song: '' }, // Denmark
  { countryKey: 'ee', artist: 'TBD Feb 24', song: '' }, // Estonia
  { countryKey: 'fi', artist: 'TBD Feb 24', song: '' }, // Finland
  { countryKey: 'fr', artist: 'Slimane', song: 'Mon amour', youtube: 'https://www.youtube.com/watch?v=bal8oESDH7s' }, // France
  { countryKey: 'ge', artist: 'TBD', song: '' }, // Georgia
  { countryKey: 'de', artist: 'TBD Feb 24', song: 'TBD' }, // Germany
  { countryKey: 'gr', artist: 'Marina Satti', song: 'TBD' }, // Greece
  { countryKey: 'is', artist: 'TBD Mar 24', song: '' }, // Iceland
  { countryKey: 'ie', artist: 'TBD', song: '' }, // Ireland
  { countryKey: 'il', artist: 'TBD', song: '' }, // Israel
  { countryKey: 'it', artist: 'TBD Feb 24', song: '' }, // Italy
  { countryKey: 'lv', artist: 'TBD Feb 24', song: '' }, // Latvia
  { countryKey: 'lt', artist: 'TBD Feb 24', song: '' }, // Lithuania
  { countryKey: 'lu', artist: 'TBD Jan 24', song: '' }, // Luxembourg
  { countryKey: 'mt', artist: 'TBD Jan 24', song: '' }, // Malta
  { countryKey: 'md', artist: 'TBD Feb 24', song: '' }, // Moldova
  { countryKey: 'nl', artist: 'Joost Klein', song: 'TBD Mar 24' }, // Netherlands
  { countryKey: 'no', artist: 'TBD Feb 24', song: '' }, // Norway
  { countryKey: 'pl', artist: 'TBD', song: '' }, // Poland
  { countryKey: 'pt', artist: 'TBD Mar 24', song: '' }, // Portugal
  { countryKey: 'sm', artist: 'TBD Feb 24', song: '' }, // San Marino
  { countryKey: 'rs', artist: 'TBD Mar 24', song: '' }, // Serbia
  { countryKey: 'si', artist: 'Raiven', song: 'Veronika' }, // Slovenia
  { countryKey: 'es', artist: 'TBD Feb 24', song: '' }, // Spain
  { countryKey: 'se', artist: 'TBD Mar 24', song: '' }, // Sweden
  { countryKey: 'ch', artist: 'TBD Mar 24', song: '' }, // Switzerland
  { countryKey: 'ua', artist: 'TBD Feb 24', song: '' }, // Ukraine
  { countryKey: 'gb', artist: 'Olly Alexander', song: 'TBD' }, // United Kingdom
];

export const contestants2023: Contestant[] = [
    { countryKey: 'al', artist: 'Albina & Familja Kelmendi', song: 'Duje', youtube: "https://www.youtube.com/watch?v=mp8OG4ApocI"},
    { countryKey: 'am', artist: 'Brunette', song: 'Future Lover', youtube: "https://www.youtube.com/watch?v=Co8ZJIejXBA"},
    { countryKey: 'au', artist: 'Voyager', song: 'Promise', youtube: "https://www.youtube.com/watch?v=aqtu2GspT80"},
    { countryKey: 'at', artist: 'Teya & Salena', song: 'Who The Hell Is Edgar?', youtube: "https://www.youtube.com/watch?v=ZMmLeV47Au4"},
    { countryKey: 'az', artist: 'TuralTuranX', song: 'Tell Me More', youtube: "https://www.youtube.com/watch?v=5dvsr-L3HgY"},
    { countryKey: 'be', artist: 'Gustaph', song: 'Because Of You', youtube: "https://www.youtube.com/watch?v=ORhEoS6d8e4"},
    { countryKey: 'hr', artist: 'Let 3', song: 'Mama ŠČ!', youtube: "https://www.youtube.com/watch?v=AyKj8jA0Qoc"},
    { countryKey: 'cy', artist: 'Andrew Lambrou', song: 'Break A Broken Heart', youtube: "https://www.youtube.com/watch?v=zrFUKqTy4zI"},
    { countryKey: 'cz', artist: 'Vesna', song: 'My Sister\'s Crown', youtube: "https://www.youtube.com/watch?v=-y78qgDlzAM"},
    { countryKey: 'dk', artist: 'Reiley', song: 'Breaking My Heart', youtube: "https://www.youtube.com/watch?v=04C8E7PUMQo"},
    { countryKey: 'ee', artist: 'Alika', song: 'Bridges', youtube: "https://www.youtube.com/watch?v=IQ27JHhR3Ug"},
    { countryKey: 'fi', artist: 'Käärijä', song: 'Cha Cha Cha', youtube: "https://www.youtube.com/watch?v=znWi3zN8Ucg"},
    { countryKey: 'fr', artist: 'La Zarra', song: 'Évidemment', youtube: "https://www.youtube.com/watch?v=GWfbEFH9NvQ"},
    { countryKey: 'ge', artist: 'Iru', song: 'Echo', youtube: "https://www.youtube.com/watch?v=E8kO-QPippo"},
    { countryKey: 'de', artist: 'Lord of the Lost', song: 'Blood & Glitter', youtube: "https://www.youtube.com/watch?v=5I9CYu668jA"},
    { countryKey: 'gr', artist: 'Victor Vernicos', song: 'What They Say', youtube: "https://www.youtube.com/watch?v=qL0EkId_sTY"},
    { countryKey: 'is', artist: 'Diljá', song: 'Power', youtube: "https://www.youtube.com/watch?v=BhlJXcCv7gw"},
    { countryKey: 'ie', artist: 'Wild Youth', song: 'We Are One', youtube: "https://www.youtube.com/watch?v=ak5Fevs424Y"},
    { countryKey: 'il', artist: 'Noa Kirel', song: 'Unicorn', youtube: "https://www.youtube.com/watch?v=r4wbdKmM3bQ"},
    { countryKey: 'it', artist: 'Marco Mengoni', song: 'Due Vite', youtube: "https://www.youtube.com/watch?v=_iS4STWKSvk"},
    { countryKey: 'lv', artist: 'Sudden Lights', song: 'Aijā', youtube: "https://www.youtube.com/watch?v=XRV2-jPqaUw"},
    { countryKey: 'lt', artist: 'Monika Linkytė', song: 'Stay', youtube: "https://www.youtube.com/watch?v=68lbEUDuWUQ"},
    { countryKey: 'mt', artist: 'The Busker', song: 'Dance (Our Own Party)', youtube: "https://www.youtube.com/watch?v=Apqwl0ayL6A"},
    { countryKey: 'md', artist: 'Pasha Parfeni', song: 'Soarele şi Luna', youtube: "https://www.youtube.com/watch?v=se9LDgFW6ak"},
    { countryKey: 'nl', artist: 'Mia Nicolai & Dion Cooper', song: 'Burning Daylight', youtube: "https://www.youtube.com/watch?v=UOf-oKDlO6A"},
    { countryKey: 'no', artist: 'Alessandra', song: 'Queen of Kings', youtube: "https://www.youtube.com/watch?v=vSfffjHjdTk"},
    { countryKey: 'pl', artist: 'Blanka', song: 'Solo', youtube: "https://www.youtube.com/watch?v=PvQRpV1-ZhY"},
    { countryKey: 'pt', artist: 'Mimicat', song: 'Ai Coração', youtube: "https://www.youtube.com/watch?v=-uY37gGPkNU"},
    { countryKey: 'ro', artist: 'Theodor Andrei', song: 'D.G.T. (Off and On)', youtube: "https://www.youtube.com/watch?v=NRxv-AUCinQ"},
    { countryKey: 'sm', artist: 'Piqued Jacks', song: 'Like An Animal', youtube: "https://www.youtube.com/watch?v=D1opw3IpJWA"},
    { countryKey: 'rs', artist: 'Luke Black', song: 'Samo Mi Se Spava', youtube: "https://www.youtube.com/watch?v=oeIVwYUge8o"},
    { countryKey: 'si', artist: 'Joker Out', song: 'Carpe Diem', youtube: "https://www.youtube.com/watch?v=zDBSIGITdY4"},
    { countryKey: 'es', artist: 'Blanca Paloma', song: 'Eaea', youtube: "https://www.youtube.com/watch?v=NGnEoSypBhE"},
    { countryKey: 'se', artist: 'Loreen', song: 'Tattoo', youtube: "https://www.youtube.com/watch?v=b3vJfR81xO0"},
    { countryKey: 'ch', artist: 'Remo Forrer', song: 'Watergun', youtube: "https://www.youtube.com/watch?v=_8-Sbc_GZMc"},
    { countryKey: 'ua', artist: 'TVORCHI', song: 'Heart Of Steel', youtube: "https://www.youtube.com/watch?v=neIscK1hNxs"},
    { countryKey: 'gb', artist: 'Mae Muller', song: 'I Wrote a Song', youtube: "https://www.youtube.com/watch?v=tJ21grjN6wU"}
  ];

  export const contestants2022: Contestant[] = [
    { countryKey: 'al', artist: 'Ronela Hajati', song: 'Sekret', youtube: "https://www.youtube.com/watch?v=iMu47raqbcc" },
    { countryKey: 'am', artist: 'Rosa Linn', song: 'Snap', youtube: "https://www.youtube.com/watch?v=DIKIgjLGf98" },
    { countryKey: 'au', artist: 'Sheldon Riley', song: 'Not The Same', youtube: "https://www.youtube.com/watch?v=ByUD4d89_is" },
    { countryKey: 'at', artist: 'LUM!X featuring Pia Maria', song: 'Halo', youtube: "https://www.youtube.com/watch?v=tF6LY7lnVFU" },
    { countryKey: 'az', artist: 'Nadir Rustamli', song: 'Fade to Black', youtube: "https://www.youtube.com/watch?v=TGd1AFKR_-E" },
    { countryKey: 'be', artist: 'Jérémie Makiese', song: 'Miss You', youtube: "https://www.youtube.com/watch?v=GZ3mLO4uFjY" },
    { countryKey: 'bg', artist: 'Intelligent Music Project', song: 'Intention', youtube: "https://www.youtube.com/watch?v=HySI2igCcx4" },
    { countryKey: 'hr', artist: 'Mia Dimšić', song: 'Guilty Pleasure', youtube: "https://www.youtube.com/watch?v=4mTLfWMSNtw" },
    { countryKey: 'cy', artist: 'Andromache', song: 'Ela', youtube: "https://www.youtube.com/watch?v=GM8CY08UT6I" },
    { countryKey: 'cz', artist: 'We Are Domi', song: 'Lights Off', youtube: "https://www.youtube.com/watch?v=QRgj3enaAhI" },
    { countryKey: 'dk', artist: 'REDDI', song: 'The Show', youtube: "https://www.youtube.com/watch?v=xqakAZP4D24" },
    { countryKey: 'ee', artist: 'Stefan', song: 'Hope', youtube: "https://www.youtube.com/watch?v=bKhSlSx00-I" },
    { countryKey: 'fi', artist: 'The Rasmus', song: 'Jezebel', youtube: "https://www.youtube.com/watch?v=IwHijzdNN2A" },
    { countryKey: 'fr', artist: 'Alvan & Ahez', song: 'Fulenn', youtube: "https://www.youtube.com/watch?v=CO07xLUlK2g" },
    { countryKey: 'ge', artist: 'Circus Mircus', song: 'Lock Me In', youtube: "https://www.youtube.com/watch?v=qgukml7zDAA" },
    { countryKey: 'de', artist: 'Malik Harris', song: 'Rockstars', youtube: "https://www.youtube.com/watch?v=Oy-s-IZIHkI" },
    { countryKey: 'gr', artist: 'Amanda Georgiadi Tenfjord', song: 'Die Together', youtube: "https://www.youtube.com/watch?v=Uv7PcRKXZDg" },
    { countryKey: 'is', artist: 'Systur', song: 'Með hækkandi sól', youtube: "https://www.youtube.com/watch?v=vk9D10EyxHA" },
    { countryKey: 'ie', artist: 'Brooke', song: 'That\'s Rich', youtube: "https://www.youtube.com/watch?v=pkHzvy-Pscw" },
    { countryKey: 'il', artist: 'Michael Ben David', song: 'I.M', youtube: "https://www.youtube.com/watch?v=WNFeohWlA20" },
    { countryKey: 'it', artist: 'Mahmood & Blanco', song: 'Brividi', youtube: "https://www.youtube.com/watch?v=Beqe14HYY5o" },
    { countryKey: 'lv', artist: 'Citi Zēni', song: 'Eat Your Salad', youtube: "https://www.youtube.com/watch?v=DbDj9mBI4g0" },
    { countryKey: 'lt', artist: 'Monika Liu', song: 'Sentimentai', youtube: "https://www.youtube.com/watch?v=acya6UcJP1k" },
    { countryKey: 'mt', artist: 'Emma Muscat', song: 'I Am What I Am', youtube: "https://www.youtube.com/watch?v=df-fks-Pj-8" },
    { countryKey: 'md', artist: 'Zdob și Zdub & Advahov Brothers', song: 'Trenulețul', youtube: "https://www.youtube.com/watch?v=C9RJQPZsj8E" },
    { countryKey: 'me', artist: 'Vladana', song: 'Breathe', youtube: "https://www.youtube.com/watch?v=7e3GiXy7SLc" },
    { countryKey: 'nl', artist: 'S10', song: 'De Diepte', youtube: "https://www.youtube.com/watch?v=v2m-MGSys0k" },
    { countryKey: 'mk', artist: 'Andrea', song: 'Circles', youtube: "https://www.youtube.com/watch?v=v2m-MGSys0k" },
    { countryKey: 'no', artist: 'Subwoolfer', song: 'Give That Wolf a Banana', youtube: "https://www.youtube.com/watch?v=O_AvUlCQ_Cc" },
    { countryKey: 'pl', artist: 'Ochman', song: 'River', youtube: "https://www.youtube.com/watch?v=wh47vgUwInU" },
    { countryKey: 'pt', artist: 'MARO', song: 'Saudade, Saudade', youtube: "https://www.youtube.com/watch?v=eQul-rkcGPQ" },
    { countryKey: 'ro', artist: 'WRS', song: 'Llámame', youtube: "https://www.youtube.com/watch?v=Ru3y4ivY3lQ" },
    { countryKey: 'sm', artist: 'Achille Lauro', song: 'Stripper', youtube: "https://www.youtube.com/watch?v=P-RloZ-Fv38" },
    { countryKey: 'rs', artist: 'Konstrakta', song: 'In corpore sano', youtube: "https://www.youtube.com/watch?v=3S1jrYq87Zw" },
    { countryKey: 'si', artist: 'LPS', song: 'Disko', youtube: "https://www.youtube.com/watch?v=g8Ezl7xucCU" },
    { countryKey: 'es', artist: 'Chanel', song: 'SloMo', youtube: "https://www.youtube.com/watch?v=N3eiW6E0ldc" },
    { countryKey: 'se', artist: 'Cornelia Jakobs', song: 'Hold Me Closer', youtube: "https://www.youtube.com/watch?v=wWDThAfryW4" },
    { countryKey: 'ch', artist: 'Marius Bear', song: 'Boys Do Cry', youtube: "https://www.youtube.com/watch?v=ubNIpxo-gMo" },
    { countryKey: 'ua', artist: 'Kalush Orchestra', song: 'Stefania', youtube: "https://www.youtube.com/watch?v=UiEGVYOruLk" },
    { countryKey: 'gb', artist: 'Sam Ryder', song: 'SPACE MAN', youtube: "https://www.youtube.com/watch?v=udsMTb2NIak" }
  ];
  
  export const contestants2021: Contestant[] = [
    { countryKey: 'al', artist: 'Anxhela Peristeri', song: 'Karma', youtube: "https://www.youtube.com/watch?v=Q4D_RfEFwd4" },
    { countryKey: 'au', artist: 'Montaigne', song: 'Technicolour', youtube: "https://www.youtube.com/watch?v=bX_y759_F_U" },
    { countryKey: 'at', artist: 'Vincent Bueno', song: 'Amen', youtube: "https://www.youtube.com/watch?v=1sY76L68rfs" },
    { countryKey: 'az', artist: 'Efendi', song: 'Mata Hari', youtube: "https://www.youtube.com/watch?v=HSiZmR1c7Q4" },
    { countryKey: 'be', artist: 'Hooverphonic', song: 'The Wrong Place', youtube: "https://www.youtube.com/watch?v=0EQyG1Yjlgw" },  
    { countryKey: 'bg', artist: 'Victoria', song: 'Growing Up is Getting Old', youtube: "https://www.youtube.com/watch?v=qMNxCzuEdVM" },
    { countryKey: 'hr', artist: 'Albina', song: 'Tick-Tock', youtube: "https://www.youtube.com/watch?v=IHS_2GpNwmA" },
    { countryKey: 'cy', artist: 'Elena Tsagrinou', song: 'El Diablo', youtube: "https://www.youtube.com/watch?v=mk4amZlPa4g" },
    { countryKey: 'cz', artist: 'Benny Cristo', song: 'Omaga', youtube: "https://www.youtube.com/watch?v=Kxa3ZtxIdxQ" },
    { countryKey: 'dk', artist: 'Fyr & Flamme', song: 'Øve Os På Hinanden', youtube: "https://www.youtube.com/watch?v=axzrdVUdQzQ" },
    { countryKey: 'ee', artist: 'Uku Suviste', song: 'The Lucky One', youtube: "https://www.youtube.com/watch?v=QC06nyML2xg" },
    { countryKey: 'fi', artist: 'Blind Channel', song: 'Dark Side', youtube: "https://www.youtube.com/watch?v=cIvaeu6Oxzc" },
    { countryKey: 'fr', artist: 'Barbara Pravi', song: 'Voilà', youtube: "https://www.youtube.com/watch?app=desktop&v=-9t_SwPN31s" },
    { countryKey: 'ge', artist: 'Tornike Kipiani', song: 'You', youtube: "https://www.youtube.com/watch?v=w6jzan8nfxc" },
    { countryKey: 'de', artist: 'Jendrik', song: 'I Don\'t Feel Hate', youtube: "https://www.youtube.com/watch?v=ydgxZnHFLi4" },
    { countryKey: 'gr', artist: 'Stefania', song: 'Last Dance', youtube: "https://www.youtube.com/watch?v=Er06NBWo4bs" },
    { countryKey: 'is', artist: 'Daði og Gagnamagnið', song: '10 Years', youtube: "https://www.youtube.com/watch?v=ORDK1XQToAY" },
    { countryKey: 'ie', artist: 'Lesley Roy', song: 'Maps', youtube: "https://www.youtube.com/watch?v=z6ZUBzqPxds" },
    { countryKey: 'il', artist: 'Eden Alene', song: 'Set Me Free', youtube: "https://www.youtube.com/watch?v=9nss3FsrgJo" },
    { countryKey: 'it', artist: 'Måneskin', song: 'Zitti E Buoni', youtube: "https://www.youtube.com/watch?v=9mL6Cmkg2_A" },
    { countryKey: 'lv', artist: 'Samanta Tīna', song: 'The Moon is Rising', youtube: "https://www.youtube.com/watch?v=i9wBRhiWR04" },
    { countryKey: 'lt', artist: 'The Roop', song: 'Discoteque', youtube: "https://www.youtube.com/watch?v=0rsUJWSwb0c" },
    { countryKey: 'mt', artist: 'Destiny', song: 'Je Me Casse', youtube: "https://www.youtube.com/watch?v=PQKiHr5qEfA" },
    { countryKey: 'md', artist: 'Natalia Gordienko', song: 'Sugar', youtube: "https://www.youtube.com/watch?v=1zvnsvxA3to" },
    { countryKey: 'nl', artist: 'Jeangu Macrooy', song: 'Birth of a New Age', youtube: "https://www.youtube.com/watch?v=p4Fag4yajxk" },
    { countryKey: 'mk', artist: 'Vasil', song: 'Here I Stand', youtube: "https://www.youtube.com/watch?v=nd4YfjVWrro" },
    { countryKey: 'no', artist: 'TIX', song: 'Fallen Angel', youtube: "https://www.youtube.com/watch?v=bp2kfhuv8ZU" },
    { countryKey: 'pl', artist: 'Rafał', song: 'The Ride', youtube: "https://www.youtube.com/watch?v=xsWwLWaZBq8" },
    { countryKey: 'pt', artist: 'The Black Mamba', song: 'Love Is On My Side', youtube: "https://www.youtube.com/watch?v=2hAlp3Khsnk" },
    { countryKey: 'ro', artist: 'Roxen', song: 'Amnesia', youtube: "https://www.youtube.com/watch?v=TkRAWrDdNwg" },
    { countryKey: 'ru', artist: 'Manizha', song: 'Russian Woman', youtube: "https://www.youtube.com/watch?v=l01wa2ChX64" },
    { countryKey: 'sm', artist: 'Senhit', song: 'Adrenalina', youtube: "https://www.youtube.com/watch?v=eRAN7AzEKak" },
    { countryKey: 'rs', artist: 'Hurricane', song: 'Loco Loco', youtube: "https://www.youtube.com/watch?v=ZFd2oLqqJ1U" },
    { countryKey: 'si', artist: 'Ana Soklič', song: 'Amen', youtube: "https://www.youtube.com/watch?v=p5LW-09r2JQ" },
    { countryKey: 'es', artist: 'Blas Cantó', song: 'Voy A Quedarme', youtube: "https://www.youtube.com/watch?v=qb5FXBwSx44" },
    { countryKey: 'se', artist: 'Tusse', song: 'Voices', youtube: "https://www.youtube.com/watch?v=5P1ueI9j6gk" },
    { countryKey: 'ch', artist: 'Gjon\'s Tears', song: 'Tout l\'Univers', youtube: "https://www.youtube.com/watch?v=bpM6o6UiBIw" },
    { countryKey: 'ua', artist: 'Go_A', song: 'Shum', youtube: "https://www.youtube.com/watch?v=U7-dxzp6Jvs" },
    { countryKey: 'gb', artist: 'James Newman', song: 'Embers', youtube: "https://www.youtube.com/watch?v=BMDGTsa_Qq0" }
  ];

  export const contestants2019: Contestant[] = [
    { countryKey: 'al', artist: 'Jonida Maliqi', song: 'Ktheju tokës', youtube: "https://www.youtube.com/watch?v=eo4aFzAkQkA"},
    { countryKey: 'am', artist: 'Srbuk', song: 'Walking Out', youtube: "https://www.youtube.com/watch?v=q_46dy4yJwg"},
    { countryKey: 'au', artist: 'Kate Miller-Heidke', song: 'Zero Gravity', youtube: "https://www.youtube.com/watch?v=VlpBPO9_L4E"},
    { countryKey: 'at', artist: 'Paenda', song: 'Limits', youtube: "https://www.youtube.com/watch?v=S2HFBexHDXk"},
    { countryKey: 'az', artist: 'Chingiz', song: 'Truth', youtube: "https://www.youtube.com/watch?v=iyZJ_aMw5hY"},
    { countryKey: 'by', artist: 'Zena', song: 'Like It', youtube: "https://www.youtube.com/watch?v=Ao93RTN90Xs"},
    { countryKey: 'be', artist: 'Eliot', song: 'Wake Up', youtube: "https://www.youtube.com/watch?v=17QXkQEckE4"},
    { countryKey: 'hr', artist: 'Roko', song: 'The Dream', youtube: "https://www.youtube.com/watch?v=-mYYWSEAa9s"},
    { countryKey: 'cy', artist: 'Tamta', song: 'Replay', youtube: "https://www.youtube.com/watch?v=ESkhPXfl4A0"},
    { countryKey: 'cz', artist: 'Lake Malawi', song: 'Friend of a Friend', youtube: "https://www.youtube.com/watch?v=yH1-uy9FYKE"},
    { countryKey: 'dk', artist: 'Leonora', song: 'Love Is Forever', youtube: "https://www.youtube.com/watch?v=fAdSQxaXsSk"},
    { countryKey: 'ee', artist: 'Victor Crone', song: 'Storm', youtube: "https://www.youtube.com/watch?v=CkdXzuDigNM"},
    { countryKey: 'fi', artist: 'Darude feat. Sebastian Rejman', song: 'Look Away', youtube: "https://www.youtube.com/watch?v=d4DPGAJhSac"},
    { countryKey: 'fr', artist: 'Bilal Hassani', song: 'Roi', youtube: "https://www.youtube.com/watch?v=VydsMYa9lyI"},
    { countryKey: 'ge', artist: 'Oto Nemsadze', song: 'Keep On Going', youtube: "https://www.youtube.com/watch?v=Blvo_Ol4Bzc"},
    { countryKey: 'de', artist: 'Sisters', song: 'Sister', youtube: "https://www.youtube.com/watch?v=t6ATkb0Gllk"},
    { countryKey: 'gr', artist: 'Katerine Duska', song: 'Better Love', youtube: "https://www.youtube.com/watch?v=ulQoRPcQVDc"},
    { countryKey: 'hu', artist: 'Joci Pápai', song: 'Az én apám', youtube: "https://www.youtube.com/watch?v=WVW_vZHYnkk"},
    { countryKey: 'is', artist: 'Hatari', song: 'Hatrið mun sigra', youtube: "https://www.youtube.com/watch?v=UGrRhIj4FRw"},
    { countryKey: 'ie', artist: 'Sarah McTernan', song: '22', youtube: "https://www.youtube.com/watch?v=LXBIDYh_UE4"},
    { countryKey: 'il', artist: 'Kobi Marimi', song: 'Home', youtube: "https://www.youtube.com/watch?v=7d__XXiVJkE"},
    { countryKey: 'it', artist: 'Mahmood', song: 'Soldi', youtube: "https://www.youtube.com/watch?v=22lISUXgSUw"},
    { countryKey: 'lv', artist: 'Carousel', song: 'That Night', youtube: "https://www.youtube.com/watch?v=6j61TWsjcJY"},
    { countryKey: 'lt', artist: 'Jurij Veklenko', song: 'Run with the Lions', youtube: "https://www.youtube.com/watch?v=ut-0TaybLRE"},
    { countryKey: 'mt', artist: 'Michela', song: 'Chameleon', youtube: "https://www.youtube.com/watch?v=tdyQ-ebzFgk"},
    { countryKey: 'md', artist: 'Anna Odobescu', song: 'Stay', youtube: "https://www.youtube.com/watch?v=p3OC8qhZBWQ"},
    { countryKey: 'me', artist: 'D mol', song: 'Heaven', youtube: "https://www.youtube.com/watch?v=EXmXfHhLBoQ"},
    { countryKey: 'nl', artist: 'Duncan Laurence', song: 'Arcade', youtube: "https://www.youtube.com/watch?v=51u5fnyrGj4"},
    { countryKey: 'mk', artist: 'Tamara Todevska', song: 'Proud', youtube: "https://www.youtube.com/watch?v=Sw-NQ1a1zZ0"},
    { countryKey: 'no', artist: 'Keiino', song: 'Spirit in the Sky', youtube: "https://www.youtube.com/watch?v=Ud7mYAI4Vtk"},
    { countryKey: 'pl', artist: 'Tulia', song: 'Fire of Love (Pali się)', youtube: "https://www.youtube.com/watch?v=hVkyOjwpUCQ"},
    { countryKey: 'pt', artist: 'Conan Osíris', song: 'Telemóveis', youtube: "https://www.youtube.com/watch?v=9t5_yUNp0bg"},
    { countryKey: 'ro', artist: 'Ester Peony', song: 'On a Sunday', youtube: "https://www.youtube.com/watch?v=T1dhF0_QyH0"},
    { countryKey: 'ru', artist: 'Sergey Lazarev', song: 'Scream', youtube: "https://www.youtube.com/watch?v=gEpUgRtXBss"},
    { countryKey: 'sm', artist: 'Serhat', song: 'Say Na Na Na', youtube: "https://www.youtube.com/watch?v=l5arNtTYK1s"},
    { countryKey: 'rs', artist: 'Nevena Božović', song: 'Kruna', youtube: "https://www.youtube.com/watch?v=osFxa9jfH04"},
    { countryKey: 'si', artist: 'Zala Kralj and Gašper Šantl', song: 'Sebi', youtube: "https://www.youtube.com/watch?v=2C9W7MbDivU"},
    { countryKey: 'es', artist: 'Miki', song: 'La venda', youtube: "https://www.youtube.com/watch?v=pEaS6atxFgc"},
    { countryKey: 'se', artist: 'John Lundvik', song: 'Too Late for Love', youtube: "https://www.youtube.com/watch?v=iEEuG5XML-A"},
    { countryKey: 'ch', artist: 'Luca Hänni', song: 'She Got Me', youtube: "https://www.youtube.com/watch?v=6PxoMWtAC7M"},
    { countryKey: 'gb', artist: 'Michael Rice', song: 'Bigger than Us', youtube: "https://www.youtube.com/watch?v=WOBhTgSrXJQ"}  
];