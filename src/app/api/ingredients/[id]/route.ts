import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la mise à jour d'ingrédient
const ingredientUpdateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255, 'Le nom ne peut pas dépasser 255 caractères').optional(),
  categorie: z.enum(['legume', 'fruit', 'viande', 'poisson', 'feculent', 'produit_laitier', 'epice', 'condiment', 'boisson', 'autre']).optional(),
  unite_base: z.enum(['g', 'kg', 'ml', 'l', 'piece']).optional(),
  prix_moyen: z.number().positive().optional(),
  allergenes: z.array(z.enum(['gluten', 'lactose', 'oeuf', 'arachide', 'fruits_coque', 'soja', 'poisson', 'crustace'])).optional(),
  saison: z.array(z.enum(['printemps', 'ete', 'automne', 'hiver'])).optional()
});

// Fonction utilitaire pour normaliser les chaînes
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vérifier que l'utilisateur a accès à l'ingrédient (propriétaire OU ingrédient public)
async function checkIngredientAccess(ingredientId: string, userId: string) {
  const { data: ingredient, error } = await supabase
    .from('ingredients')
    .select('user_id, is_public')
    .eq('id', ingredientId)
    .single();

  if (error) {
    throw new Error('Ingrédient non trouvé');
  }

  // Autoriser l'accès si l'utilisateur est propriétaire OU si l'ingrédient est public
  if (ingredient.user_id !== userId && !ingredient.is_public) {
    throw new Error('Accès non autorisé à cet ingrédient');
  }

  return true;
}

// Vérifier que l'utilisateur est propriétaire de l'ingrédient - MODIFICATION SEULEMENT
async function checkIngredientOwnership(ingredientId: string, userId: string) {
  const { data: ingredient, error } = await supabase
    .from('ingredients')
    .select('user_id')
    .eq('id', ingredientId)
    .single();

  if (error) {
    throw new Error('Ingrédient non trouvé');
  }

  // Seul le propriétaire peut modifier
  if (ingredient.user_id !== userId) {
    throw new Error('Seul le propriétaire peut modifier cet ingrédient');
  }

  return true;
}

// GET - Récupérer un ingrédient spécifique
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
    const { id: ingredientId } = await params;

    // Vérifier l'accès à l'ingrédient (propriétaire ou public)
    await checkIngredientAccess(ingredientId, userId);

    // Récupérer l'ingrédient
    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', ingredientId)
      .single();

    if (error) {
      console.error('Erreur récupération ingrédient:', error);
      throw new Error('Ingrédient non trouvé');
    }

    return NextResponse.json({
      success: true,
      data: { ingredient }
    });

  } catch (error) {
    console.error('Erreur GET /api/ingredients/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: error instanceof Error && error.message.includes('non trouvé') ? 404 : 500 }
    );
  }
}

// PUT - Mettre à jour un ingrédient
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
    const { id: ingredientId } = await params;
    const body = await request.json();

    // Vérifier la propriété de l'ingrédient
    await checkIngredientOwnership(ingredientId, userId);

    // Validation des données
    const validatedData = ingredientUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    // Normaliser le nom si modifié
    if (validatedData.nom) {
      updateData.nom_normalise = normalizeString(validatedData.nom);
    }

    // Mise à jour de l'ingrédient
    const { data: updatedIngredient, error } = await supabase
      .from('ingredients')
      .update(updateData)
      .eq('id', ingredientId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour ingrédient:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { ingredient: updatedIngredient }
    });

  } catch (error) {
    console.error('Erreur PUT /api/ingredients/[id]:', error);
    
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

    // Gestion spécifique des erreurs de sécurité
    if (error instanceof Error && error.message.includes('Seul le propriétaire peut modifier')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cet ingrédient ne peut pas être modifié car il appartient à un autre utilisateur ou est un ingrédient public du système.',
          code: 'MODIFICATION_NON_AUTORISEE'
        },
        { status: 403 }
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

// DELETE - Supprimer un ingrédient
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
    const { id: ingredientId } = await params;

    // Vérifier la propriété de l'ingrédient
    await checkIngredientOwnership(ingredientId, userId);

    // Vérifier si l'ingrédient est utilisé dans des recettes
    const { data: usageCheck, error: usageError } = await supabase
      .from('recette_ingredients')
      .select('recette_id')
      .eq('ingredient_id', ingredientId)
      .limit(1);

    if (usageError) {
      console.error('Erreur vérification usage ingrédient:', usageError);
      throw new Error('Erreur lors de la vérification de l\'usage de l\'ingrédient');
    }

    if (usageCheck && usageCheck.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cet ingrédient ne peut pas être supprimé car il est utilisé dans des recettes.' 
        },
        { status: 409 }
      );
    }

    // Supprimer l'ingrédient
    const { error: deleteError } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', ingredientId);

    if (deleteError) {
      console.error('Erreur suppression ingrédient:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Ingrédient supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE /api/ingredients/[id]:', error);
    
    // Gestion spécifique des erreurs de sécurité
    if (error instanceof Error && error.message.includes('Seul le propriétaire peut modifier')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cet ingrédient ne peut pas être supprimé car il appartient à un autre utilisateur.',
          code: 'SUPPRESSION_NON_AUTORISEE'
        },
        { status: 403 }
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