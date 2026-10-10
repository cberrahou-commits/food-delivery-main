/**
 * Utilitaires de formatage pour les numéros algériens et internationaux
 */

/**
 * Nettoie et formate un numéro de téléphone algérien ou international.
 * @param {string} rawPhone - Numéro brut (ex: "0555123456", "+213 661 23 45 67")
 * @param {boolean} withPlus - Si true, préfixe avec '+', sinon uniquement chiffres
 * @returns {string|null} - Numéro formaté (ex: "213555123456" ou "+213555123456")
 */
function formatPhoneNumber(rawPhone, withPlus = false) {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  // Supprimer espaces, tirets, parenthèses et points
  let clean = rawPhone.replace(/[\s\-\(\)\.]/g, "").trim();

  // Si commence par '+'
  if (clean.startsWith("+")) {
    clean = clean.substring(1);
  }

  // Format algérien local commençant par 0 (05, 06, 07, 02...)
  if (clean.startsWith("0") && clean.length === 10) {
    clean = "213" + clean.substring(1);
  }

  // Si le numéro commence déjà par 213 mais a un 0 en trop (ex: 2130555...)
  if (clean.startsWith("2130")) {
    clean = "213" + clean.substring(4);
  }

  // Vérifier qu'il s'agit d'un numéro valide (au moins 9 chiffres)
  if (!/^\d{8,15}$/.test(clean)) {
    return null;
  }

  return withPlus ? `+${clean}` : clean;
}

module.exports = {
  formatPhoneNumber,
};

