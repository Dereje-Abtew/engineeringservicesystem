// constants/ethiopianLocations.ts

export interface EthiopianRegion {
  id: string;
  name: string;
  nameAmharic: string;
  capital: string;
  cities: EthiopianCity[];
}

export interface EthiopianCity {
  id: string;
  name: string;
  nameAmharic: string;
  subCities: EthiopianSubCity[];
}

export interface EthiopianSubCity {
  id: string;
  name: string;
  nameAmharic: string;
  kebeles: string[];
}

// Comprehensive Ethiopian Regions, Cities, Sub-cities, and Kebeles
export const ethiopianRegions: EthiopianRegion[] = [
  {
    id: 'addis-ababa',
    name: 'Addis Ababa',
    nameAmharic: 'አዲስ አበባ',
    capital: 'Addis Ababa',
    cities: [
      {
        id: 'addis-ababa-city',
        name: 'Addis Ababa',
        nameAmharic: 'አዲስ አበባ',
        subCities: [
          { id: 'bole', name: 'Bole', nameAmharic: 'ቦሌ', kebeles: ['Bole 01', 'Bole 02', 'Bole 03', 'Bole 04', 'Bole 05', 'Bole 06', 'Bole 07', 'Bole 08', 'Bole 09', 'Bole 10', 'Bole 11', 'Bole 12', 'Bole 13', 'Bole 14', 'Bole 15'] },
          { id: 'kirkos', name: 'Kirkos', nameAmharic: 'ቂርቆስ', kebeles: ['Kirkos 01', 'Kirkos 02', 'Kirkos 03', 'Kirkos 04', 'Kirkos 05', 'Kirkos 06', 'Kirkos 07', 'Kirkos 08', 'Kirkos 09', 'Kirkos 10'] },
          { id: 'lideta', name: 'Lideta', nameAmharic: 'ልደታ', kebeles: ['Lideta 01', 'Lideta 02', 'Lideta 03', 'Lideta 04', 'Lideta 05', 'Lideta 06', 'Lideta 07', 'Lideta 08', 'Lideta 09', 'Lideta 10'] },
          { id: 'yeka', name: 'Yeka', nameAmharic: 'የካ', kebeles: ['Yeka 01', 'Yeka 02', 'Yeka 03', 'Yeka 04', 'Yeka 05', 'Yeka 06', 'Yeka 07', 'Yeka 08', 'Yeka 09', 'Yeka 10', 'Yeka 11', 'Yeka 12', 'Yeka 13', 'Yeka 14', 'Yeka 15'] },
          { id: 'gulele', name: 'Gulele', nameAmharic: 'ጉለሌ', kebeles: ['Gulele 01', 'Gulele 02', 'Gulele 03', 'Gulele 04', 'Gulele 05', 'Gulele 06', 'Gulele 07', 'Gulele 08', 'Gulele 09', 'Gulele 10'] },
          { id: 'kolfe-keranio', name: 'Kolfe Keranio', nameAmharic: 'ቆልፈ ቀራንዮ', kebeles: ['Kolfe 01', 'Kolfe 02', 'Kolfe 03', 'Kolfe 04', 'Kolfe 05', 'Kolfe 06', 'Kolfe 07', 'Kolfe 08', 'Kolfe 09', 'Kolfe 10', 'Kolfe 11', 'Kolfe 12', 'Kolfe 13'] },
          { id: 'addis-ketema', name: 'Addis Ketema', nameAmharic: 'አዲስ ከተማ', kebeles: ['Addis Ketema 01', 'Addis Ketema 02', 'Addis Ketema 03', 'Addis Ketema 04', 'Addis Ketema 05', 'Addis Ketema 06', 'Addis Ketema 07', 'Addis Ketema 08', 'Addis Ketema 09', 'Addis Ketema 10'] },
          { id: 'nifas-silk-lafto', name: 'Nifas Silk-Lafto', nameAmharic: 'ንፋስ ስልክ ላፍቶ', kebeles: ['Nifas Silk 01', 'Nifas Silk 02', 'Nifas Silk 03', 'Nifas Silk 04', 'Nifas Silk 05', 'Nifas Silk 06', 'Nifas Silk 07', 'Nifas Silk 08', 'Nifas Silk 09', 'Nifas Silk 10'] }
        ]
      }
    ]
  },
  {
    id: 'oromia',
    name: 'Oromia',
    nameAmharic: 'ኦሮሚያ',
    capital: 'Addis Ababa',
    cities: [
      {
        id: 'addama',
        name: 'Adama',
        nameAmharic: 'አዳማ',
        subCities: [
          { id: 'addama-center', name: 'Adama Center', nameAmharic: 'አዳማ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'batu', name: 'Batu', nameAmharic: 'ባቱ', kebeles: ['Batu 01', 'Batu 02', 'Batu 03', 'Batu 04', 'Batu 05'] },
          { id: 'mojo', name: 'Mojo', nameAmharic: 'ሞጆ', kebeles: ['Mojo 01', 'Mojo 02', 'Mojo 03', 'Mojo 04', 'Mojo 05'] }
        ]
      },
      {
        id: 'jimma',
        name: 'Jimma',
        nameAmharic: 'ጅማ',
        subCities: [
          { id: 'jimma-center', name: 'Jimma Center', nameAmharic: 'ጅማ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'jimma-awetu', name: 'Awetu', nameAmharic: 'አወቱ', kebeles: ['Awetu 01', 'Awetu 02', 'Awetu 03', 'Awetu 04', 'Awetu 05'] }
        ]
      },
      {
        id: 'bishoftu',
        name: 'Bishoftu',
        nameAmharic: 'ቢሾፍቱ',
        subCities: [
          { id: 'bishoftu-center', name: 'Bishoftu Center', nameAmharic: 'ቢሾፍቱ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06'] }
        ]
      },
      {
        id: 'ambo',
        name: 'Ambo',
        nameAmharic: 'አምቦ',
        subCities: [
          { id: 'ambo-center', name: 'Ambo Center', nameAmharic: 'አምቦ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05'] }
        ]
      }
    ]
  },
  {
    id: 'amhara',
    name: 'Amhara',
    nameAmharic: 'አማራ',
    capital: 'Bahir Dar',
    cities: [
      {
        id: 'bahir-dar',
        name: 'Bahir Dar',
        nameAmharic: 'ባህር ዳር',
        subCities: [
          { id: 'bahir-dar-center', name: 'Bahir Dar Center', nameAmharic: 'ባህር ዳር መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'gish-abay', name: 'Gish Abay', nameAmharic: 'ጊሽ አባይ', kebeles: ['Gish Abay 01', 'Gish Abay 02', 'Gish Abay 03'] }
        ]
      },
      {
        id: 'gondar',
        name: 'Gondar',
        nameAmharic: 'ጎንደር',
        subCities: [
          { id: 'gondar-center', name: 'Gondar Center', nameAmharic: 'ጎንደር መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08'] },
          { id: 'azezo', name: 'Azezo', nameAmharic: 'አዘዞ', kebeles: ['Azezo 01', 'Azezo 02', 'Azezo 03'] }
        ]
      },
      {
        id: 'dessie',
        name: 'Dessie',
        nameAmharic: 'ደሴ',
        subCities: [
          { id: 'dessie-center', name: 'Dessie Center', nameAmharic: 'ደሴ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06'] }
        ]
      },
      {
        id: 'lalibela',
        name: 'Lalibela',
        nameAmharic: 'ላሊበላ',
        subCities: [
          { id: 'lalibela-center', name: 'Lalibela Center', nameAmharic: 'ላሊበላ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04'] }
        ]
      }
    ]
  },
  {
    id: 'tigray',
    name: 'Tigray',
    nameAmharic: 'ትግራይ',
    capital: 'Mekelle',
    cities: [
      {
        id: 'mekelle',
        name: 'Mekelle',
        nameAmharic: 'መቀሌ',
        subCities: [
          { id: 'mekelle-center', name: 'Mekelle Center', nameAmharic: 'መቀሌ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'ayder', name: 'Ayder', nameAmharic: 'አይደር', kebeles: ['Ayder 01', 'Ayder 02', 'Ayder 03', 'Ayder 04', 'Ayder 05'] }
        ]
      },
      {
        id: 'aksum',
        name: 'Axum',
        nameAmharic: 'አክሱም',
        subCities: [
          { id: 'aksum-center', name: 'Axum Center', nameAmharic: 'አክሱም መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05'] }
        ]
      }
    ]
  },
  {
    id: 'snnpr',
    name: 'SNNPR',
    nameAmharic: 'ደቡብ ብሔሮች ብሔረሰቦችና ህዝቦች',
    capital: 'Hawassa',
    cities: [
      {
        id: 'hawassa',
        name: 'Hawassa',
        nameAmharic: 'አዋሳ',
        subCities: [
          { id: 'hawassa-center', name: 'Hawassa Center', nameAmharic: 'አዋሳ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'tabor', name: 'Tabor', nameAmharic: 'ታቦር', kebeles: ['Tabor 01', 'Tabor 02', 'Tabor 03'] }
        ]
      },
      {
        id: 'arba-minch',
        name: 'Arba Minch',
        nameAmharic: 'አርባ ምንጭ',
        subCities: [
          { id: 'arba-minch-center', name: 'Arba Minch Center', nameAmharic: 'አርባ ምንጭ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05'] }
        ]
      }
    ]
  },
  {
    id: 'harari',
    name: 'Harari',
    nameAmharic: 'ሐረሪ',
    capital: 'Harar',
    cities: [
      {
        id: 'harar',
        name: 'Harar',
        nameAmharic: 'ሐረር',
        subCities: [
          { id: 'harar-center', name: 'Harar Center', nameAmharic: 'ሐረር መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06'] }
        ]
      }
    ]
  },
  {
    id: 'dire-dawa',
    name: 'Dire Dawa',
    nameAmharic: 'ድሬ ዳዋ',
    capital: 'Dire Dawa',
    cities: [
      {
        id: 'dire-dawa-city',
        name: 'Dire Dawa',
        nameAmharic: 'ድሬ ዳዋ',
        subCities: [
          { id: 'dire-dawa-center', name: 'Dire Dawa Center', nameAmharic: 'ድሬ ዳዋ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05', 'Kebele 06', 'Kebele 07', 'Kebele 08', 'Kebele 09', 'Kebele 10'] },
          { id: 'kelecha', name: 'Kelecha', nameAmharic: 'ቀለጫ', kebeles: ['Kelecha 01', 'Kelecha 02', 'Kelecha 03'] }
        ]
      }
    ]
  },
  {
    id: 'somali',
    name: 'Somali',
    nameAmharic: 'ሶማሌ',
    capital: 'Jijiga',
    cities: [
      {
        id: 'jijiga',
        name: 'Jijiga',
        nameAmharic: 'ጅጅጋ',
        subCities: [
          { id: 'jijiga-center', name: 'Jijiga Center', nameAmharic: 'ጅጅጋ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04', 'Kebele 05'] }
        ]
      }
    ]
  },
  {
    id: 'benishangul-gumuz',
    name: 'Benishangul-Gumuz',
    nameAmharic: 'ቤንሻንጉል ጉሙዝ',
    capital: 'Assosa',
    cities: [
      {
        id: 'assosa',
        name: 'Assosa',
        nameAmharic: 'አሶሳ',
        subCities: [
          { id: 'assosa-center', name: 'Assosa Center', nameAmharic: 'አሶሳ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04'] }
        ]
      }
    ]
  },
  {
    id: 'gambela',
    name: 'Gambela',
    nameAmharic: 'ጋምቤላ',
    capital: 'Gambela',
    cities: [
      {
        id: 'gambela-city',
        name: 'Gambela',
        nameAmharic: 'ጋምቤላ',
        subCities: [
          { id: 'gambela-center', name: 'Gambela Center', nameAmharic: 'ጋምቤላ መሀል', kebeles: ['Kebele 01', 'Kebele 02', 'Kebele 03', 'Kebele 04'] }
        ]
      }
    ]
  }
];

// Function to fetch regions from public API with fallback
export const fetchEthiopianLocations = async () => {
  try {
    // Try to fetch from public API
    const response = await fetch('https://raw.githubusercontent.com/ewenet/ethiopia-regions/main/regions.json');
    const data = await response.json();
    return data;
  } catch (error) {
    // Fallback to local data
    console.log('Using local Ethiopian location data');
    return ethiopianRegions;
  }
};

// Helper function to search kebeles
export const searchKebeles = (searchTerm: string): Array<{ region: string; city: string; subCity: string; kebele: string }> => {
  const results: Array<{ region: string; city: string; subCity: string; kebele: string }> = [];
  const term = searchTerm.toLowerCase();
  
  ethiopianRegions.forEach(region => {
    region.cities.forEach(city => {
      city.subCities.forEach(subCity => {
        subCity.kebeles.forEach(kebele => {
          if (kebele.toLowerCase().includes(term) || 
              subCity.name.toLowerCase().includes(term) ||
              city.name.toLowerCase().includes(term) ||
              region.name.toLowerCase().includes(term)) {
            results.push({
              region: region.name,
              city: city.name,
              subCity: subCity.name,
              kebele: kebele
            });
          }
        });
      });
    });
  });
  
  return results;
};