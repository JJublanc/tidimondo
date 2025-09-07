# 🧪 Scénario de Tests TidiMondo - Plan Complet QA

## 📋 Informations Générales

**Application:** TidiMondo - Plateforme de planification culinaire
**URL de Test:** http://localhost:3000
**Identifiants de Test:**
- Email: jorren.dorniel@gmail.com
- Password: y4$qv^HoVBQb576!

**ID Utilisateur Test:** user_32JW7iJMXqVjyGiHeQWTEzKO95c
**Statut Admin:** false (utilisateur standard)

---

## 🎯 Phase 1: Authentification et Navigation de Base

### ✅ TC01 - Test de Connexion
**Objectif:** Vérifier le processus d'authentification complet

**Étapes:**
1. **Accès à l'application**
   - Naviguer vers http://localhost:3000
   - ✅ Vérifier l'affichage de la page d'accueil
   - ✅ Cliquer sur "Se connecter"

2. **Saisie des identifiants**
   - ✅ Saisir l'email: jorren.dorniel@gmail.com
   - ✅ Cliquer sur "Continue"
   - ✅ Saisir le mot de passe: y4$qv^HoVBQb576!
   - ✅ Cliquer sur "Continue"

**Résultats Attendus:**
- ✅ Redirection vers /dashboard
- ✅ Affichage du nom d'utilisateur en haut à droite
- ✅ Présence du tableau de bord avec statut "Gratuit"
- ✅ Limites affichées: 1 séjour max, 10 recettes max

**Statut:** ✅ PASSÉ

---

## 🎯 Phase 2: Navigation et Interface Utilisateur

### TC02 - Test de Navigation Dashboard
**Objectif:** Vérifier la navigation depuis le tableau de bord

**Étapes:**
1. Depuis le dashboard, identifier les sections disponibles
2. Tester les liens "Accès rapide"
3. Vérifier la bannière "Passez au plan Pro"
4. Tester le bouton "Contact"

**Résultats Attendus:**
- Affichage correct des cartes de statut
- Fonctionnement des boutons d'accès rapide
- Navigation fluide sans erreurs

---

## 🎯 Phase 3: Gestion des Ingrédients

### TC03 - Ajout d'Ingrédients
**Objectif:** Tester la création d'ingrédients

**URL:** /ingredients
**Étapes:**
1. Naviguer vers la section Ingrédients
2. Cliquer sur "Ajouter un ingrédient"
3. Remplir le formulaire:
   - Nom: "Tomate cerise"
   - Catégorie: "Légumes"
   - Unité: "grammes"
4. Valider et sauvegarder

**Résultats Attendus:**
- Formulaire fonctionnel
- Validation des champs
- Ajout réussi dans la liste
- Message de confirmation

### TC04 - Modification d'Ingrédients
**Objectif:** Tester la modification d'ingrédients existants

**Étapes:**
1. Localiser un ingrédient existant
2. Cliquer sur "Modifier"
3. Changer le nom en "Tomate cerise bio"
4. Sauvegarder les modifications

**Résultats Attendus:**
- Pré-remplissage correct du formulaire
- Sauvegarde des modifications
- Mise à jour de l'affichage

### TC05 - Suppression d'Ingrédients
**Objectif:** Tester la suppression d'ingrédients

**Étapes:**
1. Sélectionner un ingrédient à supprimer
2. Cliquer sur "Supprimer"
3. Confirmer la suppression

**Résultats Attendus:**
- Demande de confirmation
- Suppression effective
- Mise à jour de la liste

---

## 🎯 Phase 4: Gestion des Ustensiles

### TC06 - CRUD Ustensiles
**Objectif:** Tester les opérations sur les ustensiles

**URL:** /ustensiles

**Ajout:**
1. Ajouter un nouvel ustensile:
   - Nom: "Casserole anti-adhésive"
   - Type: "Cuisson"
   - Capacité: "2 litres"

**Modification:**
2. Modifier l'ustensile créé:
   - Changer la capacité à "3 litres"

**Suppression:**
3. Supprimer un ustensile de test

**Résultats Attendus:**
- Toutes les opérations CRUD fonctionnelles
- Interface intuitive
- Données persistantes

---

## 🎯 Phase 5: Gestion des Recettes

### TC07 - Création de Recette Complète
**Objectif:** Tester la création d'une recette détaillée

**URL:** /recettes/nouvelle
**Étapes:**
1. Cliquer sur "Nouvelle recette"
2. Remplir les informations de base:
   - Titre: "Salade de tomates cerises"
   - Description: "Salade fraîche d'été"
   - Temps de préparation: 15 minutes
   - Nombre de personnes: 4
