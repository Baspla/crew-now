import { NextResponse } from 'next/server';
import { readdir, stat, unlink } from 'fs/promises';
import { join, relative, resolve, normalize } from 'path';
import { db, posts, userReactions, users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic'

async function listFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await listFiles(full));
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  } catch (err) {
    // ignore missing dir
  }
  return results;
}

function dbPathToFs(p?: string) {
  // DB stores paths like `/uploads/reactions/xxx.jpg` — convert to absolute fs path
  if (!p) return '';
  // ignore absolute/external URLs
  const lower = p.trim().toLowerCase();
  if (lower.startsWith('http:') || lower.startsWith('https:') || lower.startsWith('//') || lower.startsWith('data:')) {
    return '';
  }
  // remove leading slash
  let cleaned = p.startsWith('/') ? p.slice(1) : p;
  const parts = cleaned.split('/').filter(Boolean);
  let fullPath: string;
  fullPath = resolve(process.cwd(), ...parts);
  return normalize(fullPath);
}

export async function GET(request: Request) {
  const uploadsDir = join(process.cwd(), 'uploads');

  // AUTH: require internal token via header `x-internal-token` or query `token`
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token');
  const dryRun = url.searchParams.get('dry') === 'true' || url.searchParams.get('dry') === '1';
  const headerToken = request.headers.get('x-internal-token');
  const TOKEN = process.env.BACKEND_TOKEN || '';

  if (!TOKEN) {
    console.warn('BACKEND_TOKEN not set — rejecting external cleanup calls');
  }

  const supplied = headerToken || tokenFromQuery || '';
  if (TOKEN && supplied !== TOKEN) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Gather all files on disk under public/uploads
  const filesOnDisk = (await listFiles(uploadsDir)).map((f) => normalize(resolve(f)));

  // Gather all image URLs referenced in DB
  const referenced: Set<string> = new Set();

  try {
    const postRows = await db.select({ imageUrl: posts.imageUrl, front: posts.frontImageUrl }).from(posts);
    for (const p of postRows) {
      if (p.imageUrl) referenced.add(dbPathToFs(p.imageUrl));
      if (p.front) referenced.add(dbPathToFs(p.front));
    }

    const reactionRows = await db.select({ imageUrl: userReactions.imageUrl }).from(userReactions);
    for (const r of reactionRows) {
      if (r.imageUrl) referenced.add(dbPathToFs(r.imageUrl));
    }

    // include users avatars
    const userRows = await db.select({ image: users.image }).from(users);
    for (const u of userRows) {
      if (u.image) referenced.add(dbPathToFs(u.image));
    }
  } catch (err) {
    console.error('Error querying DB for referenced images', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }

    referenced.delete('');

  const deleted: string[] = [];
  const wouldDelete: string[] = [];
  const errors: string[] = [];

  // Safety: only allow deletions inside the uploadsDir
  const uploadsDirNormalized = normalize(resolve(uploadsDir));

  for (const file of filesOnDisk) {
    const normalized = normalize(resolve(file));
    // ensure the file is under the uploads directory
    if (!normalized.startsWith(uploadsDirNormalized + require('path').sep) && normalized !== uploadsDirNormalized) {
      // skip anything outside uploads folder
      continue;
    }

    if (!referenced.has(normalized)) {
      const rel = relative(process.cwd(), normalized);
      if (dryRun) {
        wouldDelete.push(rel);
      } else {
        try {
          await unlink(normalized);
          // return path relative to project root
          deleted.push(rel);
        } catch (err: any) {
          errors.push(`${normalized}: ${err?.message ?? err}`);
        }
      }
    }
  }

  return NextResponse.json({ success: true, deleted, wouldDelete, errors, referenced: Array.from(referenced), dryRun });
}