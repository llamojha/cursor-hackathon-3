import { Router } from 'express';
import { listPublicProfiles, getPublicProfile } from './profiles.js';
import { validateRoast } from './roast.js';

export const roastRouter = Router();

roastRouter.get('/profiles', (_req, res) => {
  res.json({ profiles: listPublicProfiles() });
});

roastRouter.get('/profiles/:id', (req, res) => {
  const profile = getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });
  res.json({ profile });
});

roastRouter.post('/validate', async (req, res) => {
  const { profileId, roast } = req.body ?? {};
  if (!profileId || typeof roast !== 'string') {
    return res.status(400).json({ ok: false, error: 'Faltan profileId o roast' });
  }

  const result = await validateRoast({ profileId, roast });
  if (!result.ok && result.error) {
    const status = result.error.includes('OPENAI') ? 503 : 400;
    return res.status(status).json(result);
  }
  res.json(result);
});
