import { CountryContestant } from "./CountryContestant";

export const cachedYear = '2023';

// the initial country contestant list (from 2023) should be cached 
// to improve performance on the first load of the page
export const initialCountryContestantCache = [
    {
        "id": "a",
        "country": {
            "id": "a",
            "name": "Albania",
            "key": "al",
            "icon": "flag-icon-al"
        },
        "contestant": {
            "countryKey": "al",
            "artist": "Albina & Familja Kelmendi",
            "song": "Duje",
            "youtube": "https://www.youtube.com/watch?v=mp8OG4ApocI",
            "finalsRank": "22.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 76,
                "juryPoints": 17,
                "telePoints": 59
            }
        }
    },
    {
        "id": "b",
        "country": {
            "id": "b",
            "name": "Armenia",
            "key": "am",
            "icon": "flag-icon-am"
        },
        "contestant": {
            "countryKey": "am",
            "artist": "Brunette",
            "song": "Future Lover",
            "youtube": "https://www.youtube.com/watch?v=Co8ZJIejXBA",
            "finalsRank": "14.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 122,
                "juryPoints": 69,
                "telePoints": 53
            }
        }
    },
    {
        "id": "c",
        "country": {
            "id": "c",
            "name": "Australia",
            "key": "au",
            "icon": "flag-icon-au"
        },
        "contestant": {
            "countryKey": "au",
            "artist": "Voyager",
            "song": "Promise",
            "youtube": "https://www.youtube.com/watch?v=aqtu2GspT80",
            "finalsRank": "9.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 151,
                "juryPoints": 130,
                "telePoints": 21
            }
        }
    },
    {
        "id": ".d",
        "country": {
            "id": ".d",
            "name": "Austria",
            "key": "at",
            "icon": "flag-icon-at"
        },
        "contestant": {
            "countryKey": "at",
            "artist": "Teya & Salena",
            "song": "Who The Hell Is Edgar?",
            "youtube": "https://www.youtube.com/watch?v=ZMmLeV47Au4",
            "finalsRank": "15.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 120,
                "juryPoints": 104,
                "telePoints": 16
            }
        }
    },
    {
        "id": ".e",
        "country": {
            "id": ".e",
            "name": "Azerbaijan",
            "key": "az",
            "icon": "flag-icon-az"
        },
        "contestant": {
            "countryKey": "az",
            "artist": "TuralTuranX",
            "song": "Tell Me More",
            "youtube": "https://www.youtube.com/watch?v=5dvsr-L3HgY",
            "finalsRank": "",
            "semiFinalsRank": "14.0"
        }
    },
    {
        "id": ".g",
        "country": {
            "id": ".g",
            "name": "Belgium",
            "key": "be",
            "icon": "flag-icon-be"
        },
        "contestant": {
            "countryKey": "be",
            "artist": "Gustaph",
            "song": "Because of You",
            "youtube": "https://www.youtube.com/watch?v=ORhEoS6d8e4",
            "finalsRank": "7.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 182,
                "juryPoints": 127,
                "telePoints": 55
            }
        }
    },
    {
        "id": "i",
        "country": {
            "id": "i",
            "name": "Croatia",
            "key": "hr",
            "icon": "flag-icon-hr"
        },
        "contestant": {
            "countryKey": "hr",
            "artist": "Let 3",
            "song": "Mama ŠČ!",
            "youtube": "https://www.youtube.com/watch?v=AyKj8jA0Qoc",
            "finalsRank": "13.0",
            "semiFinalsRank": "8.0",
            "votes": {
                "totalPoints": 123,
                "juryPoints": 11,
                "telePoints": 112
            }
        }
    },
    {
        "id": "j",
        "country": {
            "id": "j",
            "name": "Cyprus",
            "key": "cy",
            "icon": "flag-icon-cy"
        },
        "contestant": {
            "countryKey": "cy",
            "artist": "Andrew Lambrou",
            "song": "Break a Broken Heart",
            "youtube": "https://www.youtube.com/watch?v=zrFUKqTy4zI",
            "finalsRank": "12.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 126,
                "juryPoints": 68,
                "telePoints": 58
            }
        }
    },
    {
        "id": "k",
        "country": {
            "id": "k",
            "name": "Czechia",
            "key": "cz",
            "icon": "flag-icon-cz"
        },
        "contestant": {
            "countryKey": "cz",
            "artist": "Vesna",
            "song": "My Sister's Crown",
            "youtube": "https://www.youtube.com/watch?v=-y78qgDlzAM",
            "finalsRank": "10.0",
            "semiFinalsRank": "4.0",
            "votes": {
                "totalPoints": 129,
                "juryPoints": 94,
                "telePoints": 35
            }
        }
    },
    {
        "id": "l",
        "country": {
            "id": "l",
            "name": "Denmark",
            "key": "dk",
            "icon": "flag-icon-dk"
        },
        "contestant": {
            "countryKey": "dk",
            "artist": "Reiley",
            "song": "Breaking My Heart",
            "youtube": "https://www.youtube.com/watch?v=04C8E7PUMQo",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": "m",
        "country": {
            "id": "m",
            "name": "Estonia",
            "key": "ee",
            "icon": "flag-icon-ee"
        },
        "contestant": {
            "countryKey": "ee",
            "artist": "Alika",
            "song": "Bridges",
            "youtube": "https://www.youtube.com/watch?v=IQ27JHhR3Ug",
            "finalsRank": "8.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 168,
                "juryPoints": 146,
                "telePoints": 22
            }
        }
    },
    {
        "id": "n",
        "country": {
            "id": "n",
            "name": "Finland",
            "key": "fi",
            "icon": "flag-icon-fi"
        },
        "contestant": {
            "countryKey": "fi",
            "artist": "Käärijä",
            "song": "Cha Cha Cha",
            "youtube": "https://www.youtube.com/watch?v=znWi3zN8Ucg",
            "finalsRank": "2.0",
            "semiFinalsRank": "1.0",
            "votes": {
                "totalPoints": 526,
                "juryPoints": 150,
                "telePoints": 376
            }
        }
    },
    {
        "id": "o",
        "country": {
            "id": "o",
            "name": "France",
            "key": "fr",
            "icon": "flag-icon-fr"
        },
        "contestant": {
            "countryKey": "fr",
            "artist": "La Zarra",
            "song": "Évidemment",
            "youtube": "https://www.youtube.com/watch?v=GWfbEFH9NvQ",
            "finalsRank": "16.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 104,
                "juryPoints": 54,
                "telePoints": 50
            }
        }
    },
    {
        "id": "p",
        "country": {
            "id": "p",
            "name": "Georgia",
            "key": "ge",
            "icon": "flag-icon-ge"
        },
        "contestant": {
            "countryKey": "ge",
            "artist": "Iru",
            "song": "Echo",
            "youtube": "https://www.youtube.com/watch?v=E8kO-QPippo",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": "q",
        "country": {
            "id": "q",
            "name": "Germany",
            "key": "de",
            "icon": "flag-icon-de"
        },
        "contestant": {
            "countryKey": "de",
            "artist": "Lord Of The Lost",
            "song": "Blood & Glitter",
            "youtube": "https://www.youtube.com/watch?v=5I9CYu668jA",
            "finalsRank": "26.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 18,
                "juryPoints": 3,
                "telePoints": 15
            }
        }
    },
    {
        "id": "r",
        "country": {
            "id": "r",
            "name": "Greece",
            "key": "gr",
            "icon": "flag-icon-gr"
        },
        "contestant": {
            "countryKey": "gr",
            "artist": "Victor Vernicos",
            "song": "What They Say",
            "youtube": "https://www.youtube.com/watch?v=qL0EkId_sTY",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": "t",
        "country": {
            "id": "t",
            "name": "Iceland",
            "key": "is",
            "icon": "flag-icon-is"
        },
        "contestant": {
            "countryKey": "is",
            "artist": "Diljá",
            "song": "Power",
            "youtube": "https://www.youtube.com/watch?v=BhlJXcCv7gw",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": "u",
        "country": {
            "id": "u",
            "name": "Ireland",
            "key": "ie",
            "icon": "flag-icon-ie"
        },
        "contestant": {
            "countryKey": "ie",
            "artist": "Wild Youth",
            "song": "We Are One",
            "youtube": "https://www.youtube.com/watch?v=ak5Fevs424Y",
            "finalsRank": "",
            "semiFinalsRank": "12.0"
        }
    },
    {
        "id": "v",
        "country": {
            "id": "v",
            "name": "Israel",
            "key": "il",
            "icon": "flag-icon-il"
        },
        "contestant": {
            "countryKey": "il",
            "artist": "Noa Kirel",
            "song": "Unicorn",
            "youtube": "https://www.youtube.com/watch?v=r4wbdKmM3bQ",
            "finalsRank": "3.0",
            "semiFinalsRank": "3.0",
            "votes": {
                "totalPoints": 362,
                "juryPoints": 177,
                "telePoints": 185
            }
        }
    },
    {
        "id": "w",
        "country": {
            "id": "w",
            "name": "Italy",
            "key": "it",
            "icon": "flag-icon-it"
        },
        "contestant": {
            "countryKey": "it",
            "artist": "Marco Mengoni",
            "song": "Due vite",
            "youtube": "https://www.youtube.com/watch?v=_iS4STWKSvk",
            "finalsRank": "4.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 350,
                "juryPoints": 176,
                "telePoints": 174
            }
        }
    },
    {
        "id": "x",
        "country": {
            "id": "x",
            "name": "Latvia",
            "key": "lv",
            "icon": "flag-icon-lv"
        },
        "contestant": {
            "countryKey": "lv",
            "artist": "Sudden Lights",
            "song": "Aijā",
            "youtube": "https://www.youtube.com/watch?v=XRV2-jPqaUw",
            "finalsRank": "",
            "semiFinalsRank": "11.0"
        }
    },
    {
        "id": "y",
        "country": {
            "id": "y",
            "name": "Lithuania",
            "key": "lt",
            "icon": "flag-icon-lt"
        },
        "contestant": {
            "countryKey": "lt",
            "artist": "Monika Linkytė",
            "song": "Stay",
            "youtube": "https://www.youtube.com/watch?v=68lbEUDuWUQ",
            "finalsRank": "11.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 127,
                "juryPoints": 81,
                "telePoints": 46
            }
        }
    },
    {
        "id": "0",
        "country": {
            "id": "0",
            "name": "Malta",
            "key": "mt",
            "icon": "flag-icon-mt"
        },
        "contestant": {
            "countryKey": "mt",
            "artist": "The Busker",
            "song": "Dance (Our Own Party)",
            "youtube": "https://www.youtube.com/watch?v=Apqwl0ayL6A",
            "finalsRank": "",
            "semiFinalsRank": "15.0"
        }
    },
    {
        "id": "1",
        "country": {
            "id": "1",
            "name": "Moldova",
            "key": "md",
            "icon": "flag-icon-md"
        },
        "contestant": {
            "countryKey": "md",
            "artist": "Pasha Parfeni",
            "song": "Soarele și Luna",
            "youtube": "https://www.youtube.com/watch?v=se9LDgFW6ak",
            "finalsRank": "18.0",
            "semiFinalsRank": "5.0",
            "votes": {
                "totalPoints": 96,
                "juryPoints": 20,
                "telePoints": 76
            }
        }
    },
    {
        "id": "3",
        "country": {
            "id": "3",
            "name": "Netherlands",
            "key": "nl",
            "icon": "flag-icon-nl"
        },
        "contestant": {
            "countryKey": "nl",
            "artist": "Mia Nicolai & Dion Cooper",
            "song": "Burning Daylight",
            "youtube": "https://www.youtube.com/watch?v=UOf-oKDlO6A",
            "finalsRank": "",
            "semiFinalsRank": "13.0"
        }
    },
    {
        "id": "4",
        "country": {
            "id": "4",
            "name": "Norway",
            "key": "no",
            "icon": "flag-icon-no"
        },
        "contestant": {
            "countryKey": "no",
            "artist": "Alessandra",
            "song": "Queen of Kings",
            "youtube": "https://www.youtube.com/watch?v=vSfffjHjdTk",
            "finalsRank": "5.0",
            "semiFinalsRank": "6.0",
            "votes": {
                "totalPoints": 268,
                "juryPoints": 52,
                "telePoints": 216
            }
        }
    },
    {
        "id": "6",
        "country": {
            "id": "6",
            "name": "Poland",
            "key": "pl",
            "icon": "flag-icon-pl"
        },
        "contestant": {
            "countryKey": "pl",
            "artist": "Blanka",
            "song": "Solo",
            "youtube": "https://www.youtube.com/watch?v=PvQRpV1-ZhY",
            "finalsRank": "19.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 93,
                "juryPoints": 12,
                "telePoints": 81
            }
        }
    },
    {
        "id": "7",
        "country": {
            "id": "7",
            "name": "Portugal",
            "key": "pt",
            "icon": "flag-icon-pt"
        },
        "contestant": {
            "countryKey": "pt",
            "artist": "Mimicat",
            "song": "Ai Coração",
            "youtube": "https://www.youtube.com/watch?v=-uY37gGPkNU",
            "finalsRank": "23.0",
            "semiFinalsRank": "9.0",
            "votes": {
                "totalPoints": 59,
                "juryPoints": 43,
                "telePoints": 16
            }
        }
    },
    {
        "id": "8",
        "country": {
            "id": "8",
            "name": "Romania",
            "key": "ro",
            "icon": "flag-icon-ro"
        },
        "contestant": {
            "countryKey": "ro",
            "artist": "Theodor Andrei",
            "song": "D.G.T. (Off and On)",
            "youtube": "https://www.youtube.com/watch?v=NRxv-AUCinQ",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": ".a",
        "country": {
            "id": ".a",
            "name": "San Marino",
            "key": "sm",
            "icon": "flag-icon-sm"
        },
        "contestant": {
            "countryKey": "sm",
            "artist": "Piqued Jacks",
            "song": "Like An Animal",
            "youtube": "https://www.youtube.com/watch?v=D1opw3IpJWA",
            "finalsRank": "",
            "semiFinalsRank": ""
        }
    },
    {
        "id": ".b",
        "country": {
            "id": ".b",
            "name": "Serbia",
            "key": "rs",
            "icon": "flag-icon-rs"
        },
        "contestant": {
            "countryKey": "rs",
            "artist": "Luke Black",
            "song": "Samo mi se spava",
            "youtube": "https://www.youtube.com/watch?v=oeIVwYUge8o",
            "finalsRank": "24.0",
            "semiFinalsRank": "10.0",
            "votes": {
                "totalPoints": 30,
                "juryPoints": 14,
                "telePoints": 16
            }
        }
    },
    {
        "id": ".c",
        "country": {
            "id": ".c",
            "name": "Slovenia",
            "key": "si",
            "icon": "flag-icon-si"
        },
        "contestant": {
            "countryKey": "si",
            "artist": "Joker Out",
            "song": "Carpe Diem",
            "youtube": "https://www.youtube.com/watch?v=zDBSIGITdY4",
            "finalsRank": "21.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 78,
                "juryPoints": 33,
                "telePoints": 45
            }
        }
    },
    {
        "id": "d",
        "country": {
            "id": "d",
            "name": "Spain",
            "key": "es",
            "icon": "flag-icon-es"
        },
        "contestant": {
            "countryKey": "es",
            "artist": "Blanca Paloma",
            "song": "Eaea",
            "youtube": "https://www.youtube.com/watch?v=NGnEoSypBhE",
            "finalsRank": "17.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 100,
                "juryPoints": 95,
                "telePoints": 5
            }
        }
    },
    {
        "id": "e",
        "country": {
            "id": "e",
            "name": "Sweden",
            "key": "se",
            "icon": "flag-icon-se"
        },
        "contestant": {
            "countryKey": "se",
            "artist": "Loreen",
            "song": "Tattoo",
            "youtube": "https://www.youtube.com/watch?v=b3vJfR81xO0",
            "finalsRank": "1.0",
            "semiFinalsRank": "2.0",
            "votes": {
                "totalPoints": 583,
                "juryPoints": 340,
                "telePoints": 243
            }
        }
    },
    {
        "id": "f",
        "country": {
            "id": "f",
            "name": "Switzerland",
            "key": "ch",
            "icon": "flag-icon-ch"
        },
        "contestant": {
            "countryKey": "ch",
            "artist": "Remo Forrer",
            "song": "Watergun",
            "youtube": "https://www.youtube.com/watch?v=_8-Sbc_GZMc",
            "finalsRank": "20.0",
            "semiFinalsRank": "7.0",
            "votes": {
                "totalPoints": 92,
                "juryPoints": 61,
                "telePoints": 31
            }
        }
    },
    {
        "id": "g",
        "country": {
            "id": "g",
            "name": "Ukraine",
            "key": "ua",
            "icon": "flag-icon-ua"
        },
        "contestant": {
            "countryKey": "ua",
            "artist": "Tvorchi",
            "song": "Heart of Steel",
            "youtube": "https://www.youtube.com/watch?v=neIscK1hNxs",
            "finalsRank": "6.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 243,
                "juryPoints": 54,
                "telePoints": 189
            }
        }
    },
    {
        "id": "h",
        "country": {
            "id": "h",
            "name": "United Kingdom",
            "key": "gb",
            "icon": "flag-icon-gb"
        },
        "contestant": {
            "countryKey": "gb",
            "artist": "Mae Muller",
            "song": "I Wrote A Song",
            "youtube": "https://www.youtube.com/watch?v=tJ21grjN6wU",
            "finalsRank": "25.0",
            "semiFinalsRank": "",
            "votes": {
                "totalPoints": 24,
                "juryPoints": 15,
                "telePoints": 9
            }
        }
    }
] as unknown as CountryContestant[]