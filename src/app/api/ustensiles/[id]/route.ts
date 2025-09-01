import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la mise à jour d'ustensile
const ustensileUpdateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255, 'Le nom ne peut pas dépasser 255 caractères').optional(),
  description: z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères').optional(),
  categorie: z.enum(['cuisson', 'preparation', 'service', 'mesure', 'autre']).optional(),
  obligatoire: z.boolean().optional()
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

// Vérifier que l'utilisateur a accès à l'ustensile (propriétaire OU ustensile public)
async function checkUstensileAccess(ustensileId: string, userId: string) {
  const { data: ustensile, error } = await supabase
    .from('ustensiles')
    .select('user_id, is_public')
    .eq('id', ustensileId)
    .single();

  if (error) {
    throw new Error('Ustensile non trouvé');
  }

  // Autoriser l'accès si l'utilisateur est propriétaire OU si l'ustensile est public
  if (ustensile.user_id !== userId && !ustensile.is_public) {
    throw new Error('Accès non autorisé à cet ustensile');
  }

  return true;
}

// Vérifier que l'utilisateur est propriétaire de l'ustensile - MODIFICATION SEULEMENT
async function checkUstensileOwnership(ustensileId: string, userId: string) {
  const { data: ustensile, error } = await supabase
    .from('ustensiles')
    .select('user_id')
    .eq('id', ustensileId)
    .single();

  if (error) {
    throw new Error('Ustensile non trouvé');
  }

  // Seul le propriétaire peut modifier
  if (ustensile.user_id !== userId) {
    throw new Error('Seul le propriétaire peut modifier cet ustensile');
  }

  return true;
}

// GET - Récupérer un ustensile spécifique
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
    const { id: ustensileId } = await params;

    // Vérifier l'accès à l'ustensile (propriétaire ou public)
    await checkUstensileAccess(ustensileId, userId);

    // Récupérer l'ustensile
    const { data: ustensile, error } = await supabase
      .from('ustensiles')
      .select('*')
      .eq('id', ustensileId)
      .single();

    if (error) {
      console.error('Erreur récupération ustensile:', error);
      throw new Error('Ustensile non trouvé');
    }

    return NextResponse.json({
      success: true,
      data: { ustensile }
    });

  } catch (error) {
    console.error('Erreur GET /api/ustensiles/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: error instanceof Error && error.message.includes('non trouvé') ? 404 : 500 }
    );
  }
}

// PUT - Mettre à jour un ustensile
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
    const { id: ustensileId } = await params;
    const body = await request.json();

    // Vérifier la propriété de l'ustensile
    await checkUstensileOwnership(ustensileId, userId);

    // Validation des données
    const validatedData = ustensileUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    // Normaliser le nom si modifié
    if (validatedData.nom) {
      updateData.nom_normalise = normalizeString(validatedData.nom);
    }

    // Mise à jour de l'ustensile
    const { data: updatedUstensile, error } = await supabase
      .from('ustensiles')
      .update(updateData)
      .eq('id', ustensileId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour ustensile:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { ustensile: updatedUstensile }
    });

  } catch (error) {
    console.error('Erreur PUT /api/ustensiles/[id]:', error);
    
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
          error: 'Cet ustensile ne peut pas être modifié car il appartient à un autre utilisateur ou est un ustensile public du système.',
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

// DELETE - Supprimer un ustensile
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
    const { id: ustensileId } = await params;

    // Vérifier la propriété de l'ustensile
    await checkUstensileOwnership(ustensileId, userId);

    // Vérifier si l'ustensile est utilisé dans des recettes
    const { data: usageCheck, error: usageError } = await supabase
      .from('recette_ustensiles')
      .select('recette_id')
      .eq('ustensile_id', ustensileId)
      .limit(1);

    if (usageError) {
      console.error('Erreur vérification usage ustensile:', usageError);
      throw new Error('Erreur lors de la vérification de l\'usage de l\'ustensile');
    }

    if (usageCheck && usageCheck.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cet ustensile ne peut pas être supprimé car il est utilisé dans des recettes.' 
        },
        { status: 409 }
      );
    }

    // Supprimer l'ustensile
    const { error: deleteError } = await supabase
      .from('ustensiles')
      .delete()
      .eq('id', ustensileId);

    if (deleteError) {
      console.error('Erreur suppression ustensile:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Ustensile supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE /api/ustensiles/[id]:', error);
    
    // Gestion spécifique des erreurs de sécurité
    if (error instanceof Error && error.message.includes('Seul le propriétaire peut modifier')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cet ustensile ne peut pas être supprimé car il appartient à un autre utilisateur.',
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