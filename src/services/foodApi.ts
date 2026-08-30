// Food API Service — Open Food Facts + USDA FoodData Central + Tamil local fallback
import tamilFoodTable from '../data/tamilFoodTable.json';

export interface FoodNutrientInfo {
  name: string;
  nameTamil?: string;
  calories: number;
  protein: number;
  iron: number;
  calcium?: number;
  folate?: number;
  carbs?: number;
  fat?: number;
  source: 'openfoodfacts' | 'usda' | 'local_tamil_table' | 'manual';
}

export const searchFoodItem = async (query: string): Promise<FoodNutrientInfo[]> => {
  const q = query.toLowerCase().trim();
  const results: FoodNutrientInfo[] = [];

  // 1. Search local Tamil table first for quick offline match
  const tamilMatches = tamilFoodTable.filter(f => 
    f.name.toLowerCase().includes(q) || f.nameTamil.includes(q)
  );

  for (const match of tamilMatches) {
    results.push({
      name: match.name,
      nameTamil: match.nameTamil,
      calories: match.calories,
      protein: match.protein,
      iron: match.iron,
      calcium: match.calcium,
      folate: match.folate,
      source: 'local_tamil_table',
    });
  }

  // 2. Try USDA Text Search API if online
  try {
    const USDA_API_KEY = 'fY5MudKpEhkaLYgyUeuxi2cK9oQEhRa8agaSLWLS'; // User USDA API Key
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${USDA_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      if (data.foods && Array.isArray(data.foods)) {
        for (const food of data.foods) {
          const energyNutrient = food.foodNutrients?.find((n: any) => n.nutrientName === 'Energy' || n.unitName === 'KCAL');
          const proteinNutrient = food.foodNutrients?.find((n: any) => n.nutrientName === 'Protein');
          const ironNutrient = food.foodNutrients?.find((n: any) => n.nutrientName === 'Iron, Fe');
          const calciumNutrient = food.foodNutrients?.find((n: any) => n.nutrientName?.includes('Calcium'));
          const folateNutrient = food.foodNutrients?.find((n: any) => n.nutrientName?.includes('Folate'));

          results.push({
            name: food.description,
            calories: energyNutrient ? Math.round(energyNutrient.value) : 0,
            protein: proteinNutrient ? Math.round(proteinNutrient.value) : 0,
            iron: ironNutrient ? Math.round(ironNutrient.value * 10) / 10 : 0,
            calcium: calciumNutrient ? Math.round(calciumNutrient.value) : undefined,
            folate: folateNutrient ? Math.round(folateNutrient.value) : undefined,
            source: 'usda',
          });
        }
      }
    }
  } catch (e) {
    console.log('USDA API query skipped/offline:', e);
  }

  return results;
};

export const fetchBarcodeProduct = async (barcode: string): Promise<FoodNutrientInfo | null> => {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        return {
          name: p.product_name || 'Scanned Product',
          calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
          protein: Math.round(p.nutriments?.protein_100g || 0),
          iron: Math.round((p.nutriments?.iron_100g || 0) * 1000) / 10,
          source: 'openfoodfacts',
        };
      }
    }
  } catch (e) {
    console.log('OpenFoodFacts API error:', e);
  }
  return null;
};
