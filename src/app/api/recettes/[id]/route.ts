import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la mise à jour
const recetteUpdateSchema = z.object({
  recette: z.object({
    nom: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    instructions: z.string().min(10).optional(),
    temps_preparation: z.number().min(1).max(480).optional(),
    temps_cuisson: z.number().min(0).max(480).optional(),
    portions: z.number().min(1).max(20).optional(),
    difficulte: z.number().min(1).max(5).optional(),
    regime_alimentaire: z.array(z.enum(['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'])).optional(),
    type_repas: z.array(z.enum(['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero'])).optional(),
    saison: z.array(z.enum(['printemps', 'ete', 'automne', 'hiver'])).optional(),
    is_public: z.boolean().optional(),
    notes_personnelles: z.string().optional()
  }),
  ingredients: z.array(z.object({
    ingredient_id: z.string().uuid(),
    quantite: z.number().positive(),
    unite: z.enum(['g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe', 'pincee', 'verre']),
    optionnel: z.boolean().default(false),
    notes: z.string().optional()
  })).optional(),
  ustensiles: z.array(z.object({
    ustensile_id: z.string().uuid(),
    obligatoire: z.boolean().default(false),
    notes: z.string().optional()
  })).optional()
});

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vérifier que l'utilisateur est propriétaire de la recette
async function checkRecetteOwnership(recetteId: string, userId: string) {
  const { data: recette, error } = await supabase
    .from('recettes')
    .select('user_id')
    .eq('id', recetteId)
    .single();

  if (error) {
    throw new Error('Recette non trouvée');
  }

  if (recette.user_id !== userId) {
    throw new Error('Accès non autorisé à cette recette');
  }

  return true;
}

// GET - Récupérer une recette spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = userData.id;
    const { id: recetteId } = await params;

    // Vérifier la propriété de la recette
    await checkRecetteOwnership(recetteId, userId);

    // Récupérer la recette complète avec relations
    const { data: recette, error } = await supabase
      .from('recettes')
      .select(`
        *,
        recette_ingredients (
          id,
          quantite,
          unite,
          optionnel,
          notes,
          ordre_affichage,
          ingredient:ingredients (
            id,
            nom,
            categorie,
            unite_base,
            allergenes,
            saison
          )
        ),
        recette_ustensiles (
          id,
          obligatoire,
          notes,
          ustensile:ustensiles (
            id,
            nom,
            categorie
          )
        )
      `)
      .eq('id', recetteId)
      .single();

    if (error) {
      console.error('Erreur récupération recette:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { recette }
    });

  } catch (error) {
    console.error('Erreur GET /api/recettes/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: error instanceof Error && error.message.includes('non trouvée') ? 404 : 500 }
    );
  }
}

// PUT - Mettre à jour une recette
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = userData.id;
    const { id: recetteId } = await params;
    const body = await request.json();

    // Vérifier la propriété de la recette
    await checkRecetteOwnership(recetteId, userId);

    // Validation des données
    const validatedData = recetteUpdateSchema.parse(body);
    const { recette, ingredients, ustensiles } = validatedData;

    // Mise à jour de la recette principale
    const updateData: Record<string, unknown> = {
      ...recette,
      updated_at: new Date().toISOString()
    };

    // Normaliser le nom si modifié
    if (recette.nom) {
      updateData.nom_normalise = normalizeString(recette.nom);
    }

    const { error: updateError } = await supabase
      .from('recettes')
      .update(updateData)
      .eq('id', recetteId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour recette:', updateError);
      throw updateError;
    }

    // Mise à jour des ingrédients si fournis
    if (ingredients !== undefined) {
      // Supprimer les anciens ingrédients
      await supabase
        .from('recette_ingredients')
        .delete()
        .eq('recette_id', recetteId);

      // Insérer les nouveaux ingrédients
      if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recette_ingredients')
          .insert(
            ingredients.map((ing, index) => ({
              recette_id: recetteId,
              ingredient_id: ing.ingredient_id,
              quantite: ing.quantite,
              unite: ing.unite,
              optionnel: ing.optionnel,
              notes: ing.notes,
              ordre_affichage: index + 1,
              created_at: new Date().toISOString()
            }))
          );

        if (ingredientsError) {
          console.error('Erreur mise à jour ingrédients:', ingredientsError);
          throw ingredientsError;
        }
      }
    }

    // Mise à jour des ustensiles si fournis
    if (ustensiles !== undefined) {
      // Supprimer les anciens ustensiles
      await supabase
        .from('recette_ustensiles')
        .delete()
        .eq('recette_id', recetteId);

      // Insérer les nouveaux ustensiles
      if (ustensiles.length > 0) {
        const { error: ustensilesError } = await supabase
          .from('recette_ustensiles')
          .insert(
            ustensiles.map((ust) => ({
              recette_id: recetteId,
              ustensile_id: ust.ustensile_id,
              obligatoire: ust.obligatoire,
              notes: ust.notes,
              created_at: new Date().toISOString()
            }))
          );

        if (ustensilesError) {
          console.error('Erreur mise à jour ustensiles:', ustensilesError);
          throw ustensilesError;
        }
      }
    }

    // Récupérer la recette mise à jour avec relations
    const { data: recetteComplete, error: fetchError } = await supabase
      .from('recettes')
      .select(`
        *,
        recette_ingredients (
          id,
          quantite,
          unite,
          optionnel,
          notes,
          ordre_affichage,
          ingredient:ingredients (
            id,
            nom,
            categorie,
            unite_base,
            allergenes
          )
        ),
        recette_ustensiles (
          id,
          obligatoire,
          notes,
          ustensile:ustensiles (
            id,
            nom,
            categorie
          )
        )
      `)
      .eq('id', recetteId)
      .single();

    if (fetchError) {
      console.error('Erreur récupération recette mise à jour:', fetchError);
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: { recette: recetteComplete }
    });

  } catch (error) {
    console.error('Erreur PUT /api/recettes/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une recette
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = userData.id;
    const { id: recetteId } = await params;

    // Vérifier la propriété de la recette
    await checkRecetteOwnership(recetteId, userId);

    // Supprimer la recette (les relations seront supprimées en cascade)
    const { error } = await supabase
      .from('recettes')
      .delete()
      .eq('id', recetteId);

    if (error) {
      console.error('Erreur suppression recette:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Recette supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE /api/recettes/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}