// Script pour tester un token Clerk réel
// Usage: node test-clerk-token.js "VOTRE_TOKEN_CLERK"

const https = require('https');

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT invalide');
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return { header, payload, signature: parts[2] };
  } catch (error) {
    console.error('❌ Erreur décodage JWT:', error.message);
    return null;
  }
}

function testSupabaseAPI(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lytrlaotgttqxlrskbiz.supabase.co',
      port: 443,
      path: '/rest/v1/users?select=id&limit=1',
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHJsYW90Z3R0cXhscnNrYml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDc1ODAsImV4cCI6MjA2ODQ4MzU4MH0.Rh_sEF38LuTQ55Zs_L-3mKE_N-8bKqWuH5X5jnEZoRA',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('🔍 Test d\'authentification Clerk-Supabase');
    console.log('=====================================\n');
    console.log('📋 Instructions:');
    console.log('1. Ouvrez votre navigateur sur http://localhost:3000/dashboard');
    console.log('2. Ouvrez la console développeur (F12)');
    console.log('3. Exécutez cette commande pour récupérer le token:');
    console.log('   await window.Clerk.session.getToken({template: "supabase"})');
    console.log('4. Copiez le token et relancez:');
    console.log('   node test-clerk-token.js "VOTRE_TOKEN_ICI"');
    console.log('');
    console.log('⚠️ Si la commande échoue, essayez:');
    console.log('   await window.Clerk.session.getToken()');
    return;
  }

  console.log('🔍 Test d\'authentification Clerk-Supabase');
  console.log('=====================================\n');

  // Décoder le token
  console.log('📋 1. Analyse du token JWT...');
  const decoded = decodeJWT(token);
  
  if (!decoded) {
    console.log('❌ Impossible de décoder le token');
    return;
  }

  console.log('✅ Token décodé avec succès');
  console.log('📋 Header:', JSON.stringify(decoded.header, null, 2));
  console.log('📋 Payload:', JSON.stringify(decoded.payload, null, 2));

  // Vérifier la compatibilité Supabase
  console.log('\n🔍 2. Vérification compatibilité Supabase...');
  const payload = decoded.payload;
  
  const checks = [
    { name: 'Issuer (iss)', value: payload.iss, expected: 'https://wealthy-clam-25.clerk.accounts.dev' },
    { name: 'Audience (aud)', value: payload.aud, expected: 'authenticated' },
    { name: 'Role', value: payload.role, expected: 'authenticated' },
    { name: 'Subject (sub)', value: payload.sub, expected: 'user ID présent' }
  ];

  let compatible = true;
  checks.forEach(check => {
    const isValid = check.name === 'Subject (sub)' ? !!check.value : check.value === check.expected;
    console.log(`${isValid ? '✅' : '❌'} ${check.name}: ${check.value || 'manquant'}`);
    if (!isValid) compatible = false;
  });

  console.log(`\n📊 Compatibilité Supabase: ${compatible ? '✅ OUI' : '❌ NON'}`);

  // Test API Supabase
  console.log('\n🌐 3. Test API Supabase...');
  try {
    const response = await testSupabaseAPI(token);
    console.log(`📡 Status: ${response.status}`);
    console.log(`📋 Body: ${response.body}`);
    
    if (response.status === 200) {
      console.log('✅ Authentification Supabase réussie !');
    } else {
      console.log('❌ Authentification Supabase échouée');
      console.log('🔍 Headers de réponse:', JSON.stringify(response.headers, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message);
  }
}

main().catch(console.error);