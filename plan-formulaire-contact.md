# Plan d'implémentation - Formulaire de Contact

## Architecture choisie

- **Service d'email** : Resend
- **Destination** : neovalerian42@gmail.com
- **Type** : Formulaire public sans stockage en base
- **Sécurité** : Rate limiting basique

## Structure d'implémentation

### 1. Configuration Resend
```bash
npm install resend
```

Variables d'environnement à ajouter :
```env
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL_TO=neovalerian42@gmail.com
CONTACT_EMAIL_FROM=noreply@tidimondo.com
```

### 2. Types TypeScript
```typescript
// src/types/contact.ts
export interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}
```

### 3. API Route
```
src/app/api/contact/route.ts
- Validation des données
- Rate limiting simple
- Envoi via Resend
- Retour de confirmation
```

### 4. Page Contact
```
src/app/contact/page.tsx
- Page publique accessible à tous
- Utilise le composant ContactForm
- Design cohérent avec l'app
```

### 5. Composant Formulaire
```
src/components/contact/ContactForm.tsx
- Formulaire avec validation
- États de chargement
- Messages de succès/erreur
- Design responsive
```

### 6. Navigation
- Ajouter lien "Contact" dans le header ou footer

## Workflow utilisateur

1. Utilisateur accède à `/contact`
2. Remplit le formulaire (nom, email, sujet, message)
3. Validation côté client
4. Soumission vers `/api/contact`
5. Validation côté serveur
6. Envoi email via Resend vers neovalerian42@gmail.com
7. Confirmation à l'utilisateur

## Prochaines étapes

1. Installation de Resend
2. Configuration des variables d'environnement
3. Implémentation des composants et routes
4. Tests de fonctionnement

Prêt à passer en mode Code pour l'implémentation ?