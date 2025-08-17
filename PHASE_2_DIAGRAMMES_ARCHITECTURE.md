# Phase 2 - Diagrammes d'architecture

## 🏗️ Vue d'ensemble du système

```mermaid
graph TB
    subgraph "Frontend - Pages"
        A[Dashboard] --> B[/recettes]
        B --> C[/recettes/nouvelle]
        B --> D[/recettes/catalogue]
        B --> E[/recettes/[id]]
        E --> F[/recettes/[id]/modifier]
        B --> G[/ingredients]
    end
    
    subgraph "Frontend - Composants"
        H[RecetteForm]
        I[IngredientSelector]
        J[UstensileSelector]
        K[SearchBar]
        L[FilterPanel]
        M[RecetteGrid]
    end
    
    subgraph "API Routes"
        N[/api/recettes]
        O[/api/recettes/[id]]
        P[/api/recettes/search]
        Q[/api/ingredients]
        R[/api/ustensiles]
    end
    
    subgraph "Base de données"
        S[(recettes)]
        T[(recette_ingredients)]
        U[(recette_ustensiles)]
        V[(ingredients)]
        W[(ustensiles)]
    end
    
    C --> H
    H --> I
    H --> J
    D --> K
    D --> L
    D --> M
    
    H --> N
    I --> Q
    J --> R
    K --> P
    M --> O
    
    N --> S
    N --> T
    N --> U
    Q --> V
    R --> W
    P --> S
```

## 🔄 Flux de création de recette

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as RecetteForm
    participant IS as IngredientSelector
    participant US as UstensileSelector
    participant API as /api/recettes
    participant DB as Supabase
    
    U->>F: Démarre création recette
    F->>F: Initialise formulaire multi-étapes
    
    Note over F: Étape 1 - Informations générales
    U->>F: Saisit nom, description, temps
    F->>F: Validation en temps réel
    
    Note over F: Étape 2 - Ingrédients
    F->>IS: Active sélecteur ingrédients
    U->>IS: Recherche et sélectionne ingrédients
    IS->>API: GET /api/ingredients/search
    API->>DB: Requête avec filtres
    DB->>API: Résultats ingrédients
    API->>IS: Liste ingrédients
    IS->>F: Ingrédients sélectionnés
    
    Note over F: Étape 3 - Ustensiles
    F->>US: Active sélecteur ustensiles
    U->>US: Sélectionne ustensiles
    US->>F: Ustensiles sélectionnés
    
    Note over F: Étape 4 - Instructions
    U->>F: Saisit instructions
    F->>F: Validation finale
    
    U->>F: Soumet recette
    F->>API: POST /api/recettes
    API->>DB: Vérifie limitations freemium
    API->>DB: Insert recette + relations
    DB->>API: Confirmation création
    API->>F: Recette créée
    F->>U: Redirection vers détail
```

## 🔍 Flux de recherche et filtrage

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant S as SearchBar
    participant FP as FilterPanel
    participant RG as RecetteGrid
    participant API as /api/recettes/search
    participant DB as Supabase
    
    U->>S: Saisit terme de recherche
    S->>S: Debounce (300ms)
    S->>API: GET /search?query=terme
    
    par Recherche parallèle
        API->>DB: Full-text search sur recettes
    and
        API->>DB: Agrégations pour filtres
    end
    
    DB->>API: Résultats + métadonnées
    API->>S: Réponse avec recettes
    S->>RG: Met à jour liste
    S->>FP: Met à jour compteurs filtres
    
    U->>FP: Applique filtres
    FP->>API: GET /search?query=terme&filters=...
    API->>DB: Requête avec filtres combinés
    DB->>API: Résultats filtrés
    API->>FP: Réponse
    FP->>RG: Met à jour liste
    
    U->>RG: Scroll vers le bas
    RG->>API: GET /search?page=2
    API->>DB: Page suivante
    DB->>API: Résultats page 2
    API->>RG: Append résultats
```

## 🧩 Architecture des composants

```mermaid
graph TB
    subgraph "Pages"
        P1[RecettesPage]
        P2[NouvelleRecettePage]
        P3[CatalogueRecettePage]
        P4[RecetteDetailPage]
    end
    
    subgraph "Composants Formulaires"
        F1[RecetteForm]
        F2[IngredientSelector]
        F3[UstensileSelector]
        F4[RecetteSteps]
    end
    
    subgraph "Composants Affichage"
        D1[RecetteCard]
        D2[RecetteDetail]
        D3[RecetteList]
        D4[RecetteGrid]
    end
    
    subgraph "Composants Recherche"
        S1[SearchBar]
        S2[FilterPanel]
        S3[SortOptions]
    end
    
    subgraph "Composants Partagés"
        SH1[IngredientBadge]
        SH2[DifficultyIndicator]
        SH3[TimeIndicator]
        SH4[SubscriptionGate]
    end
    
    subgraph "Hooks"
        H1[useRecettes]
        H2[useRecetteForm]
        H3[useRecetteSearch]
        H4[useIngredients]
    end
    
    P1 --> D3
    P1 --> S1
    P2 --> F1
    P3 --> D4
    P3 --> S2
    P4 --> D2
    
    F1 --> F2
    F1 --> F3
    F1 --> F4
    
    D3 --> D1
    D4 --> D1
    
    D1 --> SH1
    D1 --> SH2
    D1 --> SH3
    
    F1 --> SH4
    D4 --> SH4
    
    F1 --> H2
    D3 --> H1
    S1 --> H3
    F2 --> H4
```

