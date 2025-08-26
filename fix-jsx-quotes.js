#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixJSXQuotes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 1. Corriger les apostrophes UNIQUEMENT dans les chaînes de caractères JSX
    // Pattern pour les chaînes dans les attributs JSX (entre guillemets doubles)
    content = content.replace(/"([^"]*)'([^"]*)"/g, (match, before, after) => {
      // Ne pas modifier si c'est dans un import, export, etc.
      const lineStart = content.lastIndexOf('\n', content.indexOf(match)) + 1;
      const line = content.substring(lineStart, content.indexOf('\n', content.indexOf(match)));
      
      if (line.trim().startsWith('import ') || 
          line.trim().startsWith('export ') || 
          line.trim().startsWith('from ') ||
          line.includes('require(')) {
        return match; // Ne pas modifier les imports
      }
      
      hasChanges = true;
      return `"${before}&apos;${after}"`;
    });
    
    // 2. Corriger les apostrophes dans le contenu JSX (entre balises >text<)
    content = content.replace(/>([^<]*)'([^<]*)</g, (match, before, after) => {
      hasChanges = true;
      return `>${before}&apos;${after}<`;
    });
    
    // 3. Corriger les guillemets doubles dans le contenu JSX (entre balises >text<)
    content = content.replace(/>([^<]*)"([^<]*)</g, (match, before, after) => {
      hasChanges = true;
      return `>${before}&quot;${after}<`;
    });
    
    // 4. Supprimer les imports non utilisés (plus conservateur)
    const unusedImportPatterns = [
      // Seulement les imports évidents qui ne sont jamais utilisés
      { from: /import.*\bTrendingUp\b.*from 'lucide-react'[;\n]/g, to: '' },
      { from: /import.*\bEye\b.*from 'lucide-react'[;\n]/g, to: '' },
      { from: /import.*\bTrash2\b.*from 'lucide-react'[;\n]/g, to: '' },
      { from: /,\s*TrendingUp\s*(?=\})/g, to: '' },
      { from: /,\s*Eye\s*(?=\})/g, to: '' },
      { from: /,\s*Trash2\s*(?=\})/g, to: '' },
      { from: /\{\s*TrendingUp\s*,/g, to: '{' },
      { from: /\{\s*Eye\s*,/g, to: '{' },
      { from: /\{\s*Trash2\s*,/g, to: '{' },
    ];
    
    unusedImportPatterns.forEach(pattern => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // 5. Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrections JSX appliquées à: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);
  let totalFiles = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      totalFiles += processDirectory(fullPath);
    } else if (stat.isFile() && (entry.endsWith('.tsx') || entry.endsWith('.ts'))) {
      if (fixJSXQuotes(fullPath)) {
        totalFiles++;
      }
    }
  }
  
  return totalFiles;
}

console.log('🔧 Correction ciblée des apostrophes JSX...\n');

const srcPath = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ Dossier src/ non trouvé');
  process.exit(1);
}

const processedFiles = processDirectory(srcPath);

console.log(`\n✨ Correction JSX terminée ! ${processedFiles} fichiers modifiés.`);