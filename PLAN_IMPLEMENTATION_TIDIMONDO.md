# Plan d'implémentation TidiMondo - Outil d'organisation de séjours

## Vue d'ensemble

Ce document détaille le plan complet pour transformer votre application TidiMondo en un outil d'organisation de séjours complet, en partant de votre base existante (authentification Clerk, base de données Supabase, paiement Stripe).

## Analyse de l'existant

Votre application dispose déjà de :
- ✅ Authentification avec Clerk
- ✅ Base de données Supabase avec gestion des utilisateurs
- ✅ Système de paiement Stripe avec abonnement Pro (9,99€/mois)
- ✅ Gestion des permissions (gratuit vs Pro)
- ✅ Interface dashboard de base

## Plan de développement détaillé

### **Phase 1 : Fondations de données (3-5 jours)**

#### Phase 1.1 - Conception du schéma de base de données
- **Objectif** : Définir la structure complète des données
- **Livrables** :
  - Tables : `sejours`, `recettes`, `ingredients`, `ustensiles`, `recette_ingredients`, `sejour_repas`
  - Relations et contraintes
  - Politique RLS adaptée
- **Testable** : Validation du schéma avec des données de test
- **Critères d'acceptation** :
  - Toutes les tables créées sans erreur
  - Relations fonctionnelles
  - RLS configuré correctement

#### Phase 1.2 - Création des migrations Supabase
- **Objectif** : Implémenter le schéma en base
- **Livrables** : Fichiers de migration SQL fonctionnels
- **Testable** : Exécution des migrations sans erreur
- **Critères d'acceptation** :
  - Migrations s'exécutent sans erreur
  - Données de test insérables
  - Rollback possible

#### Phase 1.3 - Mise à jour des types TypeScript
- **Objectif** : Synchroniser les types avec la nouvelle structure
- **Livrables** : Types complets pour toutes les entités
- **Testable** : Compilation TypeScript sans erreur
- **Critères d'acceptation** :
  - Types cohérents avec le schéma DB
  - Compilation sans erreur
  - IntelliSense fonctionnel

### **Phase 2 : Gestion des recettes (5-7 jours)**

#### Phase 2.1 - Interface de création/édition de recettes
- **Objectif** : Permettre aux utilisateurs de créer leurs recettes
- **Livrables** :
  - Formulaire de création/édition
  - Gestion des ingrédients et quantités
  - Sauvegarde en base de données
- **Testable** : Créer, modifier et supprimer une recette
- **Critères d'acceptation** :
  - Formulaire validé et ergonomique
  - CRUD complet fonctionnel
  - Gestion d'erreurs appropriée

#### Phase 2.2 - Catalogue de recettes
- **Objectif** : Afficher et rechercher les recettes
- **Livrables** :
  - Liste paginée des recettes
  - Recherche par nom
  - Filtres basiques (régime alimentaire)
- **Testable** : Navigation et recherche fonctionnelles
- **Critères d'acceptation** :
  - Pagination performante
  - Recherche en temps réel
  - Filtres fonctionnels

#### Phase 2.3 - Système d'ingrédients et ustensiles
- **Objectif** : Gérer les composants des recettes
- **Livrables** :
  - CRUD ingrédients et ustensiles
  - Association aux recettes
  - Gestion des unités de mesure
- **Testable** : Créer une recette complète avec ingrédients
- **Critères d'acceptation** :
  - Gestion complète des ingrédients
  - Unités de mesure cohérentes
  - Associations fonctionnelles

### **Phase 3 : Gestion des séjours (7-10 jours)**

#### Phase 3.1 - Interface de création de séjours
- **Objectif** : Créer la structure de base d'un séjour
- **Livrables** :
  - Formulaire séjour (nom, dates, lieu)
  - Gestion des participants
  - Sauvegarde et liste des séjours
- **Testable** : Créer et consulter un séjour
- **Critères d'acceptation** :
  - Formulaire complet et validé
  - Gestion des dates cohérente
  - Liste des séjours fonctionnelle

#### Phase 3.2 - Système de planification des repas
- **Objectif** : Associer des recettes aux repas du séjour
- **Livrables** :
  - Calendrier des repas (3/jour + exceptionnels)
  - Sélection de recettes depuis le catalogue
  - Interface de planification intuitive
- **Testable** : Planifier tous les repas d'un séjour
- **Critères d'acceptation** :
  - Calendrier interactif
  - Sélection de recettes fluide
  - Sauvegarde automatique

#### Phase 3.3 - Gestion des participants et régimes
- **Objectif** : Adapter les repas aux contraintes alimentaires
- **Livrables** :
  - Ajout/suppression de participants
  - Gestion des régimes et allergies
  - Validation des recettes selon les contraintes
- **Testable** : Séjour avec participants ayant différents régimes
- **Critères d'acceptation** :
  - Gestion complète des participants
  - Contraintes alimentaires respectées
  - Alertes appropriées

### **Phase 4 : Liste de courses (5-7 jours)**

#### Phase 4.1 - Génération automatique
- **Objectif** : Calculer automatiquement les ingrédients nécessaires
- **Livrables** :
  - Algorithme d'agrégation des ingrédients
  - Gestion des doublons et unités
  - Interface d'affichage de la liste
- **Testable** : Générer une liste cohérente pour un séjour complet
- **Critères d'acceptation** :
  - Calculs corrects
  - Agrégation sans doublons
  - Interface claire

#### Phase 4.2 - Calcul des quantités
- **Objectif** : Adapter les quantités au nombre de participants
- **Livrables** :
  - Système de conversion des portions
  - Gestion des arrondis intelligents
  - Possibilité d'ajustement manuel
