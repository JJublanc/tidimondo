import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { 
  ListeCoursesContenu, 
  ListeCoursesIngredient, 
  CategorieIngredient,
  UniteRecette,
  RepasComposition,
  RepasIngredient
} from '@/types/tidimondo';

// Fonction pour convertir les unités vers une unité de base
function convertToBaseUnit(quantite: number, unite: UniteRecette, uniteBase: string): number {
  // Conversions de base
  const conversions: Record<string, Record<string, number>> = {
    'g': {
      'kg': 1000,
      'g': 1
    },
    'ml': {
      'l': 1000,
      'ml': 1
    },
    'piece': {
      'piece': 1
    }
  };

  // Conversions approximatives pour les unités de cuisine
  const approximateConversions: Record<string, number> = {
    'cuillere_soupe': 15, // ml
    'cuillere_cafe': 5, // ml
    'verre': 200, // ml
    'pincee': 1 // g
  };

  if (unite === uniteBase) {
    return quantite;
  }

  // Conversion directe
  if (conversions[uniteBase] && conversions[uniteBase][unite]) {
    return quantite * conversions[uniteBase][unite];
  }

  // Conversions approximatives
  if (approximateConversions[unite]) {
    if (uniteBase === 'ml' || uniteBase === 'g') {
      return quantite * approximateConversions[unite];
    }
  }

  // Si pas de conversion possible, retourner la quantité originale
  return quantite;
}

// Fonction pour vérifier si deux unités sont compatibles (même famille)
function areUnitsCompatible(unite1: string, unite2: string): boolean {
  // Familles d'unités compatibles
  const volumeUnits = ['ml', 'l', 'cl', 'dl', 'cuillere_soupe', 'cuillere_cafe', 'verre'];
  const weightUnits = ['g', 'kg', 'mg', 'cuillere_soupe', 'cuillere_cafe', 'pincee'];
  const countUnits = ['piece', 'unite'];
  
  const families = [volumeUnits, weightUnits, countUnits];
  
  for (const family of families) {
    if (family.includes(unite1) && family.includes(unite2)) {
      return true;
    }
  }
  
  return false;
}

