#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, 'src/app/layout.tsx');
const layoutTempPath = path.join(__dirname, 'src/app/layout-temp.tsx');
const pagePath = path.join(__dirname, 'src/app/page.tsx');
const pageTempPath = path.join(__dirname, 'src/app/page-temp.tsx');

function enableTestMode() {
  console.log('🔄 Activation du mode test (sans Clerk)...');
  
  // Sauvegarder les fichiers originaux
  if (fs.existsSync(layoutPath)) {
    fs.copyFileSync(layoutPath, layoutPath + '.backup');
  }
  if (fs.existsSync(pagePath)) {
    fs.copyFileSync(pagePath, pagePath + '.backup');
  }
  
  // Remplacer par les versions temporaires
  fs.copyFileSync(layoutTempPath, layoutPath);
  fs.copyFileSync(pageTempPath, pagePath);
  
  console.log('✅ Mode test activé !');
  console.log('🚀 Vous pouvez maintenant lancer: npm run dev');
  console.log('📱 L\'interface sera visible sur: http://localhost:3000');
}

function disableTestMode() {
  console.log('🔄 Désactivation du mode test...');
  
  // Restaurer les fichiers originaux
  if (fs.existsSync(layoutPath + '.backup')) {
    fs.copyFileSync(layoutPath + '.backup', layoutPath);
    fs.unlinkSync(layoutPath + '.backup');
  }
  if (fs.existsSync(pagePath + '.backup')) {
    fs.copyFileSync(pagePath + '.backup', pagePath);
    fs.unlinkSync(pagePath + '.backup');
  }
  
  console.log('✅ Mode normal restauré !');
  console.log('⚠️  N\'oubliez pas de configurer vos clés API Clerk');
}

const command = process.argv[2];

switch (command) {
  case 'enable':
    enableTestMode();
    break;
  case 'disable':
    disableTestMode();
    break;
  default:
    console.log('Usage:');
    console.log('  node test-interface.js enable   # Activer le mode test');
    console.log('  node test-interface.js disable  # Désactiver le mode test');
    break;
}