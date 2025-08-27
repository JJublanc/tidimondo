# Guide pour passer Resend en mode Production

## Pourquoi vous êtes en mode "test" ?

Resend limite les comptes gratuits non vérifiés :
- Vous ne pouvez envoyer des emails qu'à votre propre adresse (`johan.jublanc@gmail.com`)
- Le message d'erreur indique : "You can only send testing emails to your own email address"

## Étapes pour passer en mode Production

### 1. Vérifier votre domaine dans Resend

1. **Connectez-vous à votre dashboard Resend**
   - Allez sur [resend.com](https://resend.com)
   - Connectez-vous avec vos identifiants

2. **Ajoutez votre domaine**
   - Cliquez sur "Domains" dans le menu de gauche
   - Cliquez sur "Add Domain"
   - Entrez `tidimondo.com`

3. **Configurez les enregistrements DNS**
   
   Resend va vous donner des enregistrements DNS à ajouter chez votre registraire de domaine :
   
   ```
   Type: TXT
   Name: _resend
   Value: re_verify_xxxxxxxxxxxxxxx
   
   Type: MX
   Name: tidimondo.com
   Value: feedback-smtp.eu-west-1.amazonses.com
   Priority: 10
   ```

4. **Attendez la vérification**
   - Cela peut prendre jusqu'à 48h
   - Vous recevrez un email de confirmation

### 2. Configuration alternative temporaire

En attendant la vérification du domaine, vous pouvez :

#### Option A : Utiliser l'adresse par défaut de Resend
```typescript
// Dans src/app/api/contact/route.ts
from: 'onboarding@resend.dev'
```

#### Option B : Envoyer temporairement vers votre email
```typescript
// Dans src/app/api/contact/route.ts
to: 'johan.jublanc@gmail.com' // Au lieu de neovalerian42@gmail.com
```

### 3. Vérifier l'état de votre compte

1. **Dashboard Resend** → **Domains**
   - Status doit être "Verified" (vert)
   - Pas "Pending" (orange)

2. **Tester avec curl**
   ```bash
   curl -X POST 'https://api.resend.com/emails' \
   -H 'Authorization: Bearer YOUR_API_KEY' \
   -H 'Content-Type: application/json' \
   -d '{
     "from": "contact@tidimondo.com",
     "to": "neovalerian42@gmail.com",
     "subject": "Test",
     "html": "<p>Test de production</p>"
   }'
   ```

### 4. Mise à jour du code après vérification

Quand votre domaine sera vérifié, vous pourrez :

```typescript
// src/app/api/contact/route.ts
const emailResult = await resend.emails.send({
  from: 'contact@tidimondo.com',        // ✅ Votre domaine vérifié
  to: 'neovalerian42@gmail.com',        // ✅ N'importe quelle adresse
  subject: `[TidiMondo Contact] ${validatedData.sujet}`,
  html: emailContent,
  replyTo: validatedData.email
});
```

### 5. Limitations du plan gratuit

**Plan gratuit (3000 emails/mois) :**
- ✅ Domaine personnalisé après vérification
- ✅ Envoi vers n'importe quelle adresse
- ❌ Rate limiting plus strict
- ❌ Support limité

**Plan Pro (à partir de $20/mois) :**
- ✅ 50,000 emails/mois
- ✅ Support prioritaire
- ✅ Analytics avancées
- ✅ Rate limiting plus souple

## Solution temporaire immédiate

En attendant la vérification, modifiez temporairement :

```typescript
// Changez temporairement l'adresse de destination
to: 'johan.jublanc@gmail.com'
```

Cela permettra de tester immédiatement le formulaire en mode production !

## Vérification du statut

Pour vérifier si vous êtes en mode production :
1. Testez l'envoi vers une adresse externe à la vôtre
2. Si ça fonctionne = mode production ✅
3. Si erreur "testing emails" = encore en mode test ❌