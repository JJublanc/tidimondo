#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour corriger les erreurs de syntaxe introduites par le premier script
function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Restaurer les guillemets dans les directives et imports
    const jsReplacements = [
      { from: /&apos;use client&apos;/g, to: "'use client'" },
      { from: /&apos;use server&apos;/g, to: "'use server'" },
      { from: /from &apos;/g, to: "from '" },
      { from: /&apos;;/g, to: "';" },
      { from: /import &apos;/g, to: "import '" },
      { from: /export &apos;/g, to: "export '" },
      { from: /require\(&apos;/g, to: "require('" },
      { from: /&apos;\)/g, to: "')" }
    ];
    
    jsReplacements.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Restaurer les guillemets doubles dans le code JS
    const doubleQuoteReplacements = [
      { from: /from &quot;/g, to: 'from "' },
      { from: /&quot;;/g, to: '";' },
      { from: /import &quot;/g, to: 'import "' },
      { from: /export &quot;/g, to: 'export "' },
      { from: /require\(&quot;/g, to: 'require("' },
      { from: /&quot;\)/g, to: '")' }
    ];
    
    doubleQuoteReplacements.forEach(replacement => {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Syntaxe corrigée pour: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les fichiers
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);
  let totalFiles = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      totalFiles += processDirectory(fullPath);
    } else if (stat.isFile() && (entry.endsWith('.tsx') || entry.endsWith('.ts'))) {
      if (fixSyntaxErrors(fullPath)) {
        totalFiles++;
      }
    }
  }
  
  return totalFiles;
}

// Script principal
console.log('🔧 Correction des erreurs de syntaxe JavaScript...\n');

const srcPath = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ Dossier src/ non trouvé');
  process.exit(1);
}

const processedFiles = processDirectory(srcPath);

console.log(`\n✨ Correction terminée ! ${processedFiles} fichiers corrigés.`);