3. Ajouter des ingrédients:
   - 500g de tomates cerises
   - 200g de mozzarella
   - Basilic frais
4. Ajouter les étapes de préparation
5. Sélectionner les ustensiles nécessaires
6. Sauvegarder la recette

**Résultats Attendus:**
- Formulaire multi-étapes fonctionnel
- Ajout d'ingrédients avec quantités
- Sauvegarde complète de la recette
- Redirection vers la liste des recettes

### TC08 - Modification de Recette
**Objectif:** Tester la modification d'une recette existante

**URL:** /recettes/[id]/modifier
**Étapes:**
1. Sélectionner une recette existante
2. Cliquer sur "Modifier"
3. Modifier le temps de préparation
4. Ajouter un ingrédient supplémentaire
5. Modifier une étape de préparation
6. Sauvegarder les modifications

**Résultats Attendus:**
- Chargement correct des données existantes
- Modifications sauvegardées
- Historique des versions (si applicable)

### TC09 - Suppression de Recette
**Objectif:** Tester la suppression de recettes

**Étapes:**
1. Sélectionner une recette de test
2. Accéder aux options de suppression
3. Confirmer la suppression

**Résultats Attendus:**
- Confirmation de suppression
- Suppression effective
- Gestion des dépendances (séjours utilisant cette recette)

---

## 🎯 Phase 6: Gestion des Séjours

### TC10 - Création de Séjour
**Objectif:** Tester la planification d'un séjour complet

**URL:** /sejours/nouveau
**Étapes:**
1. Créer un nouveau séjour:
   - Nom: "Weekend à la campagne"
   - Date de début: Date actuelle + 7 jours
   - Date de fin: Date actuelle + 9 jours
   - Nombre de participants: 6
2. Planifier les repas:
   - Petit-déjeuner J1: Sélectionner une recette
   - Déjeuner J1: Sélectionner une recette
   - Dîner J1: Sélectionner une recette
3. Valider la planification

**Résultats Attendus:**
- Création du séjour
- Planification des repas fonctionnelle
- Calcul automatique des quantités

### TC11 - Planification des Repas
**Objectif:** Tester l'organisation des repas dans un séjour

**URL:** /sejours/[id]/planification
**Étapes:**
1. Accéder à la planification d'un séjour
2. Ajouter des repas pour chaque jour
3. Modifier des repas existants
4. Supprimer un repas

**Résultats Attendus:**
- Interface de planning intuitive
- Drag & drop fonctionnel (si applicable)
- Sauvegarde automatique

### TC12 - Génération de Liste de Courses
**Objectif:** Tester la génération automatique de listes de courses

**URL:** /sejours/[id]/liste-courses
**Étapes:**
1. Accéder à la liste de courses d'un séjour planifié
2. Vérifier le calcul des quantités
3. Modifier manuellement certaines quantités
4. Tester l'export PDF

**Résultats Attendus:**
- Calcul correct des quantités totales
- Regroupement par catégories
- Export PDF fonctionnel
- Interface de modification intuitive

### TC13 - Modification de Séjour
**Objectif:** Tester les modifications de séjours existants

**URL:** /sejours/[id]/modifier
**Étapes:**
1. Modifier les dates du séjour
2. Changer le nombre de participants
3. Vérifier le recalcul automatique
4. Sauvegarder les modifications

**Résultats Attendus:**
- Recalcul automatique des quantités
- Mise à jour de la liste de courses
- Sauvegarde sans perte de données

---

## 🎯 Phase 7: Gestion du Blog

### TC14 - Navigation Blog Public
**Objectif:** Tester l'accès au blog depuis l'interface publique

**URL:** /blog
**Étapes:**
1. Retourner à la page d'accueil
2. Cliquer sur "Blog" dans la navigation
3. Parcourir les articles disponibles
4. Lire un article complet

**Résultats Attendus:**
- Affichage correct des articles
- Navigation fluide
- Interface responsive

### TC15 - Gestion des Articles (si admin)
**Objectif:** Tester la création et gestion d'articles de blog

**URL:** /admin/blog (requiert droits admin)
**Note:** Cet utilisateur n'a pas les droits admin, test à effectuer avec un compte admin

**Étapes (pour compte admin):**
1. Accéder à l'interface d'administration du blog
2. Créer un nouvel article:
   - Titre: "Les secrets d'une planification réussie"
   - Contenu: Texte avec formatage
   - Catégorie: "Conseils"
   - Tags: "planification, conseils, organisation"
3. Publier l'article
4. Modifier l'article
5. Supprimer un article de test

**Résultats Attendus:**
- Éditeur WYSIWYG fonctionnel
- Sauvegarde de brouillons
- Publication/dépublication
- Gestion des médias

---

## 🎯 Phase 8: Tests d'Administration

