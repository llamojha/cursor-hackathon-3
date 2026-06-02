export interface PublicProfile {
  id: string;
  displayName: string;
  age: number;
  outfitPhotoUrl: string;
  redFlagPhotoUrl: string;
  toxicityScore: number;
  redFlags: string[];
}

export interface RoastValidateResult {
  ok: boolean;
  passed?: boolean;
  phone?: string;
  matchedProfileId?: string;
  matchedName?: string;
  brutalityScore?: number;
  redFlagsHit?: string[];
  requiredBrutality?: number;
  requiredRedFlagHits?: number;
  feedback?: string;
  reason?: string;
  error?: string;
}
