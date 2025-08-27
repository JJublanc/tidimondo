# Débogage du domaine Resend - tidimondo.com

## Problème constaté

- ✅ Domaine `tidimondo.com` affiché comme "Verified" dans le dashboard Resend
- ❌ Erreur lors de l'envoi avec `contact@tidimondo.com` 
- ✅ Fonctionnement avec `onboarding@resend.dev`

## Vérifications à effectuer

### 1. Vérifier les enregistrements DNS actuels

Vérifiez que les enregistrements DNS sont bien en place :

```bash
# Vérifier les enregistrements MX
dig MX tidimondo.com

# Vérifier les enregistrements TXT pour DKIM
dig TXT _domainkey.tidimondo.com

# Vérifier SPF
dig TXT tidimondo.com | grep "v=spf1"
```

### 2. Vérifier dans le dashboard Resend

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Cliquez sur `tidimondo.com`
3. Vérifiez que **tous** les enregistrements sont verts :
   - ✅ Domain verification (TXT)
   - ✅ SPF record (TXT)  
   - ✅ DKIM record (TXT)
   - ✅ MX record (optionnel pour l'envoi)

### 3. Attendre la propagation DNS

Même si le domaine est marqué "Verified", la propagation DNS peut prendre jusqu'à 48h. Testez avec :

```bash
# Depuis différents serveurs DNS
nslookup tidimondo.com 8.8.8.8
nslookup tidimondo.com 1.1.1.1
```

### 4. Tester l'envoi avec curl

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_RESEND_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "contact@tidimondo.com",
    "to": "neovalerian42@gmail.com",
    "subject": "Test domaine",
    "html": "<p>Test du domaine personnalisé</p>"
  }'
```

### 5. Vérifications supplémentaires

#### A. Sous-domaine vs domaine racine
Resend peut avoir des restrictions selon la configuration :
- Essayez `noreply@tidimondo.com`
- Essayez `contact@mail.tidimondo.com` (sous-domaine)

#### B. Région du domaine
Vérifiez que votre domaine est dans la bonne région Resend (EU-West-1 dans votre cas).

#### C. Limitations du plan gratuit
Le plan gratuit peut avoir des restrictions :
- Seules certaines adresses expéditrices sont autorisées
- Vérifiez les limites dans Settings > Billing

## Solutions possibles

### Solution 1 : Re-vérifier le domaine
1. Dans le dashboard Resend, supprimez le domaine
2. Ajoutez-le à nouveau  
3. Reconfigurez tous les enregistrements DNS
4. Attendez la vérification

### Solution 2 : Utiliser un sous-domaine
```
mail.tidimondo.com
```
Plus facile à configurer et souvent plus fiable.

### Solution 3 : Configuration mixte temporaire
Gardez `onboarding@resend.dev` pour le moment et configurez une variable d'environnement :

```env
# .env.local
RESEND_FROM_EMAIL=onboarding@resend.dev
# RESEND_FROM_EMAIL=contact@tidimondo.com  # Quand le domaine fonctionnera
```

### Solution 4 : Contacter le support Resend
Si tout semble correct, contactez le support Resend avec :
- Votre domaine : `tidimondo.com`
- Les enregistrements DNS configurés
- L'erreur exacte reçue

## Test rapide

Pour tester si votre domaine fonctionne vraiment, modifiez temporairement le code :

```typescript
// Test avec votre domaine
from: 'contact@tidimondo.com'

// Si erreur, revenir à :
from: 'onboarding@resend.dev'
```

## Erreurs courantes

1. **Propagation DNS incomplète** → Attendre 24-48h
2. **Enregistrements DNS incorrects** → Revérifier la configuration
3. **Cache DNS local** → Vider le cache ou tester depuis un autre réseau
4. **Restrictions du plan gratuit** → Vérifier les limites Resend
5. **Région incorrecte** → Vérifier que le domaine est dans la bonne région

La solution `onboarding@resend.dev` fonctionne parfaitement pour le moment. Vous pouvez continuer à l'utiliser en attendant de résoudre le problème du domaine personnalisé.