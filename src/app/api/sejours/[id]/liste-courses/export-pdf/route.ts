import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/sejours/[id]/liste-courses/export-pdf - Exporter la liste de courses en PDF
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

    // Récupérer les données de la liste de courses
    const listeCoursesResponse = await fetch(
      `${request.nextUrl.origin}/api/sejours/${sejourId}/liste-courses`,
      {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        }
      }
    );

    if (!listeCoursesResponse.ok) {
      throw new Error('Erreur lors de la récupération de la liste de courses');
    }

    const listeCoursesData = await listeCoursesResponse.json();
    const { contenu, cout_total_estime } = listeCoursesData.data;

    // Générer le HTML pour le PDF
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const categorieLabels: Record<string, string> = {
      'legume': '🥬 Légumes',
      'fruit': '🍎 Fruits',
      'viande': '🥩 Viandes',
      'poisson': '🐟 Poissons',
      'feculent': '🍞 Féculents',
      'produit_laitier': '🧀 Produits laitiers',
      'epice': '🌶️ Épices',
      'condiment': '🧂 Condiments',
      'boisson': '🥤 Boissons',
      'autre': '📦 Autres'
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liste de courses - ${sejour.nom}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header h2 {
            color: #6b7280;
            margin: 0 0 5px 0;
            font-size: 20px;
            font-weight: normal;
        }
        .header p {
            color: #9ca3af;
            margin: 0;
            font-size: 14px;
        }
        .resume {
            display: flex;
            justify-content: space-around;
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .resume-item {
            text-align: center;
        }
        .resume-item .number {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
        }
        .resume-item .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
        }
        .category {
            margin-bottom: 25px;
            break-inside: avoid;
        }
        .category-header {
            background-color: #f3f4f6;
            padding: 12px 16px;
            border-radius: 6px 6px 0 0;
            border-left: 4px solid #3b82f6;
            margin-bottom: 0;
        }
        .category-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
        }
        .category-count {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }
        .ingredients-list {
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 6px 6px;
        }
        .ingredient {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #f3f4f6;
        }
        .ingredient:last-child {
            border-bottom: none;
        }
        .ingredient-info {
            flex: 1;
        }
        .ingredient-name {
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 2px;
        }
        .ingredient-recipes {
            font-size: 12px;
            color: #6b7280;
        }
        .ingredient-quantity {
            font-weight: bold;
            color: #059669;
            white-space: nowrap;
            margin-left: 16px;
        }
        .ingredient-price {
            font-size: 12px;
            color: #dc2626;
            white-space: nowrap;
            margin-left: 8px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .category { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Liste de courses</h1>
        <h2>${sejour.nom}</h2>
        <p>Du ${formatDate(sejour.date_debut)} au ${formatDate(sejour.date_fin)}</p>
    </div>

    <div class="resume">
        <div class="resume-item">
            <div class="number">${contenu.resume.nombre_participants}</div>
            <div class="label">Participants</div>
        </div>
        <div class="resume-item">
            <div class="number">${contenu.resume.nombre_repas}</div>
            <div class="label">Repas</div>
        </div>
        <div class="resume-item">
            <div class="number">${contenu.resume.nombre_recettes}</div>
            <div class="label">Recettes</div>
        </div>
        <div class="resume-item">
            <div class="number">${contenu.ingredients.length}</div>
            <div class="label">Ingrédients</div>
        </div>
    </div>

    ${Object.entries(contenu.categories).map(([categorie, ingredients]) => {
      const ingredientsList = Array.isArray(ingredients) ? ingredients : [];
      if (ingredientsList.length === 0) return '';
      
      return `
        <div class="category">
            <div class="category-header">
                <h3 class="category-title">${categorieLabels[categorie] || categorie}</h3>
                <p class="category-count">${ingredientsList.length} ingrédient${ingredientsList.length > 1 ? 's' : ''}</p>
            </div>
            <div class="ingredients-list">
                ${ingredientsList.map((ingredient: any) => `
                    <div class="ingredient">
                        <div class="ingredient-info">
                            <div class="ingredient-name">${ingredient.nom}</div>
                            ${ingredient.recettes_utilisees && ingredient.recettes_utilisees.length > 0 ? `
                                <div class="ingredient-recipes">Utilisé dans : ${ingredient.recettes_utilisees.join(', ')}</div>
                            ` : ''}
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div class="ingredient-quantity">${ingredient.quantite_totale} ${ingredient.unite}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
      `;
    }).join('')}

    <div class="footer">
        <p>Liste générée le ${new Date().toLocaleDateString('fr-FR')} par TidiMondo</p>
    </div>
</body>
</html>
    `;

    // Retourner le HTML (pour l'instant, on peut utiliser window.print() côté client)
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="liste-courses-${sejour.nom.replace(/[^a-zA-Z0-9]/g, '-')}.html"`
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