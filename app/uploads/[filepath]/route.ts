import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { stat } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { filepath: string[] } }
) {
  try {
    // Konstruiere den Dateipfad aus den URL-Parametern
    const filepath = params.filepath;
    
    if (!filepath || filepath.length === 0) {
      return new NextResponse('File path required', { status: 400 });
    }
    
    // Verhindere Directory Traversal Angriffe
    const safePaths = filepath.map(segment => 
      segment.replace(/[^a-zA-Z0-9._-]/g, '')
    );
    
    // Konstruiere den absoluten Pfad zur Datei
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadsDir, ...safePaths);
    
    // Sicherheitscheck: Stelle sicher, dass die Datei innerhalb des uploads-Ordners liegt
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return new NextResponse('Access denied', { status: 403 });
    }
    
    // Prüfe, ob die Datei existiert
    try {
      const stats = await stat(resolvedPath);
      if (!stats.isFile()) {
        return new NextResponse('Not found', { status: 404 });
      }
    } catch (error) {
      return new NextResponse('Not found', { status: 404 });
    }
    
    // Lese die Datei
    const fileBuffer = await fs.readFile(resolvedPath);
    
    // Bestimme den Content-Type basierend auf der Dateierweiterung
    const ext = path.extname(resolvedPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Setze Cache-Header für bessere Performance
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 Jahr Cache
      'Content-Length': fileBuffer.length.toString(),
    });
    
    return new NextResponse(fileBuffer as unknown as BodyInit, { headers });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}