import { hash as argonHash, verify as argonVerify } from 'argon2';

/**
 * Hache un mot de passe avec l'algorithme argon2id (défaut de `argon2`).
 * Le coût par défaut est adapté à une production typique.
 */
export async function hashPassword(password: string): Promise<string> {
  return argonHash(password);
}

/**
 * Vérifie qu'un mot de passe en clair correspond à son hash argon2id.
 * Retourne `false` si aucun hash n'est enregistré (compte tiers OIDC/LDAP).
 */
export async function verifyPassword(
  password: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) {
    return false;
  }
  return argonVerify(hash, password);
}