## 🔒 Gestion des permissions

```mermaid
flowchart TD
    A[Utilisateur accède à une fonctionnalité] --> B{Utilisateur authentifié ?}
    B -->|Non| C[Redirection vers login]
    B -->|Oui| D{Action nécessite Pro ?}
    
    D -->|Non| E[Accès autorisé]
    D -->|Oui| F{Utilisateur a abonnement Pro ?}
    
    F -->|Oui| E
    F -->|Non| G{Limite gratuite atteinte ?}
    
    G -->|Non| H[Accès autorisé avec limitation]
    G -->|Oui| I[Affichage upgrade prompt]
    
    E --> J[Exécution de l'action]
    H --> K[Exécution avec restrictions]
    I --> L[Redirection vers pricing]
    
    subgraph "Limitations gratuites"
        M[Max 5 recettes]
        N[Max 15 ingrédients/recette]
        O[Pas d'export PDF]
        P[Pas de catalogue public]
    end
    
    K --> M
    K --> N
    K --> O
    K --> P
```

## 📊 Flux de données

```mermaid
graph LR
    subgraph "État Local"
        A[Formulaire recette]
        B[Recherche/Filtres]
        C[Cache composants]
    end
    
    subgraph "État Global"
        D[Recettes utilisateur]
        E[Ingrédients favoris]
        F[Préférences UI]
    end
    
    subgraph "Serveur"
        G[API Routes]
        H[Base de données]
        I[Cache Redis]
    end
    
    A <--> G
    B <--> G
    C <--> G
    
    D <--> G
    E <--> G
    F <--> G
    
    G <--> H
    G <--> I
    
    subgraph "Optimisations"
        J[Debounce recherche]
        K[Pagination infinie]
        L[Cache intelligent]
        M[Préchargement]
    end
    
    B --> J
    C --> K
    G --> L
    D --> M
```

## 🚀 Stratégie de performance

```mermaid
graph TB
    subgraph "Frontend"
        A[Lazy Loading]
        B[Code Splitting]
        C[Image Optimization]
        D[Debounce/Throttle]
    end
    
    subgraph "API"
        E[Response Caching]
        F[Query Optimization]
        G[Pagination]
        H[Data Aggregation]
    end
    
    subgraph "Base de données"
        I[Index Optimization]
        J[Query Planning]
        K[Connection Pooling]
        L[Read Replicas]
    end
    
    subgraph "Métriques"
        M[Time to First Byte]
        N[First Contentful Paint]
        O[Largest Contentful Paint]
        P[Cumulative Layout Shift]
    end
    
    A --> M
    B --> N
    C --> O
    D --> P
    
    E --> M
    F --> M
    G --> N
    H --> O
    
    I --> M
    J --> M
    K --> M
    L --> M
```

## 🧪 Stratégie de tests

```mermaid
graph TB
    subgraph "Tests Unitaires"
        A[Composants isolés]
        B[Hooks personnalisés]
        C[Utilitaires]
        D[Validation]
    end
    
    subgraph "Tests d'Intégration"
        E[API Routes]
        F[Flux complets]
        G[Base de données]
        H[Authentification]
    end
    
    subgraph "Tests E2E"
        I[Parcours utilisateur]
        J[Responsive design]
        K[Performance]
        L[Accessibilité]
    end
    
    subgraph "Outils"
        M[Jest + Testing Library]
        N[Playwright]
        O[Lighthouse]
        P[Axe-core]
    end
    
    A --> M
    B --> M
    C --> M
    D --> M
    
    E --> M
    F --> M
    G --> M
    H --> M
    
    I --> N
    J --> N
    K --> O
    L --> P
```

## 📱 Responsive Design

```mermaid
graph TB
    subgraph "Mobile (< 768px)"
        A[Navigation drawer]
        B[Formulaire vertical]
        C[Cartes empilées]
        D[Filtres en modal]
    end
    
    subgraph "Tablet (768px - 1024px)"
        E[Navigation tabs]
        F[Formulaire 2 colonnes]
        G[Grille 2 colonnes]
        H[Filtres sidebar]
    end
    
    subgraph "Desktop (> 1024px)"
        I[Navigation horizontale]
        J[Formulaire 3 colonnes]
        K[Grille 3-4 colonnes]
        L[Filtres panel fixe]
    end
    
    subgraph "Composants Adaptatifs"
        M[RecetteCard responsive]
        N[SearchBar adaptative]
        O[FilterPanel collapsible]
        P[RecetteForm steps]
    end
    
    A --> M
    B --> P
    C --> M
    D --> O
    
    E --> M
    F --> P
    G --> M
    H --> O
    
    I --> M
    J --> P
    K --> M
    L --> O
```

---

Ces diagrammes fournissent une vision claire de l'architecture de la Phase 2, facilitant la compréhension des interactions entre composants et la planification de l'implémentation.