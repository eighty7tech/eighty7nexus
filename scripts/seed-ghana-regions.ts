
import mongoose from "mongoose";
import { GhanaRegion } from "../models/ghana-regions.model.js";

const regions = [
  {
    name: "Greater Accra",
    capital: "Accra",
    code: "GR",
    districts: [
      { name: "Accra Metropolitan", type: "Metropolitan" },
      { name: "Tema Metropolitan", type: "Metropolitan" },
      { name: "Ledzokuku-Krowor Municipal", type: "Municipal" },
      { name: "La Dade Kotopon Municipal", type: "Municipal" },
      { name: "Kpone Katamanso Municipal", type: "Municipal" },
      { name: "Ashaiman Municipal", type: "Municipal" },
      { name: "Adentan Municipal", type: "Municipal" },
      { name: "Ga East Municipal", type: "Municipal" },
      { name: "Ga West Municipal", type: "Municipal" },
      { name: "Ga South Municipal", type: "Municipal" },
      { name: "Ga Central Municipal", type: "Municipal" },
      { name: "Ningo Prampram District", type: "District" },
      { name: "Shai Osudoku District", type: "District" },
      { name: "Ada East District", type: "District" },
      { name: "Ada West District", type: "District" },
    ],
  },
  {
    name: "Ashanti",
    capital: "Kumasi",
    code: "AR",
    districts: [
      { name: "Kumasi Metropolitan", type: "Metropolitan" },
      { name: "Asokwa Municipal", type: "Municipal" },
      { name: "Oforikrom Municipal", type: "Municipal" },
      { name: "Kwadaso Municipal", type: "Municipal" },
      { name: "Suame Municipal", type: "Municipal" },
      { name: "Old Tafo Municipal", type: "Municipal" },
      { name: "Asokore Mampong Municipal", type: "Municipal" },
      { name: "Obuasi Municipal", type: "Municipal" },
      { name: "Bekwai Municipal", type: "Municipal" },
      { name: "Ejisu Municipal", type: "Municipal" },
      { name: "Mampong Municipal", type: "Municipal" },
      { name: "Amansie South District", type: "District" },
      { name: "Amansie West District", type: "District" },
      { name: "Amansie Central District", type: "District" },
      { name: "Ahafo Ano North Municipal", type: "Municipal" },
      { name: "Ahafo Ano South West District", type: "District" },
    ],
  },
  {
    name: "Central",
    capital: "Cape Coast",
    code: "CR",
    districts: [
      { name: "Cape Coast Metropolitan", type: "Metropolitan" },
      { name: "Awutu Senya East Municipal", type: "Municipal" },
      { name: "Agona West Municipal", type: "Municipal" },
      { name: "Effutu Municipal", type: "Municipal" },
      { name: "Komenda/Edina/Eguafo/Abirem Municipal", type: "Municipal" },
      { name: "Mfantseman Municipal", type: "Municipal" },
      { name: "Assin Foso Municipal", type: "Municipal" },
      { name: "Upper Denkyira East Municipal", type: "Municipal" },
      { name: "Abura/Asebu/Kwamankese District", type: "District" },
      { name: "Gomoa East District", type: "District" },
      { name: "Gomoa West District", type: "District" },
    ],
  },
  {
    name: "Eastern",
    capital: "Koforidua",
    code: "ER",
    districts: [
      { name: "New Juaben South Municipal", type: "Municipal" },
      { name: "New Juaben North Municipal", type: "Municipal" },
      { name: "Nsawam Adoagyiri Municipal", type: "Municipal" },
      { name: "Suhum Municipal", type: "Municipal" },
      { name: "West Akim Municipal", type: "Municipal" },
      { name: "Lower Manya Krobo Municipal", type: "Municipal" },
      { name: "Akuapem North Municipal", type: "Municipal" },
      { name: "Abuakwa South Municipal", type: "Municipal" },
      { name: "Birim Central Municipal", type: "Municipal" },
      { name: "Kwahu West Municipal", type: "Municipal" },
    ],
  },
  {
    name: "Western",
    capital: "Sekondi-Takoradi",
    code: "WR",
    districts: [
      { name: "Sekondi-Takoradi Metropolitan", type: "Metropolitan" },
      { name: "Tarkwa-Nsuaem Municipal", type: "Municipal" },
      { name: "Prestea-Huni Valley Municipal", type: "Municipal" },
      { name: "Effia-Kwesimintsim Municipal", type: "Municipal" },
      { name: "Ahanta West Municipal", type: "Municipal" },
      { name: "Nzema East Municipal", type: "Municipal" },
      { name: "Jomoro Municipal", type: "Municipal" },
      { name: "Ellembelle District", type: "District" },
      { name: "Shama District", type: "District" },
      { name: "Wassa East District", type: "District" },
      { name: "Wassa Amenfi East Municipal", type: "Municipal" },
      { name: "Wassa Amenfi West Municipal", type: "Municipal" },
      { name: "Wassa Amenfi Central District", type: "District" },
    ],
  },
  {
    name: "Volta",
    capital: "Ho",
    code: "VR",
    districts: [
      { name: "Ho Metropolitan", type: "Metropolitan" },
      { name: "Ketu South Municipal", type: "Municipal" },
      { name: "Keta Municipal", type: "Municipal" },
      { name: "Hohoe Municipal", type: "Municipal" },
      { name: "Akatsi South Municipal", type: "Municipal" },
      { name: "Kpando Municipal", type: "Municipal" },
      { name: "South Tongu District", type: "District" },
      { name: "Central Tongu District", type: "District" },
      { name: "North Tongu District", type: "District" },
      { name: "Agotime Ziope District", type: "District" },
      { name: "Ho West District", type: "District" },
      { name: "South Dayi District", type: "District" },
      { name: "North Dayi District", type: "District" },
      { name: "Afadzato South District", type: "District" },
      { name: "Ketu North Municipal", type: "Municipal" },
      { name: "Akatsi North District", type: "District" },
    ],
  },
  {
    name: "Ahafo",
    capital: "Goaso",
    code: "AF",
    districts: [
      { name: "Asunafo North Municipal", type: "Municipal" },
      { name: "Asunafo South District", type: "District" },
      { name: "Asutifi North District", type: "District" },
      { name: "Asutifi South District", type: "District" },
      { name: "Tano North Municipal", type: "Municipal" },
      { name: "Tano South Municipal", type: "Municipal" },
    ],
  },
  {
    name: "Bono",
    capital: "Sunyani",
    code: "BO",
    districts: [
      { name: "Sunyani Metropolitan", type: "Metropolitan" },
      { name: "Sunyani West Municipal", type: "Municipal" },
      { name: "Berekum East Municipal", type: "Municipal" },
      { name: "Berekum West District", type: "District" },
      { name: "Dormaa Central Municipal", type: "Municipal" },
      { name: "Dormaa East District", type: "District" },
      { name: "Dormaa West District", type: "District" },
      { name: "Jaman South Municipal", type: "Municipal" },
      { name: "Jaman North District", type: "District" },
      { name: "Banda District", type: "District" },
      { name: "Tain District", type: "District" },
    ],
  },
  {
    name: "Bono East",
    capital: "Techiman",
    code: "BE",
    districts: [
      { name: "Techiman Municipal", type: "Municipal" },
      { name: "Techiman North District", type: "District" },
      { name: "Kintampo North Municipal", type: "Municipal" },
      { name: "Kintampo South District", type: "District" },
      { name: "Nkoranza South Municipal", type: "Municipal" },
      { name: "Nkoranza North District", type: "District" },
      { name: "Atebubu-Amantin Municipal", type: "Municipal" },
      { name: "Pru East District", type: "District" },
      { name: "Pru West District", type: "District" },
      { name: "Sene East District", type: "District" },
      { name: "Sene West District", type: "District" },
    ],
  },
  {
    name: "Oti",
    capital: "Dambai",
    code: "OR",
    districts: [
      { name: "Krachi East Municipal", type: "Municipal" },
      { name: "Krachi West District", type: "District" },
      { name: "Krachi Nchumuru District", type: "District" },
      { name: "Nkwanta South Municipal", type: "Municipal" },
      { name: "Nkwanta North District", type: "District" },
      { name: "Kadjebi District", type: "District" },
      { name: "Jasikan District", type: "District" },
      { name: "Biakoye District", type: "District" },
    ],
  },
  {
    name: "Northern",
    capital: "Tamale",
    code: "NR",
    districts: [
      { name: "Tamale Metropolitan", type: "Metropolitan" },
      { name: "Sagnarigu Municipal", type: "Municipal" },
      { name: "Savelugu Municipal", type: "Municipal" },
      { name: "Yendi Municipal", type: "Municipal" },
      { name: "Nanton District", type: "District" },
      { name: "Kumbungu District", type: "District" },
      { name: "Tolon District", type: "District" },
      { name: "Nanumba North Municipal", type: "Municipal" },
      { name: "Nanumba South District", type: "District" },
      { name: "Kpandai District", type: "District" },
      { name: "Gushegu Municipal", type: "Municipal" },
      { name: "Karaga District", type: "District" },
      { name: "Saboba District", type: "District" },
      { name: "Zabzugu District", type: "District" },
      { name: "Tatale Sanguli District", type: "District" },
      { name: "Mion District", type: "District" },
    ],
  },
  {
    name: "Savannah",
    capital: "Damongo",
    code: "SR",
    districts: [
      { name: "West Gonja Municipal", type: "Municipal" },
      { name: "East Gonja Municipal", type: "Municipal" },
      { name: "Central Gonja District", type: "District" },
      { name: "North Gonja District", type: "District" },
      { name: "Bole District", type: "District" },
      { name: "Sawla-Tuna-Kalba District", type: "District" },
      { name: "North East Gonja District", type: "District" },
    ],
  },
  {
    name: "North East",
    capital: "Nalerigu",
    code: "NE",
    districts: [
      { name: "East Mamprusi Municipal", type: "Municipal" },
      { name: "West Mamprusi Municipal", type: "Municipal" },
      { name: "Bunkpurugu Nyankpanduri District", type: "District" },
      { name: "Yunyoo-Nasuan District", type: "District" },
      { name: "Chereponi District", type: "District" },
      { name: "Mamprugu Moagduri District", type: "District" },
    ],
  },
  {
    name: "Upper East",
    capital: "Bolgatanga",
    code: "UE",
    districts: [
      { name: "Bolgatanga Metropolitan", type: "Metropolitan" },
      { name: "Kassena Nankana Municipal", type: "Municipal" },
      { name: "Bawku Municipal", type: "Municipal" },
      { name: "Navrongo Municipal", type: "Municipal" },
      { name: "Bongo District", type: "District" },
      { name: "Talensi District", type: "District" },
      { name: "Nabdam District", type: "District" },
      { name: "Kassena Nankana West District", type: "District" },
      { name: "Builsa North Municipal", type: "Municipal" },
      { name: "Builsa South District", type: "District" },
      { name: "Bawku West District", type: "District" },
      { name: "Garu District", type: "District" },
      { name: "Tempane District", type: "District" },
      { name: "Pusiga District", type: "District" },
      { name: "Binduri District", type: "District" },
    ],
  },
  {
    name: "Upper West",
    capital: "Wa",
    code: "UW",
    districts: [
      { name: "Wa Metropolitan", type: "Metropolitan" },
      { name: "Jirapa Municipal", type: "Municipal" },
      { name: "Lawra Municipal", type: "Municipal" },
      { name: "Sissala East Municipal", type: "Municipal" },
      { name: "Sissala West District", type: "District" },
      { name: "Nadowli-Kaleo District", type: "District" },
      { name: "Daffiama Bussie Issa District", type: "District" },
      { name: "Wa West District", type: "District" },
      { name: "Wa East District", type: "District" },
      { name: "Nandom Municipal", type: "Municipal" },
      { name: "Lambussie Karni District", type: "District" },
    ],
  },
  {
    name: "Western North",
    capital: "Sefwi Wiawso",
    code: "WN",
    districts: [
      { name: "Sefwi Wiawso Municipal", type: "Municipal" },
      { name: "Aowin Municipal", type: "Municipal" },
      { name: "Bibiani Anhwiaso Bekwai Municipal", type: "Municipal" },
      { name: "Sefwi Akontombra District", type: "District" },
      { name: "Juaboso District", type: "District" },
      { name: "Bodi District", type: "District" },
      { name: "Bia West District", type: "District" },
      { name: "Bia East District", type: "District" },
      { name: "Suaman District", type: "District" },
    ],
  }
];

async function seedGhanaRegions() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Delete existing to start fresh
    await GhanaRegion.deleteMany({});
    console.log("Cleared existing Ghana regions.");

    // Insert new records
    await GhanaRegion.insertMany(regions);
    console.log("Successfully seeded Ghana regions and districts.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding Ghana regions:", error);
    process.exit(1);
  }
}

seedGhanaRegions();