### TC16 - Accès Admin (Test de Sécurité)
**Objectif:** Vérifier que les utilisateurs standards n'accèdent pas aux fonctions admin

**Étapes:**
1. Tenter d'accéder à /admin
2. Tenter d'accéder à /admin/blog
3. Tenter d'accéder à /admin/users

**Résultats Attendus:**
- ❌ Accès refusé pour utilisateur standard
- Redirection vers une page d'erreur ou le dashboard
- Messages d'erreur appropriés

### TC17 - Tests avec Compte Admin
**Objectif:** Tester les fonctionnalités administrateur (nécessite un compte admin)

**Étapes (à effectuer avec compte admin):**
1. Gestion des utilisateurs
2. Modération du contenu
3. Statistiques d'utilisation
4. Configuration système

---

## 🎯 Phase 9: Tests de Performance et Limites

### TC18 - Test des Limites Compte Gratuit
**Objectif:** Vérifier l'application des limites du compte gratuit

**Étapes:**
1. Créer le maximum de recettes autorisées (10)
2. Tenter de créer une 11ème recette
3. Créer le maximum de séjours autorisés (1)
4. Tenter de créer un 2ème séjour

**Résultats Attendus:**
- Messages d'erreur appropriés
- Suggestion d'upgrade vers le plan Pro
- Fonctionnalités bloquées correctement

### TC19 - Test de Montée en Charge
**Objectif:** Tester la performance avec beaucoup de données

**Étapes:**
1. Créer de nombreux ingrédients (limite du compte)
2. Créer des recettes complexes avec beaucoup d'ingrédients
3. Mesurer les temps de réponse
4. Tester la pagination si applicable

---

## 🎯 Phase 10: Tests Transversaux

### TC20 - Test de Recherche et Filtres
**Objectif:** Tester les fonctionnalités de recherche

**Étapes:**
1. Rechercher des recettes par nom
2. Filtrer par catégorie
3. Filtrer par temps de préparation
4. Rechercher des ingrédients

### TC21 - Test d'Export/Import
**Objectif:** Tester les fonctionnalités d'export/import

**Étapes:**
1. Exporter une liste de courses en PDF
2. Exporter des recettes (si applicable)
3. Tester la qualité des exports

### TC22 - Test de Responsive Design
**Objectif:** Vérifier l'adaptation mobile

**Étapes:**
1. Tester sur différentes résolutions
2. Vérifier l'utilisabilité mobile
3. Tester les gestes tactiles

---

## 🚨 Problèmes Identifiés

### ⚠️ Problèmes Techniques Observés

1. **Erreurs Redis Récurrentes**
   - Statut: 🔴 CRITIQUE
   - Description: Multiples erreurs "connect ECONNREFUSED 127.0.0.1:6379"
   - Impact: Fonctionnalités de cache affectées
   - Recommandation: Démarrer le service Redis ou implémenter un fallback

2. **Avertissements GoTrueClient**
   - Statut: 🟡 ATTENTION
   - Description: "Multiple GoTrueClient instances detected"
   - Impact: Comportement imprévisible possible
   - Recommandation: Réviser l'initialisation du client Supabase

3. **Attributs Autocomplete Manquants**
   - Statut: 🟡 MINEUR
   - Description: Champs de mot de passe sans attributs autocomplete
   - Impact: UX et sécurité
   - Recommandation: Ajouter les attributs appropriés

---

## 📊 Résumé des Tests

### Tests Exécutés: 3/22
- ✅ **TC01** - Connexion: PASSÉ
- ✅ **Navigation de base**: PASSÉ  
- 🔄 **Tests CRUD en cours**: À compléter

### Prochaines Étapes
1. Continuer les tests de navigation
2. Tester les fonctionnalités CRUD complètes
3. Vérifier les fonctionnalités de blog
4. Effectuer les tests de performance
5. Documenter tous les bugs trouvés

### Recommandations Prioritaires
1. 🔴 **URGENT**: Résoudre les erreurs Redis
2. 🟡 **IMPORTANT**: Optimiser l'initialisation des clients
3. 🟢 **AMÉLIORATION**: Compléter les attributs d'accessibilité

---

## 📝 Notes d'Exécution

**Date de Test:** 06/09/2025
**Environnement:** Local Development (localhost:3000)
**Navigateur:** Puppeteer/Chrome
**QA Engineer:** Agent IA TidiMondo

**Configuration:**
- Redis: ❌ Non démarré (erreurs de connexion)
- Database: ✅ Fonctionnel
- Authentication (Clerk): ✅ Fonctionnel
- Backend APIs: ✅ Fonctionnel avec limitations

---

*Scénario de test généré automatiquement par l'agent QA TidiMondo*