// Fonction pour agréger les ingrédients
function aggregateIngredients(ingredients: Array<{
  ingredient_id: string;
  nom: string;
  quantite: number;
  unite: UniteRecette;
  unite_base: string;
  categorie: CategorieIngredient | null;
  prix_moyen_euro: number | null;
  recette_nom?: string;
  notes?: string;
}>): ListeCoursesIngredient[] {
  console.log(`🔄 Agrégation de ${ingredients.length} ingrédients`);
  
  const aggregated = new Map<string, {
    ingredient_id: string;
    nom: string;
    quantite_totale: number;
    unite: UniteRecette;
    prix_estime: number | null;
    recettes_utilisees: Set<string>;
    notes: Set<string>;
    unite_base: string;
  }>();

  for (const ingredient of ingredients) {
    const key = ingredient.ingredient_id;
    
    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      
      // Vérifier si les unités sont compatibles
      if (areUnitsCompatible(existing.unite, ingredient.unite)) {
        if (existing.unite === ingredient.unite) {
          // Même unité exacte, addition directe
          console.log(`  ➕ ${ingredient.nom}: ${existing.quantite_totale} ${existing.unite} + ${ingredient.quantite} ${ingredient.unite} = ${existing.quantite_totale + ingredient.quantite} ${existing.unite}`);
          existing.quantite_totale += ingredient.quantite;
        } else {
          // Unités compatibles mais différentes : convertir vers l'unité de base et additionner
          const quantiteConverted = convertToBaseUnit(ingredient.quantite, ingredient.unite, ingredient.unite_base);
          const existingConverted = convertToBaseUnit(existing.quantite_totale, existing.unite, existing.unite_base);
          
          console.log(`  ➕ ${ingredient.nom}: ${existing.quantite_totale} ${existing.unite} + ${ingredient.quantite} ${ingredient.unite} = ${existingConverted + quantiteConverted} ${ingredient.unite_base}`);
          
          existing.quantite_totale = existingConverted + quantiteConverted;
          existing.unite = ingredient.unite_base as UniteRecette;
        }
      } else {
        // Unités incompatibles : créer une entrée séparée
        const newKey = `${ingredient.ingredient_id}_${ingredient.unite}`;
        console.log(`  ⚠️ ${ingredient.nom}: unités incompatibles (${existing.unite} vs ${ingredient.unite}), création d'une entrée séparée`);
        
        aggregated.set(newKey, {
          ingredient_id: ingredient.ingredient_id,
          nom: `${ingredient.nom} (${ingredient.unite})`,
          quantite_totale: ingredient.quantite,
          unite: ingredient.unite,
          prix_estime: ingredient.prix_moyen_euro,
          recettes_utilisees: new Set(ingredient.recette_nom ? [ingredient.recette_nom] : []),
          notes: new Set(ingredient.notes ? [ingredient.notes] : []),
          unite_base: ingredient.unite_base
        });
        continue;
      }
      
      if (ingredient.recette_nom) {
        existing.recettes_utilisees.add(ingredient.recette_nom);
      }
      if (ingredient.notes) {
        existing.notes.add(ingredient.notes);
      }
      if (ingredient.prix_moyen_euro && existing.prix_estime) {
        existing.prix_estime = Math.max(existing.prix_estime, ingredient.prix_moyen_euro);
      } else if (ingredient.prix_moyen_euro) {
        existing.prix_estime = ingredient.prix_moyen_euro;
      }
    } else {
      console.log(`  ➕ ${ingredient.nom}: nouveau → ${ingredient.quantite} ${ingredient.unite}`);
      
      aggregated.set(key, {
        ingredient_id: ingredient.ingredient_id,
        nom: ingredient.nom,
        quantite_totale: ingredient.quantite,
        unite: ingredient.unite,
        prix_estime: ingredient.prix_moyen_euro,
        recettes_utilisees: new Set(ingredient.recette_nom ? [ingredient.recette_nom] : []),
        notes: new Set(ingredient.notes ? [ingredient.notes] : []),
        unite_base: ingredient.unite_base
      });
    }
  }

  return Array.from(aggregated.entries()).map(([key, item]) => ({
    id: key, // Clé unique pour React (ingredient_id ou ingredient_id_unite)
    ingredient_id: item.ingredient_id,
    nom: item.nom,
    quantite_totale: Math.round(item.quantite_totale * 100) / 100, // Arrondir à 2 décimales
    unite: item.unite,
    prix_estime: item.prix_estime ? Math.round(item.prix_estime * item.quantite_totale * 100) / 100 : null,
    recettes_utilisees: Array.from(item.recettes_utilisees),
    notes: Array.from(item.notes)
  }));
}

// Fonction pour extraire les ingrédients de la composition d'un repas
function extractIngredientsFromComposition(
  composition: RepasComposition, 
  nombrePortions: number
): Array<{
  ingredient_id: string;
  nom: string;
  quantite: number;
  unite: UniteRecette;
}> {
  const ingredients: Array<{
    ingredient_id: string;
    nom: string;
    quantite: number;
    unite: UniteRecette;
  }> = [];

  // Ingrédients du repas simple
  if (composition.repas_simple?.ingredients) {
    for (const ing of composition.repas_simple.ingredients) {
      const quantite = ing.quantite_par_personne ? ing.quantite * nombrePortions : ing.quantite;
      ingredients.push({
        ingredient_id: ing.ingredient_id,
        nom: ing.nom,
        quantite,
        unite: ing.unite
      });
    }
  }

  // Ingrédients du repas principal
  if (composition.repas_principal?.ingredients) {
    for (const ing of composition.repas_principal.ingredients) {
      const quantite = ing.quantite_par_personne ? ing.quantite * nombrePortions : ing.quantite;
      ingredients.push({
        ingredient_id: ing.ingredient_id,
        nom: ing.nom,
        quantite,
        unite: ing.unite
      });
    }
  }

  // Accompagnements
  if (composition.accompagnements) {
    const acc = composition.accompagnements;
    
    // Pain
    if (acc.pain) {
      const quantite = acc.pain.quantite_par_personne ? acc.pain.quantite * nombrePortions : acc.pain.quantite;
      ingredients.push({
        ingredient_id: acc.pain.ingredient_id,
        nom: acc.pain.nom,
        quantite,
        unite: acc.pain.unite
      });
    }
    
    // Fromage
    if (acc.fromage) {
      const quantite = acc.fromage.quantite_par_personne ? acc.fromage.quantite * nombrePortions : acc.fromage.quantite;
      ingredients.push({
        ingredient_id: acc.fromage.ingredient_id,
        nom: acc.fromage.nom,
        quantite,
        unite: acc.fromage.unite
      });
    }
    
    // Autres ingrédients
    if (acc.autres_ingredients) {
      for (const ing of acc.autres_ingredients) {
        const quantite = ing.quantite_par_personne ? ing.quantite * nombrePortions : ing.quantite;
        ingredients.push({
          ingredient_id: ing.ingredient_id,
          nom: ing.nom,
          quantite,
          unite: ing.unite
        });
      }
    }
  }

  return ingredients;
}

