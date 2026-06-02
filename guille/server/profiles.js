import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Array<{ id: string, displayName: string, age: number, outfitPhotoUrl: string, redFlagPhotoUrl: string, toxicityScore: number, redFlags: string[], phone: string }> | null} */
let cache = null;

function loadProfiles() {
  if (!cache) {
    const raw = readFileSync(join(__dirname, 'data', 'profiles.json'), 'utf8');
    cache = JSON.parse(raw);
  }
  return cache;
}

/** Vista pública: sin teléfono. */
export function listPublicProfiles() {
  return loadProfiles().map(publicProfile);
}

export function getPublicProfile(id) {
  const profile = loadProfiles().find((p) => p.id === id);
  return profile ? publicProfile(profile) : null;
}

export function getProfileWithPhone(id) {
  return loadProfiles().find((p) => p.id === id) ?? null;
}

function publicProfile(profile) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    age: profile.age,
    outfitPhotoUrl: profile.outfitPhotoUrl,
    redFlagPhotoUrl: profile.redFlagPhotoUrl,
    toxicityScore: profile.toxicityScore,
    redFlags: profile.redFlags,
  };
}