- **Testable** : Vérifier les quantités pour différents nombres de participants
- **Critères d'acceptation** :
  - Calculs proportionnels corrects
  - Arrondis logiques
  - Ajustements manuels possibles

#### Phase 4.3 - Export PDF
- **Objectif** : Permettre l'export et le partage
- **Livrables** :
  - Génération PDF formaté
  - Estimation budgétaire basique
  - Fonctionnalité de partage
- **Testable** : Télécharger un PDF lisible et complet
- **Critères d'acceptation** :
  - PDF bien formaté
  - Contenu complet
  - Téléchargement fonctionnel

### **Phase 5 : Restrictions et finalisation (3-5 jours)**

#### Phase 5.1 - Restrictions utilisateurs gratuits
- **Objectif** : Implémenter les limitations du plan gratuit
- **Livrables** :
  - Limitation à 1 séjour pour les utilisateurs gratuits
  - Vérifications côté serveur et client
  - Messages d'upgrade appropriés
- **Testable** : Vérifier les restrictions en tant qu'utilisateur gratuit
- **Critères d'acceptation** :
  - Limitations appliquées correctement
  - Messages clairs
  - Sécurité côté serveur

#### Phase 5.2 - Intégration des limitations Pro
- **Objectif** : Mettre en valeur l'abonnement Pro
- **Livrables** :
  - Interfaces différenciées selon le plan
  - Call-to-action pour l'upgrade
  - Fonctionnalités Pro clairement identifiées
- **Testable** : Parcours complet gratuit vs Pro
- **Critères d'acceptation** :
  - Différenciation claire
  - CTA efficaces
  - Valeur Pro évidente

#### Phase 5.3 - Tests complets et optimisations
- **Objectif** : Finaliser et optimiser l'application
- **Livrables** :
  - Tests end-to-end complets
  - Optimisations de performance
  - Documentation utilisateur
- **Testable** : Parcours utilisateur complet sans bug
- **Critères d'acceptation** :
  - Tous les parcours fonctionnels
  - Performance acceptable
  - Documentation complète

## Architecture technique recommandée

### Structure de base de données

```sql
-- Séjours
CREATE TABLE sejours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  nom TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lieu TEXT,
  nombre_participants INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recettes
CREATE TABLE recettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  nom TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  temps_preparation INTEGER, -- en minutes
  portions INTEGER DEFAULT 4,
  regime_alimentaire TEXT[], -- ['vegetarien', 'vegan', 'sans_gluten']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingrédients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  unite_base TEXT NOT NULL, -- 'g', 'ml', 'piece'
  categorie TEXT -- 'legume', 'viande', 'epice'
);

-- Association recettes-ingrédients
CREATE TABLE recette_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id UUID REFERENCES recettes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantite DECIMAL NOT NULL,
  unite TEXT NOT NULL
);

-- Repas du séjour
CREATE TABLE sejour_repas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  recette_id UUID REFERENCES recettes(id),
  date_repas DATE NOT NULL,
  type_repas TEXT NOT NULL, -- 'petit_dejeuner', 'dejeuner', 'diner', 'collation'
  nombre_portions INTEGER
);
```

### Structure des composants React

```
src/
├── app/
│   ├── (protected)/
│   │   ├── sejours/
│   │   │   ├── page.tsx              # Liste des séjours
│   │   │   ├── nouveau/page.tsx      # Création séjour
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Détail séjour
│   │   │       ├── planification/    # Planning repas
│   │   │       └── courses/          # Liste courses
│   │   └── recettes/
│   │       ├── page.tsx              # Catalogue recettes
│   │       ├── nouvelle/page.tsx     # Création recette
│   │       └── [id]/page.tsx         # Détail recette
│   └── api/
│       ├── sejours/
│       ├── recettes/
│       └── export/
└── components/
    ├── sejours/
    │   ├── SejourForm.tsx
    │   ├── PlanificationRepas.tsx
    │   └── ListeCourses.tsx
    └── recettes/
        ├── RecetteForm.tsx
        ├── CatalogueRecettes.tsx
        └── IngredientSelector.tsx
```

## Estimation globale

- **Durée totale** : 6-8 semaines
- **Complexité** : Moyenne à élevée
- **Effort estimé** : 120-160 heures de développement

### Risques identifiés

1. **Complexité du calcul des quantités**
   - Mitigation : Commencer par des calculs simples, itérer
   
2. **Performance avec de nombreuses recettes**
   - Mitigation : Pagination, indexation, cache

3. **UX de la planification des repas**
   - Mitigation : Prototypage rapide, tests utilisateurs

4. **Gestion des unités de mesure**
   - Mitigation : Système d'unités standardisé

## Prochaines étapes

1. **Validation du plan** : Confirmer l'approche et les priorités
2. **Phase 1.1** : Commencer par la conception du schéma de base de données
3. **Setup de l'environnement** : Préparer les outils de développement
4. **Première itération** : Implémenter la Phase 1 complète

## Notes importantes

- Chaque phase doit être **complètement fonctionnelle** avant de passer à la suivante
- Les **tests** sont intégrés à chaque phase, pas reportés à la fin
- L'approche **itérative** permet d'ajuster le plan selon les retours
- La **compatibilité** avec l'existant est prioritaire
- Les **limitations freemium** sont intégrées dès le début, pas ajoutées après

Ce plan respecte votre demande d'un découpage détaillé comme le ferait une Product Owner exceptionnelle, avec des étapes testables et des livrables clairs à chaque phase.