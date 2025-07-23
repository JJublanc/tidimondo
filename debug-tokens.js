// Script pour analyser les tokens JWT Clerk
// Usage: node debug-tokens.js

// Fonction pour décoder un JWT sans vérification (natif)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT invalide');
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return {
      header,
      payload,
      signature: parts[2]
    };
  } catch (error) {
    console.error('❌ Erreur décodage JWT:', error.message);
    return null;
  }
}

// Fonction pour analyser la compatibilité Supabase
function analyzeSupabaseCompatibility(payload) {
  if (!payload) return { compatible: false, issues: ['Token invalide'] };
  
  const issues = [];
  const requirements = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: 'user ID',
    iss: 'issuer'
  };
  
  // Vérifier audience
  if (!payload.aud || (Array.isArray(payload.aud) ? !payload.aud.includes('authenticated') : payload.aud !== 'authenticated')) {
    issues.push('❌ Audience "authenticated" manquante');
  } else {
    console.log('✅ Audience correcte:', payload.aud);
  }
  
  // Vérifier role
  if (!payload.role || payload.role !== 'authenticated') {
    issues.push('❌ Role "authenticated" manquant (actuel: ' + payload.role + ')');
  } else {
    console.log('✅ Role correct:', payload.role);
  }
  
  // Vérifier subject
  if (!payload.sub) {
    issues.push('❌ Subject (sub) manquant');
  } else {
    console.log('✅ Subject présent:', payload.sub);
  }
  
  // Vérifier issuer
  if (!payload.iss) {
    issues.push('❌ Issuer (iss) manquant');
  } else {
    console.log('✅ Issuer présent:', payload.iss);
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    score: ((4 - issues.length) / 4) * 100
  };
}

console.log('🔍 Analyseur de Tokens JWT Clerk pour Supabase');
console.log('================================================\n');

// Instructions pour l'utilisateur
console.log('📋 Instructions:');
console.log('1. Ouvrez votre navigateur sur http://localhost:3000/dashboard');
console.log('2. Ouvrez la console développeur (F12)');
console.log('3. Exécutez cette commande pour récupérer le token par défaut:');
console.log('   window.__clerk_session?.getToken().then(token => console.log("DEFAULT_TOKEN:", token))');
console.log('');
console.log('4. Exécutez cette commande pour récupérer le token Supabase (si configuré):');
console.log('   window.__clerk_session?.getToken({template: "supabase"}).then(token => console.log("SUPABASE_TOKEN:", token)).catch(e => console.log("SUPABASE_ERROR:", e))');
console.log('');
console.log('5. Copiez les tokens et relancez ce script avec:');
console.log('   node debug-tokens.js "VOTRE_TOKEN_ICI"');
console.log('');

// Si un token est fourni en argument
if (process.argv[2]) {
  const token = process.argv[2];
  console.log('🎫 Analyse du token fourni...\n');
  
  const decoded = decodeJWT(token);
  
  if (decoded) {
    console.log('📋 Header JWT:');
    console.log(JSON.stringify(decoded.header, null, 2));
    console.log('\n📋 Payload JWT:');
    console.log(JSON.stringify(decoded.payload, null, 2));
    
    console.log('\n🔍 Analyse de compatibilité Supabase:');
    const compatibility = analyzeSupabaseCompatibility(decoded.payload);
    
    console.log(`\n📊 Score de compatibilité: ${compatibility.score}%`);
    
    if (compatibility.compatible) {
      console.log('🎉 ✅ Token compatible avec Supabase RLS !');
    } else {
      console.log('⚠️ ❌ Token NON compatible avec Supabase RLS');
      console.log('\n🔧 Problèmes détectés:');
      compatibility.issues.forEach(issue => console.log('  ' + issue));
      
      console.log('\n💡 Solution recommandée:');
      console.log('1. Créer un JWT Template "supabase" dans Clerk Dashboard');
      console.log('2. Configurer les claims suivants:');
      console.log('   {');
      console.log('     "aud": "authenticated",');
      console.log('     "role": "authenticated",');
      console.log('     "sub": "{{user.id}}"');
      console.log('   }');
    }
  }
} else {
  console.log('⏳ En attente d\'un token à analyser...');
  console.log('💡 Tip: Vous pouvez aussi utiliser jwt.io pour décoder manuellement');
}