#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 1. Restaurer TOUS les imports et directives JavaScript
    const jsRestorePatterns = [
      // Directives
      { from: /&apos;use client&apos;/g, to: "'use client'" },
      { from: /&apos;use server&apos;/g, to: "'use server'" },
      
      // Imports avec guillemets simples
      { from: /from &apos;([^&]+)&apos;/g, to: "from '$1'" },
      { from: /import &apos;([^&]+)&apos;/g, to: "import '$1'" },
      { from: /require\(&apos;([^&]+)&apos;\)/g, to: "require('$1')" },
      
      // Imports avec guillemets doubles  
      { from: /from &quot;([^&]+)&quot;/g, to: 'from "$1"' },
      { from: /import &quot;([^&]+)&quot;/g, to: 'import "$1"' },
      { from: /require\(&quot;([^&]+)&quot;\)/g, to: 'require("$1")' },
      
      // Chaînes de caractères dans le code JS (entre guillemets simples)
      { from: /= &apos;([^&]+)&apos;/g, to: "= '$1'" },
      { from: /: &apos;([^&]+)&apos;/g, to: ": '$1'" },
      { from: /\(&apos;([^&]+)&apos;\)/g, to: "('$1')" },
      { from: /\[&apos;([^&]+)&apos;\]/g, to: "['$1']" },
      { from: /\{&apos;([^&]+)&apos;\}/g, to: "{'$1'}" },
      
      // Chaînes de caractères dans le code JS (entre guillemets doubles)
      { from: /= &quot;([^&]+)&quot;/g, to: '= "$1"' },
      { from: /: &quot;([^&]+)&quot;/g, to: ': "$1"' },
      { from: /\(&quot;([^&]+)&quot;\)/g, to: '("$1")' },
      { from: /\[&quot;([^&]+)&quot;\]/g, to: '["$1"]' },
      { from: /\{&quot;([^&]+)&quot;\}/g, to: '{"$1"}' },
      
      // Types TypeScript
      { from: /: &apos;([^&]+)&apos; \|/g, to: ": '$1' |" },
      { from: /\| &apos;([^&]+)&apos;/g, to: "| '$1'" },
      
      // URLs et chemins
      { from: /url = &apos;([^&]+)&apos;/g, to: "url = '$1'" },
      { from: /url \+= &apos;([^&]+)&apos;/g, to: "url += '$1'" },
    ];
    
    jsRestorePatterns.forEach(pattern => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // 2. Corriger les apostrophes UNIQUEMENT dans le JSX (attributs et contenu)
    // Rechercher les apostrophes dans les attributs JSX className, title, etc.
    const jsxPatterns = [
      // Attributs JSX avec apostrophes
      { from: /className="([^"]*)'([^"]*)"/g, to: 'className="$1&apos;$2"' },
      { from: /title="([^"]*)'([^"]*)"/g, to: 'title="$1&apos;$2"' },
      { from: /placeholder="([^"]*)'([^"]*)"/g, to: 'placeholder="$1&apos;$2"' },
      { from: /alt="([^"]*)'([^"]*)"/g, to: 'alt="$1&apos;$2"' },
      
      // Contenu JSX entre balises avec apostrophes (mais pas dans le code JS)
      { from: />([^<]*)'([^<]*)</g, to: '>$1&apos;$2<' },
    ];
    
    jsxPatterns.forEach(pattern => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrections finales appliquées à: ${filePath}`);
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
      if (fixFile(fullPath)) {
        totalFiles++;
      }
    }
  }
  
  return totalFiles;
}

console.log('🔧 Correction finale des erreurs de syntaxe...\n');

const srcPath = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ Dossier src/ non trouvé');
  process.exit(1);
}

const processedFiles = processDirectory(srcPath);

console.log(`\n✨ Correction finale terminée ! ${processedFiles} fichiers corrigés.`);
console.log('🚀 Test de compilation en cours...');