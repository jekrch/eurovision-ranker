import { CountryContestant } from "./CountryContestant";

export const cachedYear = '2024';

// the initial country contestant list (from 2023) should be cached 
// to improve performance on the first load of the page
export const initialCountryContestantCache = [
    {
      id: 'a',
      country: { id: 'a', name: 'Albania', key: 'al', icon: 'flag-icon-al' },
      contestant: {
        countryKey: 'al',
        artist: 'Besa Kokëdhima',
        song: "Titan",
        youtube: 'https://www.youtube.com/watch?v=nrjFhjpm7D8',
        votes: undefined
      }
    },
    {
      id: 'b',
      country: { id: 'b', name: 'Armenia', key: 'am', icon: 'flag-icon-am' },
      contestant: {
        countryKey: 'am',
        artist: 'LADANIVA',
        song: 'Jako',
        youtube: 'https://www.youtube.com/watch?v=_6xfmW0Fc40',
        votes: undefined
      }
    },
    {
      id: 'c',
      country: { id: 'c', name: 'Australia', key: 'au', icon: 'flag-icon-au' },
      contestant: {
        countryKey: 'au',
        artist: 'Electric Fields',
        song: 'One Milkali (One Blood)',
        youtube: 'https://www.youtube.com/watch?v=f1wwqQ41txw',
        votes: undefined
      }
    },
    {
      id: '.d',
      country: { id: '.d', name: 'Austria', key: 'at', icon: 'flag-icon-at' },
      contestant: {
        countryKey: 'at',
        artist: 'Kaleen',
        song: 'We Will Rave',
        youtube: 'https://www.youtube.com/watch?v=Kqda15G4T-4',
        votes: undefined
      }
    },
    {
      id: '.e',
      country: { id: '.e', name: 'Azerbaijan', key: 'az', icon: 'flag-icon-az' },
      contestant: { countryKey: 'az', artist: 'FAHREE feat. Ilkin Dovlatov', song: 'Özünlə Apar', votes: undefined, youtube: 'https://www.youtube.com/watch?v=NNhAk4rVgNc' }
    },
    {
      id: '.g',
      country: { id: '.g', name: 'Belgium', key: 'be', icon: 'flag-icon-be' },
      contestant: {
        countryKey: 'be',
        artist: 'Mustii',
        song: "Before the Party's Over",
        youtube: 'https://www.youtube.com/watch?v=WCe9zrWEFNc',
        votes: undefined
      }
    },
    {
      id: 'i',
      country: { id: 'i', name: 'Croatia', key: 'hr', icon: 'flag-icon-hr' },
      contestant: {
        countryKey: 'hr',
        artist: 'Baby Lasagna',
        song: 'Rim Tim Tagi Dim',
        youtube: 'https://www.youtube.com/watch?v=kmg8EAD-Kjw',
        votes: undefined
      }
    },
    {
      id: 'j',
      country: { id: 'j', name: 'Cyprus', key: 'cy', icon: 'flag-icon-cy' },
      contestant: {
        countryKey: 'cy',
        artist: 'Silia Kapsis',
        song: 'Liar',
        youtube: 'https://www.youtube.com/watch?v=8q5QozrtEPA',
        votes: undefined
      }
    },
    {
      id: 'k',
      country: { id: 'k', name: 'Czechia', key: 'cz', icon: 'flag-icon-cz' },
      contestant: {
        countryKey: 'cz',
        artist: 'Aiko',
        song: 'Pedestal',
        youtube: 'https://www.youtube.com/watch?v=5DbRldMKFUU',
        votes: undefined
      }
    },
    {
      id: 'l',
      country: { id: 'l', name: 'Denmark', key: 'dk', icon: 'flag-icon-dk' },
      contestant: {
        countryKey: 'dk',
        artist: 'Saba',
        song: 'Sand',
        youtube: 'https://www.youtube.com/watch?v=3pCtdFnv9eQ',
        votes: undefined
      }
    },
    {
      id: 'm',
      country: { id: 'm', name: 'Estonia', key: 'ee', icon: 'flag-icon-ee' },
      contestant: {
        countryKey: 'ee',
        artist: '5miinust and Puuluup',
        song: '(Nendest) narkootikumidest ei tea me (küll) midagi',
        youtube: 'https://www.youtube.com/watch?v=ui_u0M7_hjs',
        votes: undefined
      }
    },
    {
      id: 'n',
      country: { id: 'n', name: 'Finland', key: 'fi', icon: 'flag-icon-fi' },
      contestant: {
        countryKey: 'fi',
        artist: 'Windows95man',
        song: 'No Rules!',
        youtube: 'https://www.youtube.com/watch?v=Tf1NS1vEhSg',
        votes: undefined
      }
    },
    {
      id: 'o',
      country: { id: 'o', name: 'France', key: 'fr', icon: 'flag-icon-fr' },
      contestant: {
        countryKey: 'fr',
        artist: 'Slimane',
        song: 'Mon amour',
        youtube: 'https://www.youtube.com/watch?v=bal8oESDH7s',
        votes: undefined
      }
    },
    {
      id: 'p',
      country: { id: 'p', name: 'Georgia', key: 'ge', icon: 'flag-icon-ge' },
      contestant: {
        countryKey: 'ge',
        artist: 'Nutsa Buzaladze',
        song: 'Firefighter',
        youtube: 'https://www.youtube.com/watch?v=blMwY8Jabyk',
        votes: undefined
      }
    },
    {
      id: 'q',
      country: { id: 'q', name: 'Germany', key: 'de', icon: 'flag-icon-de' },
      contestant: {
        countryKey: 'de',
        artist: 'Isaak',
        song: 'Always on the Run',
        youtube: 'https://www.youtube.com/watch?v=twhq3S4YHdQ',
        votes: undefined
      }
    },
    {
      id: 'r',
      country: { id: 'r', name: 'Greece', key: 'gr', icon: 'flag-icon-gr' },
      contestant: {
        countryKey: 'gr',
        artist: 'Marina Satti',
        song: 'ZARI',
        youtube: 'https://www.youtube.com/watch?v=mTSTnLWGUPs',
        votes: undefined
      }
    },
    {
      id: 't',
      country: { id: 't', name: 'Iceland', key: 'is', icon: 'flag-icon-is' },
      contestant: {
        countryKey: 'is',
        artist: 'Hera Björk',
        song: 'Scared of Heights',
        youtube: 'https://www.youtube.com/watch?v=i0zn27qa1BA',
        votes: undefined
      }
    },
    {
      id: 'u',
      country: { id: 'u', name: 'Ireland', key: 'ie', icon: 'flag-icon-ie' },
      contestant: {
        countryKey: 'ie',
        artist: 'Bambie Thug',
        song: 'Doomsday Blue',
        youtube: 'https://www.youtube.com/watch?v=n73nIfFI3k4',
        votes: undefined
      }
    },
    {
      id: 'v',
      country: { id: 'v', name: 'Israel', key: 'il', icon: 'flag-icon-il' },
      contestant: {
        countryKey: 'il',
        artist: 'Eden Golan',
        song: 'Hurricane',
        youtube: 'https://www.youtube.com/watch?v=lJYn09tuPw4',
        votes: undefined
      }
    },
    {
      id: 'w',
      country: { id: 'w', name: 'Italy', key: 'it', icon: 'flag-icon-it' },
      contestant: {
        countryKey: 'it',
        artist: 'Angelina Mango',
        song: 'La noia',
        youtube: 'https://www.youtube.com/watch?v=psiytW9Or2s',
        votes: undefined
      }
    },
    {
      id: 'x',
      country: { id: 'x', name: 'Latvia', key: 'lv', icon: 'flag-icon-lv' },
      contestant: {
        countryKey: 'lv',
        artist: 'Dons',
        song: 'Hollow',
        youtube: 'https://www.youtube.com/watch?v=V_Jhif6qXyY',
        votes: undefined
      }
    },
    {
      id: 'y',
      country: { id: 'y', name: 'Lithuania', key: 'lt', icon: 'flag-icon-lt' },
      contestant: {
        countryKey: 'lt',
        artist: 'Silvester Belt',
        song: 'Luktelk',
        youtube: 'https://www.youtube.com/watch?v=OrL668EQRu0',
        votes: undefined
      }
    },
    {
      id: 'z',
      country: { id: 'z', name: 'Luxembourg', key: 'lu', icon: 'flag-icon-lu' },
      contestant: {
        countryKey: 'lu',
        artist: 'Tali',
        song: 'Fighter',
        youtube: 'https://www.youtube.com/watch?v=HV3sORfrREE',
        votes: undefined
      }
    },
    {
      id: '0',
      country: { id: '0', name: 'Malta', key: 'mt', icon: 'flag-icon-mt' },
      contestant: {
        countryKey: 'mt',
        artist: 'Sarah Bonnici',
        song: 'Loop',
        youtube: 'https://www.youtube.com/watch?v=-IIxDNyIBdE',
        votes: undefined
      }
    },
    {
      id: '1',
      country: { id: '1', name: 'Moldova', key: 'md', icon: 'flag-icon-md' },
      contestant: {
        countryKey: 'md',
        artist: 'Natalia Barbu',
        song: 'In the Middle',
        youtube: 'https://www.youtube.com/watch?v=Jom9sNL5whs',
        votes: undefined
      }
    },
    {
      id: '3',
      country: { id: '3', name: 'Netherlands', key: 'nl', icon: 'flag-icon-nl' },
      contestant: {
        countryKey: 'nl',
        artist: 'Joost Klein',
        song: 'Europapa',
        youtube: 'https://www.youtube.com/watch?v=gT2wY0DjYGo',
        votes: undefined
      }
    },
    {
      id: '4',
      country: { id: '4', name: 'Norway', key: 'no', icon: 'flag-icon-no' },
      contestant: {
        countryKey: 'no',
        artist: 'Gåte',
        song: 'Ulveham',
        youtube: 'https://www.youtube.com/watch?v=UipzszlJwRQ',
        votes: undefined
      }
    },
    {
      id: '6',
      country: { id: '6', name: 'Poland', key: 'pl', icon: 'flag-icon-pl' },
      contestant: {
        countryKey: 'pl',
        artist: 'Luna',
        song: 'The Tower',
        youtube: 'https://www.youtube.com/watch?v=IhvDkF9XZx0',
        votes: undefined
      }
    },
    {
      id: '7',
      country: { id: '7', name: 'Portugal', key: 'pt', icon: 'flag-icon-pt' },
      contestant: {
        countryKey: 'pt',
        artist: 'Iolanda',
        song: 'Grito',
        youtube: 'https://www.youtube.com/watch?v=K5wDGhcDSpQ',
        votes: undefined
      }
    },
    {
      id: '.a',
      country: { id: '.a', name: 'San Marino', key: 'sm', icon: 'flag-icon-sm' },
      contestant: {
        countryKey: 'sm',
        artist: 'Megara',
        song: '11:11',
        youtube: 'https://www.youtube.com/watch?v=f1tgNLfcIOw',
        votes: undefined
      }
    },
    {
      id: '.b',
      country: { id: '.b', name: 'Serbia', key: 'rs', icon: 'flag-icon-rs' },
      contestant: {
        countryKey: 'rs',
        artist: 'Teya Dora',
        song: 'Ramonda',
        youtube: 'https://www.youtube.com/watch?v=SDXB0mXFR34',
        votes: undefined
      }
    },
    {
      id: '.c',
      country: { id: '.c', name: 'Slovenia', key: 'si', icon: 'flag-icon-si' },
      contestant: {
        countryKey: 'si',
        artist: 'Raiven',
        song: 'Veronika',
        youtube: 'https://www.youtube.com/watch?v=uWcSsi7SliI',
        votes: undefined
      }
    },
    {
      id: 'd',
      country: { id: 'd', name: 'Spain', key: 'es', icon: 'flag-icon-es' },
      contestant: {
        countryKey: 'es',
        artist: 'Nebulossa',
        song: 'Zorra',
        youtube: 'https://www.youtube.com/watch?v=GdagS_0hX8k',
        votes: undefined
      }
    },
    {
      id: 'e',
      country: { id: 'e', name: 'Sweden', key: 'se', icon: 'flag-icon-se' },
      contestant: {
        countryKey: 'se',
        artist: 'Marcus & Martinus',
        song: 'Unforgettable',
        youtube: 'https://www.youtube.com/watch?v=yekc8t0rJqA',
        votes: undefined
      }
    },
    {
      id: 'f',
      country: { id: 'f', name: 'Switzerland', key: 'ch', icon: 'flag-icon-ch' },
      contestant: {
        countryKey: 'ch',
        artist: 'Nemo',
        song: 'The Code',
        youtube: 'https://www.youtube.com/watch?v=kiGDvM14Kwg',
        votes: undefined
      }
    },
    {
      id: 'g',
      country: { id: 'g', name: 'Ukraine', key: 'ua', icon: 'flag-icon-ua' },
      contestant: {
        countryKey: 'ua',
        artist: 'Alyona Alyona and Jerry Heil',
        song: 'Teresa & Maria',
        youtube: 'https://www.youtube.com/watch?v=k_8cNbF8FLI',
        votes: undefined
      }
    },
    {
      id: 'h',
      country: {
        id: 'h',
        name: 'United Kingdom',
        key: 'gb',
        icon: 'flag-icon-gb'
      },
      contestant: {
        countryKey: 'gb',
        artist: 'Olly Alexander',
        song: 'Dizzy',
        youtube: 'https://www.youtube.com/watch?v=lLNUj7kvn2w',
        votes: undefined
      }
    }
  ] as unknown as CountryContestant[]