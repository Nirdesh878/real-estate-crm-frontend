import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove import
    content = content.replace(/import Navbar from '..\/components\/Navbar'\n?/g, '');
    
    // Remove the Navbar component usage
    content = content.replace(/<Navbar \/>\n?/g, '');
    content = content.replace(/<Navbar\s*\/>\n?/g, '');
    
    // Check if the file wrapper is just a min-h-screen bg... that we can strip, but for now we just remove Navbar.
    // The previous structure had <div className="min-h-screen bg-slate-50"> which we leave alone or we can strip it to be just fragments or inner main.
    // Let's strip <div className="min-h-screen bg-slate-50"> and <main className="..."> if easy, but it relies on matching perfectly.
    // Safer to just remove Navbar to avoid breaking syntax.
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
