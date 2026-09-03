/**
 * 500+ Google Fonts Curated Catalog
 * Categorized by genre with supported weights, subsets, and popular ranks.
 */

export type FontCategory =
  | "all"
  | "sans-serif"
  | "serif"
  | "display"
  | "monospace"
  | "handwriting";

export interface GoogleFontMeta {
  family: string;
  category: "sans-serif" | "serif" | "display" | "monospace" | "handwriting";
  weights: number[];
  popularRank?: number;
}

export const POPULAR_GOOGLE_FONTS: GoogleFontMeta[] = [
  {
    "family": "Inter",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 1
  },
  {
    "family": "Roboto",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      700,
      900
    ],
    "popularRank": 2
  },
  {
    "family": "Poppins",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 3
  },
  {
    "family": "Open Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 4
  },
  {
    "family": "Montserrat",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 5
  },
  {
    "family": "Lato",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      700,
      900
    ],
    "popularRank": 6
  },
  {
    "family": "Plus Jakarta Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 7
  },
  {
    "family": "Outfit",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 8
  },
  {
    "family": "DM Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 9
  },
  {
    "family": "Nunito",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 10
  },
  {
    "family": "Raleway",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 11
  },
  {
    "family": "Work Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 12
  },
  {
    "family": "Manrope",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 13
  },
  {
    "family": "Rubik",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 14
  },
  {
    "family": "Space Grotesk",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 15
  },
  {
    "family": "Urbanist",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 16
  },
  {
    "family": "Jost",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 17
  },
  {
    "family": "Quicksand",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 18
  },
  {
    "family": "Syne",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 19
  },
  {
    "family": "Epilogue",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 20
  },
  {
    "family": "Fira Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 21
  },
  {
    "family": "PT Sans",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 22
  },
  {
    "family": "Ubuntu",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "popularRank": 23
  },
  {
    "family": "Karla",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 24
  },
  {
    "family": "Cabin",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 25
  },
  {
    "family": "Mulish",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 26
  },
  {
    "family": "Barlow",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 27
  },
  {
    "family": "Barlow Semi Condensed",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 28
  },
  {
    "family": "Hanken Grotesk",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 29
  },
  {
    "family": "Heebo",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 30
  },
  {
    "family": "Schibsted Grotesk",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 31
  },
  {
    "family": "Sora",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 32
  },
  {
    "family": "Figtree",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 33
  },
  {
    "family": "Inter Tight",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 34
  },
  {
    "family": "Red Hat Display",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 35
  },
  {
    "family": "Red Hat Text",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 36
  },
  {
    "family": "Lexend",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 37
  },
  {
    "family": "Lexend Deca",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 38
  },
  {
    "family": "Bricolage Grotesque",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 39
  },
  {
    "family": "Instrument Sans",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 40
  },
  {
    "family": "Geist",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 41
  },
  {
    "family": "Onest",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 42
  },
  {
    "family": "Albert Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 43
  },
  {
    "family": "Public Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 44
  },
  {
    "family": "Overpass",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700,
      800,
      900
    ],
    "popularRank": 45
  },
  {
    "family": "Prompt",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 46
  },
  {
    "family": "Kanit",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 47
  },
  {
    "family": "Exo 2",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 48
  },
  {
    "family": "Archivo",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 49
  },
  {
    "family": "Asap",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 50
  },
  {
    "family": "Chivo",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700,
      800,
      900
    ],
    "popularRank": 51
  },
  {
    "family": "Questrial",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 52
  },
  {
    "family": "Hind",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 53
  },
  {
    "family": "Oxygen",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      700
    ],
    "popularRank": 54
  },
  {
    "family": "Varela Round",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 55
  },
  {
    "family": "Catamaran",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 56
  },
  {
    "family": "Nunito Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700,
      800,
      900
    ],
    "popularRank": 57
  },
  {
    "family": "Abel",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 58
  },
  {
    "family": "Dosis",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 59
  },
  {
    "family": "Signika",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 60
  },
  {
    "family": "Maven Pro",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 61
  },
  {
    "family": "Noto Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 62
  },
  {
    "family": "Mukta",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 63
  },
  {
    "family": "Titillium Web",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700,
      900
    ],
    "popularRank": 64
  },
  {
    "family": "Assistant",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 65
  },
  {
    "family": "Be Vietnam Pro",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 66
  },
  {
    "family": "Hind Siliguri",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 67
  },
  {
    "family": "Rajdhani",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 68
  },
  {
    "family": "Yanone Kaffeesatz",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 69
  },
  {
    "family": "Signika Negative",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "popularRank": 70
  },
  {
    "family": "Cuprum",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 71
  },
  {
    "family": "Encode Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 72
  },
  {
    "family": "Barlow Condensed",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 73
  },
  {
    "family": "Josefin Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "popularRank": 74
  },
  {
    "family": "Tenor Sans",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 75
  },
  {
    "family": "Readex Pro",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 76
  },
  {
    "family": "Pathway Extreme",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "popularRank": 77
  },
  {
    "family": "Saira",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 78
  },
  {
    "family": "Saira Condensed",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 79
  },
  {
    "family": "Chakra Petch",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 80
  },
  {
    "family": "Mina",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 81
  },
  {
    "family": "Gudea",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 82
  },
  {
    "family": "Archivo Narrow",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 83
  },
  {
    "family": "Economica",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 84
  },
  {
    "family": "Pontano Sans",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 85
  },
  {
    "family": "Jura",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 86
  },
  {
    "family": "Bai Jamjuree",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 87
  },
  {
    "family": "Almarai",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      700,
      800
    ],
    "popularRank": 88
  },
  {
    "family": "Cairo",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 89
  },
  {
    "family": "Tajawal",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "popularRank": 90
  },
  {
    "family": "Sen",
    "category": "sans-serif",
    "weights": [
      400,
      700,
      800
    ],
    "popularRank": 91
  },
  {
    "family": "Molengo",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 92
  },
  {
    "family": "Scada",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 93
  },
  {
    "family": "Zen Kaku Gothic New",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "popularRank": 94
  },
  {
    "family": "Golos Text",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 95
  },
  {
    "family": "REM",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 96
  },
  {
    "family": "Kumbh Sans",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 97
  },
  {
    "family": "Afacad",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 98
  },
  {
    "family": "Anta",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 99
  },
  {
    "family": "Anek Latin",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 100
  },
  {
    "family": "Anek Bangla",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 101
  },
  {
    "family": "Anek Devanagari",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 102
  },
  {
    "family": "Anek Gujarati",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 103
  },
  {
    "family": "Anek Gurmukhi",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 104
  },
  {
    "family": "Anek Kannada",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 105
  },
  {
    "family": "Anek Malayalam",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 106
  },
  {
    "family": "Anek Odia",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 107
  },
  {
    "family": "Anek Tamil",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 108
  },
  {
    "family": "Anek Telugu",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 109
  },
  {
    "family": "Alexandria",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 110
  },
  {
    "family": "Noto Sans Display",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 111
  },
  {
    "family": "Plus Jakarta Text",
    "category": "sans-serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 112
  },
  {
    "family": "Recursive",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 113
  },
  {
    "family": "Gantari",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 114
  },
  {
    "family": "Pathway Gothic One",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 115
  },
  {
    "family": "Armata",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 116
  },
  {
    "family": "Actor",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 117
  },
  {
    "family": "Acme",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 118
  },
  {
    "family": "Basic",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 119
  },
  {
    "family": "Belgrano",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 120
  },
  {
    "family": "Carme",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 121
  },
  {
    "family": "Caudex",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 122
  },
  {
    "family": "Federo",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 123
  },
  {
    "family": "Fresca",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 124
  },
  {
    "family": "Gafata",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 125
  },
  {
    "family": "Galdeano",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 126
  },
  {
    "family": "Georama",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 127
  },
  {
    "family": "Glory",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 128
  },
  {
    "family": "Hammersmith One",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 129
  },
  {
    "family": "Halis Grotesque",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 130
  },
  {
    "family": "Hubballi",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 131
  },
  {
    "family": "Imprima",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 132
  },
  {
    "family": "Istok Web",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 133
  },
  {
    "family": "Khand",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 134
  },
  {
    "family": "Krona One",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 135
  },
  {
    "family": "Lacquer",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 136
  },
  {
    "family": "Lekton",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 137
  },
  {
    "family": "Mandali",
    "category": "sans-serif",
    "weights": [
      400
    ],
    "popularRank": 138
  },
  {
    "family": "Monda",
    "category": "sans-serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 139
  },
  {
    "family": "Murecho",
    "category": "sans-serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 140
  },
  {
    "family": "Playfair Display",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 141
  },
  {
    "family": "Merriweather",
    "category": "serif",
    "weights": [
      300,
      400,
      700,
      900
    ],
    "popularRank": 142
  },
  {
    "family": "Lora",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 143
  },
  {
    "family": "PT Serif",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 144
  },
  {
    "family": "Cinzel",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 145
  },
  {
    "family": "Cormorant Garamond",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 146
  },
  {
    "family": "EB Garamond",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 147
  },
  {
    "family": "Bodoni Moda",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 148
  },
  {
    "family": "Spectral",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 149
  },
  {
    "family": "Bitter",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 150
  },
  {
    "family": "Libre Baskerville",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 151
  },
  {
    "family": "Prata",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 152
  },
  {
    "family": "DM Serif Display",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 153
  },
  {
    "family": "DM Serif Text",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 154
  },
  {
    "family": "Fraunces",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 155
  },
  {
    "family": "Arvo",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 156
  },
  {
    "family": "Alegreya",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 157
  },
  {
    "family": "Castoro",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 158
  },
  {
    "family": "Cardo",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 159
  },
  {
    "family": "Vollkorn",
    "category": "serif",
    "weights": [
      400,
      600,
      700,
      900
    ],
    "popularRank": 160
  },
  {
    "family": "Cinzel Decorative",
    "category": "serif",
    "weights": [
      400,
      700,
      900
    ],
    "popularRank": 161
  },
  {
    "family": "Marcellus",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 162
  },
  {
    "family": "Newsreader",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 163
  },
  {
    "family": "Frank Ruhl Libre",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      700,
      900
    ],
    "popularRank": 164
  },
  {
    "family": "Faustina",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 165
  },
  {
    "family": "Gilda Display",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 166
  },
  {
    "family": "Baskervville",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 167
  },
  {
    "family": "Alice",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 168
  },
  {
    "family": "Bellefair",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 169
  },
  {
    "family": "Cormorant",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 170
  },
  {
    "family": "Domine",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 171
  },
  {
    "family": "Noto Serif",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 172
  },
  {
    "family": "Libre Caslon Text",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 173
  },
  {
    "family": "Libre Caslon Display",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 174
  },
  {
    "family": "Rozha One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 175
  },
  {
    "family": "Oranienbaum",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 176
  },
  {
    "family": "Unna",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 177
  },
  {
    "family": "Besley",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 178
  },
  {
    "family": "Old Standard TT",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 179
  },
  {
    "family": "Trirong",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 180
  },
  {
    "family": "Pridi",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 181
  },
  {
    "family": "Radley",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 182
  },
  {
    "family": "Suranna",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 183
  },
  {
    "family": "Judson",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 184
  },
  {
    "family": "Coustard",
    "category": "serif",
    "weights": [
      400,
      900
    ],
    "popularRank": 185
  },
  {
    "family": "Bentham",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 186
  },
  {
    "family": "Elsie",
    "category": "serif",
    "weights": [
      400,
      900
    ],
    "popularRank": 187
  },
  {
    "family": "Poly",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 188
  },
  {
    "family": "Taviraj",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 189
  },
  {
    "family": "Kurale",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 190
  },
  {
    "family": "BioRhyme",
    "category": "serif",
    "weights": [
      300,
      400,
      700,
      800
    ],
    "popularRank": 191
  },
  {
    "family": "Markazi Text",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 192
  },
  {
    "family": "Amiri",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 193
  },
  {
    "family": "Antic Didone",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 194
  },
  {
    "family": "Abhaya Libre",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 195
  },
  {
    "family": "Adamina",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 196
  },
  {
    "family": "Alike",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 197
  },
  {
    "family": "Alike Angular",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 198
  },
  {
    "family": "Andada Pro",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 199
  },
  {
    "family": "Arapey",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 200
  },
  {
    "family": "Artifika",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 201
  },
  {
    "family": "Asar",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 202
  },
  {
    "family": "Average",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 203
  },
  {
    "family": "Balthazar",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 204
  },
  {
    "family": "Belleza",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 205
  },
  {
    "family": "Buenard",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 206
  },
  {
    "family": "Caladea",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 207
  },
  {
    "family": "Calistoga",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 208
  },
  {
    "family": "Cantata One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 209
  },
  {
    "family": "Castoro Titling",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 210
  },
  {
    "family": "Cormorant Infant",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 211
  },
  {
    "family": "Cormorant SC",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 212
  },
  {
    "family": "Cormorant Unicase",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 213
  },
  {
    "family": "Cormorant Upright",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 214
  },
  {
    "family": "Cutive",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 215
  },
  {
    "family": "David Libre",
    "category": "serif",
    "weights": [
      400,
      500,
      700
    ],
    "popularRank": 216
  },
  {
    "family": "Della Respira",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 217
  },
  {
    "family": "Donegal One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 218
  },
  {
    "family": "Elsie Swash Caps",
    "category": "serif",
    "weights": [
      400,
      900
    ],
    "popularRank": 219
  },
  {
    "family": "Enriqueta",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 220
  },
  {
    "family": "Fanwood Text",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 221
  },
  {
    "family": "Fenix",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 222
  },
  {
    "family": "Fjord One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 223
  },
  {
    "family": "Gabriela",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 224
  },
  {
    "family": "Gelasio",
    "category": "serif",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 225
  },
  {
    "family": "Gentium Book Plus",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 226
  },
  {
    "family": "Gentium Plus",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 227
  },
  {
    "family": "Glegoo",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 228
  },
  {
    "family": "Gloock",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 229
  },
  {
    "family": "Grantha Sangam MN",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 230
  },
  {
    "family": "Gupter",
    "category": "serif",
    "weights": [
      400,
      500,
      700
    ],
    "popularRank": 231
  },
  {
    "family": "Habibi",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 232
  },
  {
    "family": "Headland One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 233
  },
  {
    "family": "Holtwood One SC",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 234
  },
  {
    "family": "Ibarra Real Nova",
    "category": "serif",
    "weights": [
      400,
      600,
      700
    ],
    "popularRank": 235
  },
  {
    "family": "Inria Serif",
    "category": "serif",
    "weights": [
      300,
      400,
      700
    ],
    "popularRank": 236
  },
  {
    "family": "Italiana",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 237
  },
  {
    "family": "Jacques Francois",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 238
  },
  {
    "family": "Kameron",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 239
  },
  {
    "family": "Kotta One",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 240
  },
  {
    "family": "Kovalyov",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 241
  },
  {
    "family": "Laila",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 242
  },
  {
    "family": "Linden Hill",
    "category": "serif",
    "weights": [
      400
    ],
    "popularRank": 243
  },
  {
    "family": "Literata",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 244
  },
  {
    "family": "Lusitana",
    "category": "serif",
    "weights": [
      400,
      700
    ],
    "popularRank": 245
  },
  {
    "family": "Maitree",
    "category": "serif",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 246
  },
  {
    "family": "Bebas Neue",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 247
  },
  {
    "family": "Oswald",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 248
  },
  {
    "family": "Anton",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 249
  },
  {
    "family": "Righteous",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 250
  },
  {
    "family": "Lobster",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 251
  },
  {
    "family": "Abril Fatface",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 252
  },
  {
    "family": "Shrikhand",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 253
  },
  {
    "family": "Comfortaa",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 254
  },
  {
    "family": "Audiowide",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 255
  },
  {
    "family": "Permanent Marker",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 256
  },
  {
    "family": "Monoton",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 257
  },
  {
    "family": "Unbounded",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 258
  },
  {
    "family": "Bungee",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 259
  },
  {
    "family": "Alfa Slab One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 260
  },
  {
    "family": "Staatliches",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 261
  },
  {
    "family": "Teko",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 262
  },
  {
    "family": "Fredoka",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 263
  },
  {
    "family": "Russo One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 264
  },
  {
    "family": "Passion One",
    "category": "display",
    "weights": [
      400,
      700,
      900
    ],
    "popularRank": 265
  },
  {
    "family": "Changa One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 266
  },
  {
    "family": "Squada One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 267
  },
  {
    "family": "Titan One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 268
  },
  {
    "family": "Black Ops One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 269
  },
  {
    "family": "Secular One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 270
  },
  {
    "family": "Patua One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 271
  },
  {
    "family": "Boogaloo",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 272
  },
  {
    "family": "Bungee Shade",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 273
  },
  {
    "family": "Creepster",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 274
  },
  {
    "family": "Press Start 2P",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 275
  },
  {
    "family": "Silkscreen",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 276
  },
  {
    "family": "Faster One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 277
  },
  {
    "family": "Megrim",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 278
  },
  {
    "family": "Flavors",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 279
  },
  {
    "family": "Notable",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 280
  },
  {
    "family": "Racing Sans One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 281
  },
  {
    "family": "Concert One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 282
  },
  {
    "family": "Luckiest Guy",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 283
  },
  {
    "family": "Carter One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 284
  },
  {
    "family": "Fugaz One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 285
  },
  {
    "family": "Chewy",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 286
  },
  {
    "family": "Bangers",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 287
  },
  {
    "family": "Sigmar",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 288
  },
  {
    "family": "Sigmar One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 289
  },
  {
    "family": "Slackey",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 290
  },
  {
    "family": "Sniglet",
    "category": "display",
    "weights": [
      400,
      800
    ],
    "popularRank": 291
  },
  {
    "family": "Special Elite",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 292
  },
  {
    "family": "Rye",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 293
  },
  {
    "family": "Sancreek",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 294
  },
  {
    "family": "Shojumaru",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 295
  },
  {
    "family": "Ribeye",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 296
  },
  {
    "family": "Ribeye Marrow",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 297
  },
  {
    "family": "Vast Shadow",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 298
  },
  {
    "family": "Londrina Solid",
    "category": "display",
    "weights": [
      300,
      400,
      900
    ],
    "popularRank": 299
  },
  {
    "family": "Londrina Shadow",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 300
  },
  {
    "family": "Londrina Outline",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 301
  },
  {
    "family": "Londrina Sketch",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 302
  },
  {
    "family": "Ruslan Display",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 303
  },
  {
    "family": "Big Shoulders Display",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 304
  },
  {
    "family": "Big Shoulders Inline Display",
    "category": "display",
    "weights": [
      400,
      700,
      900
    ],
    "popularRank": 305
  },
  {
    "family": "Big Shoulders Stencil Display",
    "category": "display",
    "weights": [
      400,
      700,
      900
    ],
    "popularRank": 306
  },
  {
    "family": "Bungee Outline",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 307
  },
  {
    "family": "Bungee Inline",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 308
  },
  {
    "family": "Federant",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 309
  },
  {
    "family": "Geostar",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 310
  },
  {
    "family": "Geostar Fill",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 311
  },
  {
    "family": "Germania One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 312
  },
  {
    "family": "Glass Antiqua",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 313
  },
  {
    "family": "Graduate",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 314
  },
  {
    "family": "Kelly Slab",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 315
  },
  {
    "family": "Keania One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 316
  },
  {
    "family": "Kenia",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 317
  },
  {
    "family": "Knewave",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 318
  },
  {
    "family": "Lemon",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 319
  },
  {
    "family": "Limelight",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 320
  },
  {
    "family": "Lobster Two",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 321
  },
  {
    "family": "Modern Antiqua",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 322
  },
  {
    "family": "Mystery Quest",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 323
  },
  {
    "family": "Nosifer",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 324
  },
  {
    "family": "Nova Cut",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 325
  },
  {
    "family": "Nova Flat",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 326
  },
  {
    "family": "Nova Oval",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 327
  },
  {
    "family": "Nova Round",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 328
  },
  {
    "family": "Nova Slim",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 329
  },
  {
    "family": "Nova Square",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 330
  },
  {
    "family": "Odibee Sans",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 331
  },
  {
    "family": "Offside",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 332
  },
  {
    "family": "Oleo Script",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 333
  },
  {
    "family": "Oleo Script Swash Caps",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 334
  },
  {
    "family": "Oregano",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 335
  },
  {
    "family": "Overlock",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 336
  },
  {
    "family": "Overlock SC",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 337
  },
  {
    "family": "Plaster",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 338
  },
  {
    "family": "Podkova",
    "category": "display",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 339
  },
  {
    "family": "Poller One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 340
  },
  {
    "family": "Prosto One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 341
  },
  {
    "family": "Rammetto One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 342
  },
  {
    "family": "Ranchers",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 343
  },
  {
    "family": "Revalia",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 344
  },
  {
    "family": "Risque",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 345
  },
  {
    "family": "Ropa Sans",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 346
  },
  {
    "family": "Ruda",
    "category": "display",
    "weights": [
      400,
      600,
      700
    ],
    "popularRank": 347
  },
  {
    "family": "Rum Raisin",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 348
  },
  {
    "family": "Sail",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 349
  },
  {
    "family": "Salsa",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 350
  },
  {
    "family": "Sarina",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 351
  },
  {
    "family": "Sevilana",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 352
  },
  {
    "family": "Seymour One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 353
  },
  {
    "family": "Shanti",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 354
  },
  {
    "family": "Share",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 355
  },
  {
    "family": "Short Stack",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 356
  },
  {
    "family": "Siemreap",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 357
  },
  {
    "family": "Simonetta",
    "category": "display",
    "weights": [
      400,
      900
    ],
    "popularRank": 358
  },
  {
    "family": "Sintony",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 359
  },
  {
    "family": "Sirin Stencil",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 360
  },
  {
    "family": "Six Caps",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 361
  },
  {
    "family": "Skranji",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 362
  },
  {
    "family": "Smokum",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 363
  },
  {
    "family": "Smythe",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 364
  },
  {
    "family": "Snippet",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 365
  },
  {
    "family": "Sofia",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 366
  },
  {
    "family": "Sonsie One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 367
  },
  {
    "family": "Spicy Rice",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 368
  },
  {
    "family": "Spinnaker",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 369
  },
  {
    "family": "Spirax",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 370
  },
  {
    "family": "Stalemate",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 371
  },
  {
    "family": "Stint Ultra Condensed",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 372
  },
  {
    "family": "Stint Ultra Expanded",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 373
  },
  {
    "family": "Stoke",
    "category": "display",
    "weights": [
      300,
      400
    ],
    "popularRank": 374
  },
  {
    "family": "Strait",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 375
  },
  {
    "family": "Sunshiney",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 376
  },
  {
    "family": "Supermercado One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 377
  },
  {
    "family": "Syncopate",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 378
  },
  {
    "family": "Trade Winds",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 379
  },
  {
    "family": "Trocchi",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 380
  },
  {
    "family": "Trochut",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 381
  },
  {
    "family": "Trykker",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 382
  },
  {
    "family": "Tulpen One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 383
  },
  {
    "family": "Turret Road",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      700
    ],
    "popularRank": 384
  },
  {
    "family": "Ultra",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 385
  },
  {
    "family": "Uncial Antiqua",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 386
  },
  {
    "family": "Underdog",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 387
  },
  {
    "family": "Unica One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 388
  },
  {
    "family": "UnifrakturCook",
    "category": "display",
    "weights": [
      700
    ],
    "popularRank": 389
  },
  {
    "family": "UnifrakturMaguntia",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 390
  },
  {
    "family": "Unkempt",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 391
  },
  {
    "family": "Unlock",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 392
  },
  {
    "family": "Vampiro One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 393
  },
  {
    "family": "Vibur",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 394
  },
  {
    "family": "Vidaloka",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 395
  },
  {
    "family": "Viga",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 396
  },
  {
    "family": "Voces",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 397
  },
  {
    "family": "Volkhov",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 398
  },
  {
    "family": "Wallpoet",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 399
  },
  {
    "family": "Warnes",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 400
  },
  {
    "family": "Wellfleet",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 401
  },
  {
    "family": "Wendy One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 402
  },
  {
    "family": "Wire One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 403
  },
  {
    "family": "Yatra One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 404
  },
  {
    "family": "Yeseva One",
    "category": "display",
    "weights": [
      400
    ],
    "popularRank": 405
  },
  {
    "family": "Zilla Slab",
    "category": "display",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 406
  },
  {
    "family": "Zilla Slab Highlight",
    "category": "display",
    "weights": [
      400,
      700
    ],
    "popularRank": 407
  },
  {
    "family": "Geist Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 408
  },
  {
    "family": "JetBrains Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 409
  },
  {
    "family": "Fira Code",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 410
  },
  {
    "family": "Source Code Pro",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 411
  },
  {
    "family": "Space Mono",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 412
  },
  {
    "family": "Roboto Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 413
  },
  {
    "family": "Inconsolata",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 414
  },
  {
    "family": "IBM Plex Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 415
  },
  {
    "family": "Ubuntu Mono",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 416
  },
  {
    "family": "DM Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500
    ],
    "popularRank": 417
  },
  {
    "family": "Courier Prime",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 418
  },
  {
    "family": "Share Tech Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 419
  },
  {
    "family": "Anonymous Pro",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 420
  },
  {
    "family": "VT323",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 421
  },
  {
    "family": "Cutive Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 422
  },
  {
    "family": "Nova Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 423
  },
  {
    "family": "Major Mono Display",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 424
  },
  {
    "family": "Fantasque Sans Mono",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 425
  },
  {
    "family": "Red Hat Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 426
  },
  {
    "family": "Syne Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 427
  },
  {
    "family": "Spline Sans Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 428
  },
  {
    "family": "Victor Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700
    ],
    "popularRank": 429
  },
  {
    "family": "Cousine",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 430
  },
  {
    "family": "Overpass Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      600,
      700
    ],
    "popularRank": 431
  },
  {
    "family": "Nanum Gothic Coding",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 432
  },
  {
    "family": "PT Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 433
  },
  {
    "family": "Oxygen Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 434
  },
  {
    "family": "Azeret Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    "popularRank": 435
  },
  {
    "family": "Fragment Mono",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 436
  },
  {
    "family": "Martian Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 437
  },
  {
    "family": "Sono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 438
  },
  {
    "family": "Chivo Mono",
    "category": "monospace",
    "weights": [
      300,
      400,
      500,
      600,
      700,
      800
    ],
    "popularRank": 439
  },
  {
    "family": "Sometype Mono",
    "category": "monospace",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 440
  },
  {
    "family": "Commit Mono",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 441
  },
  {
    "family": "Monofett",
    "category": "monospace",
    "weights": [
      400
    ],
    "popularRank": 442
  },
  {
    "family": "Fira Mono",
    "category": "monospace",
    "weights": [
      400,
      500,
      700
    ],
    "popularRank": 443
  },
  {
    "family": "B612 Mono",
    "category": "monospace",
    "weights": [
      400,
      700
    ],
    "popularRank": 444
  },
  {
    "family": "Caveat",
    "category": "handwriting",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 445
  },
  {
    "family": "Dancing Script",
    "category": "handwriting",
    "weights": [
      400,
      500,
      600,
      700
    ],
    "popularRank": 446
  },
  {
    "family": "Pacifico",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 447
  },
  {
    "family": "Shadows Into Light",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 448
  },
  {
    "family": "Satisfy",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 449
  },
  {
    "family": "Great Vibes",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 450
  },
  {
    "family": "Sacramento",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 451
  },
  {
    "family": "Yellowtail",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 452
  },
  {
    "family": "Kalam",
    "category": "handwriting",
    "weights": [
      300,
      400,
      700
    ],
    "popularRank": 453
  },
  {
    "family": "Marck Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 454
  },
  {
    "family": "Indie Flower",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 455
  },
  {
    "family": "Allura",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 456
  },
  {
    "family": "Tangerine",
    "category": "handwriting",
    "weights": [
      400,
      700
    ],
    "popularRank": 457
  },
  {
    "family": "Alex Brush",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 458
  },
  {
    "family": "Amatic SC",
    "category": "handwriting",
    "weights": [
      400,
      700
    ],
    "popularRank": 459
  },
  {
    "family": "Cookie",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 460
  },
  {
    "family": "Parisienne",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 461
  },
  {
    "family": "Courgette",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 462
  },
  {
    "family": "Kaushan Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 463
  },
  {
    "family": "Damion",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 464
  },
  {
    "family": "Gochi Hand",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 465
  },
  {
    "family": "Gloria Hallelujah",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 466
  },
  {
    "family": "Homemade Apple",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 467
  },
  {
    "family": "Covered By Your Grace",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 468
  },
  {
    "family": "Nothing You Could Do",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 469
  },
  {
    "family": "Bad Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 470
  },
  {
    "family": "Just Another Hand",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 471
  },
  {
    "family": "Reenie Beanie",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 472
  },
  {
    "family": "Rochester",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 473
  },
  {
    "family": "Patrick Hand",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 474
  },
  {
    "family": "Cedarville Cursive",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 475
  },
  {
    "family": "Delius",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 476
  },
  {
    "family": "Dawning of a New Day",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 477
  },
  {
    "family": "Loved by the King",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 478
  },
  {
    "family": "Give You Glory",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 479
  },
  {
    "family": "La Belle Aurore",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 480
  },
  {
    "family": "League Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 481
  },
  {
    "family": "Meddon",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 482
  },
  {
    "family": "Meie Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 483
  },
  {
    "family": "Miss Fajardose",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 484
  },
  {
    "family": "Molle",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 485
  },
  {
    "family": "Montez",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 486
  },
  {
    "family": "Mr Bedfort",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 487
  },
  {
    "family": "Mr Dafoe",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 488
  },
  {
    "family": "Mr De Haviland",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 489
  },
  {
    "family": "Mrs Saint Delafield",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 490
  },
  {
    "family": "Mrs Sheppards",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 491
  },
  {
    "family": "My Soul",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 492
  },
  {
    "family": "Neucha",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 493
  },
  {
    "family": "Niconne",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 494
  },
  {
    "family": "Over the Rainbow",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 495
  },
  {
    "family": "Petit Formal Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 496
  },
  {
    "family": "Pinyon Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 497
  },
  {
    "family": "Playball",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 498
  },
  {
    "family": "Princess Sofia",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 499
  },
  {
    "family": "Qwigley",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 500
  },
  {
    "family": "Redressed",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 501
  },
  {
    "family": "Rouge Script",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 502
  },
  {
    "family": "Ruge Boogie",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 503
  },
  {
    "family": "Ruthie",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 504
  },
  {
    "family": "Sedgwick Ave",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 505
  },
  {
    "family": "Send Flowers",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 506
  },
  {
    "family": "Sue Ellen Francisco",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 507
  },
  {
    "family": "Swanky and Moo Moo",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 508
  },
  {
    "family": "The Girl Next Door",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 509
  },
  {
    "family": "Waiting for the Sunrise",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 510
  },
  {
    "family": "Walter Turncoat",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 511
  },
  {
    "family": "WindSong",
    "category": "handwriting",
    "weights": [
      400,
      500
    ],
    "popularRank": 512
  },
  {
    "family": "Yesteryear",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 513
  },
  {
    "family": "Zeyada",
    "category": "handwriting",
    "weights": [
      400
    ],
    "popularRank": 514
  }
];

/**
 * Generates Google Fonts URL for dynamic loading in <link> tag.
 */
export function buildGoogleFontUrl(families: string[]): string | null {
  const validFamilies = families
    .map((f) => f?.trim())
    .filter((f) => Boolean(f) && f !== "Inter" && f !== "Geist Mono"); // Inter & Geist Mono already bundled

  if (validFamilies.length === 0) return null;

  const unique = Array.from(new Set(validFamilies));
  const query = unique
    .map((fam) => {
      const formatted = fam.replace(/\s+/g, "+");
      return `family=${formatted}:wght@300;400;500;600;700;800;900`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