// GET /api/sejours/[id]/liste-courses - Générer la liste de courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin;
    const { id: sejourId } = await params;

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: { message: 'Utilisateur non trouvé' } },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Vérification que le séjour appartient à l'utilisateur
    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .select('id, nom, date_debut, date_fin, nombre_participants')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (sejourError || !sejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Récupération des repas avec les recettes et leurs ingrédients
    const { data: repas, error: repasError } = await supabase
      .from('sejour_repas')
      .select(`
        id,
        recette_id,
        date_repas,
        type_repas,
        nombre_portions,
        composition,
        recette:recettes(
          id,
          nom,
          portions,
          recette_ingredients(
            id,
            quantite,
            unite,
            optionnel,
            notes,
            ingredient:ingredients(
              id,
              nom,
              unite_base,
              categorie,
              prix_moyen_euro
            )
          )
        )
      `)
      .eq('sejour_id', sejourId)
      .order('date_repas')
      .order('ordre_dans_journee');

    if (repasError) {
      console.error('Erreur lors de la récupération des repas:', repasError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la récupération des repas' } },
        { status: 500 }
      );
    }

    // Log pour déboguer la récupération des repas
    console.log('🔍 Données brutes des repas récupérées:', JSON.stringify(repas, null, 2));

    // Collecter tous les ingrédients nécessaires
    const allIngredients: Array<{
      ingredient_id: string;
      nom: string;
      quantite: number;
      unite: UniteRecette;
      unite_base: string;
      categorie: CategorieIngredient | null;
      prix_moyen_euro: number | null;
      recette_nom?: string;
      notes?: string;
    }> = [];

    console.log(`🔍 Traitement de ${repas?.length || 0} repas pour le séjour`);
    
    for (const repasItem of repas || []) {
      console.log(`📅 Traitement repas du ${repasItem.date_repas} - ${repasItem.type_repas}`);
      console.log(`   🔍 recette_id: ${repasItem.recette_id}`);
      console.log(`   🔍 recette data:`, repasItem.recette);
      
      // Ingrédients des recettes
      let recetteData = null;
      
      // Vérifier d'abord s'il y a une recette dans la colonne recette_id
      if (repasItem.recette) {
        const recette = repasItem.recette as any;
        // Supabase peut retourner un tableau ou un objet unique
        recetteData = Array.isArray(recette) ? recette[0] : recette;
        console.log(`   ✅ Recette trouvée via colonne recette_id`);
      }
      // Si pas de recette dans la colonne, chercher dans la composition
      else if (repasItem.composition?.repas_principal?.plat_principal?.recette_id) {
        const recetteId = repasItem.composition.repas_principal.plat_principal.recette_id;
        console.log(`   🔍 Recette trouvée dans composition: ${recetteId}`);
        
        // Récupérer les données de la recette depuis la base
        const { data: recetteFromDb, error: recetteError } = await supabase
          .from('recettes')
          .select(`
            id,
            nom,
            portions,
            recette_ingredients(
              id,
              quantite,
              unite,
              optionnel,
              notes,
              ingredient:ingredients(
                id,
                nom,
                unite_base,
                categorie,
                prix_moyen_euro
              )
            )
          `)
          .eq('id', recetteId)
          .single();
          
        if (!recetteError && recetteFromDb) {
          recetteData = recetteFromDb;
          console.log(`   ✅ Données recette récupérées: ${recetteData.nom}`);
        } else {
          console.log(`   ❌ Erreur récupération recette:`, recetteError);
        }
      }
      
      if (recetteData && recetteData.recette_ingredients) {
        // CORRECTION: Le facteur de portion doit tenir compte du nombre de participants du séjour
        // repasItem.nombre_portions = nombre de personnes pour ce repas
        // recetteData.portions = nombre de portions de la recette originale
        const facteurPortion = repasItem.nombre_portions / recetteData.portions;
        
        console.log(`🍽️ Recette "${recetteData.nom}": ${recetteData.portions} portions originales → ${repasItem.nombre_portions} portions nécessaires (facteur: ${facteurPortion})`);
        
        for (const recetteIngredient of recetteData.recette_ingredients) {
          if (!recetteIngredient.optionnel && recetteIngredient.ingredient) {
            const quantiteAjustee = recetteIngredient.quantite * facteurPortion;
            console.log(`  🥕 ${recetteIngredient.ingredient.nom}: ${recetteIngredient.quantite} ${recetteIngredient.unite} × ${facteurPortion} = ${quantiteAjustee} ${recetteIngredient.unite}`);
            
            allIngredients.push({
              ingredient_id: recetteIngredient.ingredient.id,
              nom: recetteIngredient.ingredient.nom,
              quantite: quantiteAjustee,
              unite: recetteIngredient.unite,
              unite_base: recetteIngredient.ingredient.unite_base,
              categorie: recetteIngredient.ingredient.categorie,
              prix_moyen_euro: recetteIngredient.ingredient.prix_moyen_euro,
              recette_nom: recetteData.nom,
              notes: recetteIngredient.notes || undefined
            });
          }
        }
      } else {
        console.log(`   ❌ Pas de recette pour ce repas`);
      }

      // Ingrédients de la composition du repas
      if (repasItem.composition) {
        console.log(`🍽️ Traitement composition du repas (${repasItem.nombre_portions} portions)`);
        
        const compositionIngredients = extractIngredientsFromComposition(
          repasItem.composition as RepasComposition,
          repasItem.nombre_portions
        );

        console.log(`  📝 ${compositionIngredients.length} ingrédients dans la composition`);

        // Récupérer les détails des ingrédients de la composition
        for (const compIng of compositionIngredients) {
          const { data: ingredientData } = await supabase
            .from('ingredients')
            .select('id, nom, unite_base, categorie, prix_moyen_euro')
            .eq('id', compIng.ingredient_id)
            .single();

          if (ingredientData) {
            console.log(`  🥕 ${compIng.nom}: ${compIng.quantite} ${compIng.unite}`);
            
            allIngredients.push({
              ingredient_id: compIng.ingredient_id,
              nom: compIng.nom,
              quantite: compIng.quantite,
              unite: compIng.unite,
              unite_base: ingredientData.unite_base,
              categorie: ingredientData.categorie,
              prix_moyen_euro: ingredientData.prix_moyen_euro
            });
          }
        }
      }
    }

    console.log(`📊 Total ingrédients collectés: ${allIngredients.length}`);
    
    // Agréger les ingrédients
    const ingredientsAgreges = aggregateIngredients(allIngredients);
    
    console.log(`📊 Ingrédients après agrégation: ${ingredientsAgreges.length}`);

    // Organiser par catégories
    const categories: Record<CategorieIngredient, ListeCoursesIngredient[]> = {
      'legume': [],
      'fruit': [],
      'viande': [],
      'poisson': [],
      'feculent': [],
      'produit_laitier': [],
      'epice': [],
      'condiment': [],
      'boisson': [],
      'autre': []
    };
    
    for (const ingredient of ingredientsAgreges) {
      // Récupérer la catégorie de l'ingrédient
      const { data: ingredientData } = await supabase
        .from('ingredients')
        .select('categorie')
        .eq('id', ingredient.ingredient_id)
        .single();

      const categorie = (ingredientData?.categorie || 'autre') as CategorieIngredient;
      categories[categorie].push(ingredient);
    }

    // Calculer le coût total estimé
    const coutTotalEstime = ingredientsAgreges.reduce((total, ing) => {
      return total + (ing.prix_estime || 0);
    }, 0);

    // Construire le contenu de la liste de courses
    const contenu: ListeCoursesContenu = {
      ingredients: ingredientsAgreges,
      resume: {
        nombre_recettes: new Set(repas?.filter(r => r.recette_id).map(r => r.recette_id)).size,
        nombre_repas: repas?.length || 0,
        nombre_participants: sejour.nombre_participants,
        periode: {
          debut: sejour.date_debut,
          fin: sejour.date_fin
        }
      },
      categories: categories
    };

    return NextResponse.json({
      data: {
        contenu,
        cout_total_estime: Math.round(coutTotalEstime * 100) / 100,
        sejour: {
          id: sejour.id,
          nom: sejour.nom,
          date_debut: sejour.date_debut,
          date_fin: sejour.date_fin,
          nombre_participants: sejour.nombre_participants
        }
      }
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}