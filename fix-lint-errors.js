#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration des corrections
const corrections = {
  // Correction des apostrophes non échappées
  apostrophes: [
    { from: /([^&])'([^s])/g, to: "$1&apos;$2" },
    { from: /^'([^s])/gm, to: "&apos;$1" },
    { from: /([^&])'$/gm, to: "$1&apos;" },
    // Correction des guillemets non échappés
    { from: /([^&])"([^>])/g, to: "$1&quot;$2" },
    { from: /^"([^>])/gm, to: "&quot;$1" },
    { from: /([^&])"$/gm, to: "$1&quot;" }
  ],
  
  // Suppression des imports non utilisés courants
  unusedImports: [
    { from: /import.*'TrendingUp'.*from 'lucide-react'/g, to: '' },
    { from: /import.*'Eye'.*from 'lucide-react'/g, to: '' },
    { from: /import.*'Trash2'.*from 'lucide-react'/g, to: '' },
    { from: /import.*'Home'.*from 'lucide-react'/g, to: '' },
    { from: /import.*'Lock'.*from 'lucide-react'/g, to: '' },
    { from: /import.*'useCallback'.*from 'react'/g, to: '' },
    { from: /import.*'Link'.*from 'next\/link'/g, to: '' }
  ],
  
  // Correction des types any vers des types plus spécifiques
  anyTypes: [
    { from: /\(\s*err:\s*any\s*\)/g, to: "(err: Error)" },
    { from: /\(\s*e:\s*any\s*\)/g, to: "(e: Error)" },
    { from: /\(\s*error:\s*any\s*\)/g, to: "(error: Error)" },
    { from: /map\(\(err:\s*any\)\s*=>/g, to: "map((err: { message: string }) =>" },
    { from: /:\s*any\[\]/g, to: ": unknown[]" },
    { from: /:\s*any\s*=/g, to: ": unknown =" }
  ],
  
  // Suppression des variables non utilisées
  unusedVars: [
    { from: /^\s*const\s+\w+\s*=.*\/\/.*unused.*$/gm, to: '' },
    { from: /^\s*let\s+\w+\s*=.*\/\/.*unused.*$/gm, to: '' }
  ]
};

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections d'apostrophes
    corrections.apostrophes.forEach(correction => {
      const newContent = content.replace(correction.from, correction.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Appliquer les corrections d'imports
    corrections.unusedImports.forEach(correction => {
      const newContent = content.replace(correction.from, correction.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Appliquer les corrections de types any
    corrections.anyTypes.forEach(correction => {
      const newContent = content.replace(correction.from, correction.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrections appliquées à: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
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
      if (processFile(fullPath)) {
        totalFiles++;
      }
    }
  }
  
  return totalFiles;
}

// Script principal
console.log('🔧 Démarrage de la correction automatique des erreurs de lint...\n');

const srcPath = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ Dossier src/ non trouvé');
  process.exit(1);
}

const processedFiles = processDirectory(srcPath);

console.log(`\n✨ Correction terminée ! ${processedFiles} fichiers modifiés.`);
console.log('🚀 Vous pouvez maintenant exécuter npm run build pour vérifier les résultats.');