import { CountryContestant } from "./CountryContestant";

export const cachedYear = '2024';

// the initial country contestant list (from 2024) should be cached 
// to improve performance on the first load of the page
export const initialCountryContestantCache = [
    {
        "id": "a",
        "uid": "bmi",
        "country": {
            "id": "a",
            "name": "Albania",
            "key": "al",
            "icon": "flag-icon-al"
        },
        "contestant": {
            "id": "bmi",
            "countryKey": "al",
            "artist": "Besa Kokëdhima",
            "song": "Titan",
            "youtube": "https://www.youtube.com/watch?v=nrjFhjpm7D8",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "b",
        "uid": "bnh",
        "country": {
            "id": "b",
            "name": "Armenia",
            "key": "am",
            "icon": "flag-icon-am"
        },
        "contestant": {
            "id": "bnh",
            "countryKey": "am",
            "artist": "LADANIVA",
            "song": "Jako",
            "youtube": "https://www.youtube.com/watch?v=_6xfmW0Fc40",
            "finalsRank": "8",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 183,
                "juryPoints": 101,
                "telePoints": 82,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "c",
        "uid": "bnb",
        "country": {
            "id": "c",
            "name": "Australia",
            "key": "au",
            "icon": "flag-icon-au"
        },
        "contestant": {
            "id": "bnb",
            "countryKey": "au",
            "artist": "Electric Fields",
            "song": "One Milkali (One Blood)",
            "youtube": "https://www.youtube.com/watch?v=f1wwqQ41txw",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": ".d",
        "uid": "bna",
        "country": {
            "id": ".d",
            "name": "Austria",
            "key": "at",
            "icon": "flag-icon-at"
        },
        "contestant": {
            "id": "bna",
            "countryKey": "at",
            "artist": "Kaleen",
            "song": "We Will Rave",
            "youtube": "https://www.youtube.com/watch?v=Kqda15G4T-4",
            "finalsRank": "24",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 24,
                "juryPoints": 19,
                "telePoints": 5,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": ".e",
        "uid": "bni",
        "country": {
            "id": ".e",
            "name": "Azerbaijan",
            "key": "az",
            "icon": "flag-icon-az"
        },
        "contestant": {
            "id": "bni",
            "countryKey": "az",
            "artist": "FAHREE feat. Ilkin Dovlatov",
            "song": "Özünlə Apar",
            "youtube": "https://www.youtube.com/watch?v=NNhAk4rVgNc",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": ".g",
        "uid": "bm0",
        "country": {
            "id": ".g",
            "name": "Belgium",
            "key": "be",
            "icon": "flag-icon-be"
        },
        "contestant": {
            "id": "bm0",
            "countryKey": "be",
            "artist": "Mustii",
            "song": "Before the Party's Over",
            "youtube": "https://www.youtube.com/watch?v=WCe9zrWEFNc",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "i",
        "uid": "bm1",
        "country": {
            "id": "i",
            "name": "Croatia",
            "key": "hr",
            "icon": "flag-icon-hr"
        },
        "contestant": {
            "id": "bm1",
            "countryKey": "hr",
            "artist": "Baby Lasagna",
            "song": "Rim Tim Tagi Dim",
            "youtube": "https://www.youtube.com/watch?v=kmg8EAD-Kjw",
            "finalsRank": "2",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 547,
                "juryPoints": 210,
                "telePoints": 337,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "j",
        "uid": "bm2",
        "country": {
            "id": "j",
            "name": "Cyprus",
            "key": "cy",
            "icon": "flag-icon-cy"
        },
        "contestant": {
            "id": "bm2",
            "countryKey": "cy",
            "artist": "Silia Kapsis",
            "song": "Liar",
            "youtube": "https://www.youtube.com/watch?v=8q5QozrtEPA",
            "finalsRank": "15",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 78,
                "juryPoints": 34,
                "telePoints": 44,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "k",
        "uid": "bmj",
        "country": {
            "id": "k",
            "name": "Czechia",
            "key": "cz",
            "icon": "flag-icon-cz"
        },
        "contestant": {
            "id": "bmj",
            "countryKey": "cz",
            "artist": "Aiko",
            "song": "Pedestal",
            "youtube": "https://www.youtube.com/watch?v=5DbRldMKFUU",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "l",
        "uid": "bmv",
        "country": {
            "id": "l",
            "name": "Denmark",
            "key": "dk",
            "icon": "flag-icon-dk"
        },
        "contestant": {
            "id": "bmv",
            "countryKey": "dk",
            "artist": "Saba",
            "song": "Sand",
            "youtube": "https://www.youtube.com/watch?v=3pCtdFnv9eQ",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "m",
        "uid": "bmw",
        "country": {
            "id": "m",
            "name": "Estonia",
            "key": "ee",
            "icon": "flag-icon-ee"
        },
        "contestant": {
            "id": "bmw",
            "countryKey": "ee",
            "artist": "5miinust and Puuluup",
            "song": "(Nendest) narkootikumidest ei tea me (küll) midagi",
            "youtube": "https://www.youtube.com/watch?v=ui_u0M7_hjs",
            "finalsRank": "20",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 37,
                "juryPoints": 4,
                "telePoints": 33,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "n",
        "uid": "bms",
        "country": {
            "id": "n",
            "name": "Finland",
            "key": "fi",
            "icon": "flag-icon-fi"
        },
        "contestant": {
            "id": "bms",
            "countryKey": "fi",
            "artist": "Windows95man",
            "song": "No Rules!",
            "youtube": "https://www.youtube.com/watch?v=Tf1NS1vEhSg",
            "finalsRank": "19",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 38,
                "juryPoints": 7,
                "telePoints": 31,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "o",
        "uid": "bmk",
        "country": {
            "id": "o",
            "name": "France",
            "key": "fr",
            "icon": "flag-icon-fr"
        },
        "contestant": {
            "id": "bmk",
            "countryKey": "fr",
            "artist": "Slimane",
            "song": "Mon amour",
            "youtube": "https://www.youtube.com/watch?v=bal8oESDH7s",
            "finalsRank": "4",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 445,
                "juryPoints": 218,
                "telePoints": 227,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "p",
        "uid": "bng",
        "country": {
            "id": "p",
            "name": "Georgia",
            "key": "ge",
            "icon": "flag-icon-ge"
        },
        "contestant": {
            "id": "bng",
            "countryKey": "ge",
            "artist": "Nutsa Buzaladze",
            "song": "Firefighter",
            "youtube": "https://www.youtube.com/watch?v=blMwY8Jabyk",
            "finalsRank": "21",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 34,
                "juryPoints": 15,
                "telePoints": 19,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "q",
        "uid": "bmx",
        "country": {
            "id": "q",
            "name": "Germany",
            "key": "de",
            "icon": "flag-icon-de"
        },
        "contestant": {
            "id": "bmx",
            "countryKey": "de",
            "artist": "Isaak",
            "song": "Always on the Run",
            "youtube": "https://www.youtube.com/watch?v=twhq3S4YHdQ",
            "finalsRank": "12",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 117,
                "juryPoints": 99,
                "telePoints": 18,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "r",
        "uid": "bnd",
        "country": {
            "id": "r",
            "name": "Greece",
            "key": "gr",
            "icon": "flag-icon-gr"
        },
        "contestant": {
            "id": "bnd",
            "countryKey": "gr",
            "artist": "Marina Satti",
            "song": "ZARI",
            "youtube": "https://www.youtube.com/watch?v=mTSTnLWGUPs",
            "finalsRank": "11",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 126,
                "juryPoints": 41,
                "telePoints": 85,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "t",
        "uid": "bm7",
        "country": {
            "id": "t",
            "name": "Iceland",
            "key": "is",
            "icon": "flag-icon-is"
        },
        "contestant": {
            "id": "bm7",
            "countryKey": "is",
            "artist": "Hera Björk",
            "song": "Scared of Heights",
            "youtube": "https://www.youtube.com/watch?v=i0zn27qa1BA",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "u",
        "uid": "bml",
        "country": {
            "id": "u",
            "name": "Ireland",
            "key": "ie",
            "icon": "flag-icon-ie"
        },
        "contestant": {
            "id": "bml",
            "countryKey": "ie",
            "artist": "Bambie Thug",
            "song": "Doomsday Blue",
            "youtube": "https://www.youtube.com/watch?v=n73nIfFI3k4",
            "finalsRank": "6",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 278,
                "juryPoints": 142,
                "telePoints": 136,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "v",
        "uid": "bnc",
        "country": {
            "id": "v",
            "name": "Israel",
            "key": "il",
            "icon": "flag-icon-il"
        },
        "contestant": {
            "id": "bnc",
            "countryKey": "il",
            "artist": "Eden Golan",
            "song": "Hurricane",
            "youtube": "https://www.youtube.com/watch?v=lJYn09tuPw4",
            "finalsRank": "5",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 375,
                "juryPoints": 52,
                "telePoints": 323,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "w",
        "uid": "bmt",
        "country": {
            "id": "w",
            "name": "Italy",
            "key": "it",
            "icon": "flag-icon-it"
        },
        "contestant": {
            "id": "bmt",
            "countryKey": "it",
            "artist": "Angelina Mango",
            "song": "La noia",
            "youtube": "https://www.youtube.com/watch?v=psiytW9Or2s",
            "finalsRank": "7",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 268,
                "juryPoints": 164,
                "telePoints": 104,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "x",
        "uid": "bmu",
        "country": {
            "id": "x",
            "name": "Latvia",
            "key": "lv",
            "icon": "flag-icon-lv"
        },
        "contestant": {
            "id": "bmu",
            "countryKey": "lv",
            "artist": "Dons",
            "song": "Hollow",
            "youtube": "https://www.youtube.com/watch?v=V_Jhif6qXyY",
            "finalsRank": "16",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 64,
                "juryPoints": 36,
                "telePoints": 28,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "y",
        "uid": "bmy",
        "country": {
            "id": "y",
            "name": "Lithuania",
            "key": "lt",
            "icon": "flag-icon-lt"
        },
        "contestant": {
            "id": "bmy",
            "countryKey": "lt",
            "artist": "Silvester Belt",
            "song": "Luktelk",
            "youtube": "https://www.youtube.com/watch?v=OrL668EQRu0",
            "finalsRank": "14",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 90,
                "juryPoints": 32,
                "telePoints": 58,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "z",
        "uid": "bmm",
        "country": {
            "id": "z",
            "name": "Luxembourg",
            "key": "lu",
            "icon": "flag-icon-lu"
        },
        "contestant": {
            "id": "bmm",
            "countryKey": "lu",
            "artist": "Tali",
            "song": "Fighter",
            "youtube": "https://www.youtube.com/watch?v=HV3sORfrREE",
            "finalsRank": "13",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 103,
                "juryPoints": 83,
                "telePoints": 20,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "0",
        "uid": "bmn",
        "country": {
            "id": "0",
            "name": "Malta",
            "key": "mt",
            "icon": "flag-icon-mt"
        },
        "contestant": {
            "id": "bmn",
            "countryKey": "mt",
            "artist": "Sarah Bonnici",
            "song": "Loop",
            "youtube": "https://www.youtube.com/watch?v=-IIxDNyIBdE",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "1",
        "uid": "bmz",
        "country": {
            "id": "1",
            "name": "Moldova",
            "key": "md",
            "icon": "flag-icon-md"
        },
        "contestant": {
            "id": "bmz",
            "countryKey": "md",
            "artist": "Natalia Barbu",
            "song": "In the Middle",
            "youtube": "https://www.youtube.com/watch?v=Jom9sNL5whs",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "3",
        "uid": "bm3",
        "country": {
            "id": "3",
            "name": "Netherlands",
            "key": "nl",
            "icon": "flag-icon-nl"
        },
        "contestant": {
            "id": "bm3",
            "countryKey": "nl",
            "artist": "Joost Klein",
            "song": "Europapa",
            "youtube": "https://www.youtube.com/watch?v=gT2wY0DjYGo",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "4",
        "uid": "bmo",
        "country": {
            "id": "4",
            "name": "Norway",
            "key": "no",
            "icon": "flag-icon-no"
        },
        "contestant": {
            "id": "bmo",
            "countryKey": "no",
            "artist": "Gåte",
            "song": "Ulveham",
            "youtube": "https://www.youtube.com/watch?v=UipzszlJwRQ",
            "finalsRank": "25",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 16,
                "juryPoints": 12,
                "telePoints": 4,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "6",
        "uid": "bm4",
        "country": {
            "id": "6",
            "name": "Poland",
            "key": "pl",
            "icon": "flag-icon-pl"
        },
        "contestant": {
            "id": "bm4",
            "countryKey": "pl",
            "artist": "Luna",
            "song": "The Tower",
            "youtube": "https://www.youtube.com/watch?v=IhvDkF9XZx0",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": "7",
        "uid": "bne",
        "country": {
            "id": "7",
            "name": "Portugal",
            "key": "pt",
            "icon": "flag-icon-pt"
        },
        "contestant": {
            "id": "bne",
            "countryKey": "pt",
            "artist": "Iolanda",
            "song": "Grito",
            "youtube": "https://www.youtube.com/watch?v=K5wDGhcDSpQ",
            "finalsRank": "10",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 152,
                "juryPoints": 139,
                "telePoints": 13,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": ".a",
        "uid": "bm5",
        "country": {
            "id": ".a",
            "name": "San Marino",
            "key": "sm",
            "icon": "flag-icon-sm"
        },
        "contestant": {
            "id": "bm5",
            "countryKey": "sm",
            "artist": "Megara",
            "song": "11:11",
            "youtube": "https://www.youtube.com/watch?v=f1tgNLfcIOw",
            "finalsRank": "",
            "semiFinalsRank": "",
            "year": "2024"
        }
    },
    {
        "id": ".b",
        "uid": "bm8",
        "country": {
            "id": ".b",
            "name": "Serbia",
            "key": "rs",
            "icon": "flag-icon-rs"
        },
        "contestant": {
            "id": "bm8",
            "countryKey": "rs",
            "artist": "Teya Dora",
            "song": "Ramonda",
            "youtube": "https://www.youtube.com/watch?v=SDXB0mXFR34",
            "finalsRank": "17",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 54,
                "juryPoints": 22,
                "telePoints": 32,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": ".c",
        "uid": "bmp",
        "country": {
            "id": ".c",
            "name": "Slovenia",
            "key": "si",
            "icon": "flag-icon-si"
        },
        "contestant": {
            "id": "bmp",
            "countryKey": "si",
            "artist": "Raiven",
            "song": "Veronika",
            "youtube": "https://www.youtube.com/watch?v=uWcSsi7SliI",
            "finalsRank": "23",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 27,
                "juryPoints": 15,
                "telePoints": 12,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "d",
        "uid": "bmq",
        "country": {
            "id": "d",
            "name": "Spain",
            "key": "es",
            "icon": "flag-icon-es"
        },
        "contestant": {
            "id": "bmq",
            "countryKey": "es",
            "artist": "Nebulossa",
            "song": "Zorra",
            "youtube": "https://www.youtube.com/watch?v=GdagS_0hX8k",
            "finalsRank": "22",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 30,
                "juryPoints": 19,
                "telePoints": 11,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "e",
        "uid": "bnf",
        "country": {
            "id": "e",
            "name": "Sweden",
            "key": "se",
            "icon": "flag-icon-se"
        },
        "contestant": {
            "id": "bnf",
            "countryKey": "se",
            "artist": "Marcus & Martinus",
            "song": "Unforgettable",
            "youtube": "https://www.youtube.com/watch?v=yekc8t0rJqA",
            "finalsRank": "9",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 166,
                "juryPoints": 117,
                "telePoints": 49,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "f",
        "uid": "bm6",
        "country": {
            "id": "f",
            "name": "Switzerland",
            "key": "ch",
            "icon": "flag-icon-ch"
        },
        "contestant": {
            "id": "bm6",
            "countryKey": "ch",
            "artist": "Nemo",
            "song": "The Code",
            "youtube": "https://www.youtube.com/watch?v=kiGDvM14Kwg",
            "finalsRank": "1",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 591,
                "juryPoints": 365,
                "telePoints": 226,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "g",
        "uid": "bmr",
        "country": {
            "id": "g",
            "name": "Ukraine",
            "key": "ua",
            "icon": "flag-icon-ua"
        },
        "contestant": {
            "id": "bmr",
            "countryKey": "ua",
            "artist": "Alyona Alyona and Jerry Heil",
            "song": "Teresa & Maria",
            "youtube": "https://www.youtube.com/watch?v=k_8cNbF8FLI",
            "finalsRank": "3",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 453,
                "juryPoints": 146,
                "telePoints": 307,
                "year": "2024",
                "round": "Final"
            }
        }
    },
    {
        "id": "h",
        "uid": "bm9",
        "country": {
            "id": "h",
            "name": "United Kingdom",
            "key": "gb",
            "icon": "flag-icon-gb"
        },
        "contestant": {
            "id": "bm9",
            "countryKey": "gb",
            "artist": "Olly Alexander",
            "song": "Dizzy",
            "youtube": "https://www.youtube.com/watch?v=lLNUj7kvn2w",
            "finalsRank": "18",
            "semiFinalsRank": "",
            "year": "2024",
            "votes": {
                "totalPoints": 46,
                "juryPoints": 46,
                "year": "2024",
                "round": "Final"
            }
        }
    }
] as unknown as CountryContestant[]