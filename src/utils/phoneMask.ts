/**
 * Utilitaires pour le formatage avec masque de saisie et validation
 * des numéros de téléphone du Bénin (Plan national à 10 chiffres préfixés 01).
 */

export interface PhoneValidationResult {
  raw: string;
  digits: string;
  formatted: string;
  isValid: boolean;
  isComplete: boolean;
  digitCount: number;
  operator: string | null;
  operatorColor: string | null;
  error: string | null;
  slots: Array<{ text: string; isFilled: boolean }>;
}

const MTN_PREFIXES = ['97', '96', '61', '62', '66', '67', '51', '52', '53', '54', '42', '46', '50'];
const MOOV_PREFIXES = ['95', '94', '64', '65', '60', '63', '68', '69', '55', '56'];
const CELTIIS_PREFIXES = ['40', '41', '43', '44', '45', '98', '99'];

export function detectOperator(digits: string): { name: string; color: string } | null {
  let core = digits;
  if (core.startsWith('01') && core.length >= 4) {
    core = core.slice(2);
  }
  if (core.length >= 2) {
    const p2 = core.slice(0, 2);
    if (MTN_PREFIXES.includes(p2)) {
      return { name: 'MTN Bénin', color: '#FBBF24' }; // yellow
    }
    if (MOOV_PREFIXES.includes(p2)) {
      return { name: 'Moov Africa', color: '#3B82F6' }; // blue
    }
    if (CELTIIS_PREFIXES.includes(p2)) {
      return { name: 'Celtiis', color: '#10B981' }; // green
    }
  }
  return null;
}

/**
 * Nettoie et formate les chiffres saisis en paires de 2 (masque visuel: 01 XX XX XX XX)
 */
export function formatWithMask(input: string): string {
  let digits = input.replace(/\D/g, '');

  // Strip international +229 if present
  if (digits.startsWith('229') && digits.length > 3) {
    digits = digits.slice(3);
  }

  // Max 10 digits
  digits = digits.slice(0, 10);

  // Group by pairs of 2 digits
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }

  return parts.join(' ');
}

/**
 * Valide en temps réel le numéro de téléphone selon le standard béninois
 */
export function analyzeBeninPhone(input: string): PhoneValidationResult {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('229') && digits.length > 3) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 10);

  const formatted = formatWithMask(digits);
  const digitCount = digits.length;

  // Calcul des 5 blocs de masque pour l'affichage visuel (01 XX XX XX XX)
  const slots: Array<{ text: string; isFilled: boolean }> = [];
  for (let s = 0; s < 5; s++) {
    const start = s * 2;
    const chunk = digits.slice(start, start + 2);
    if (chunk.length === 2) {
      slots.push({ text: chunk, isFilled: true });
    } else if (chunk.length === 1) {
      slots.push({ text: chunk + '·', isFilled: false });
    } else {
      slots.push({ text: s === 0 ? '01' : '··', isFilled: false });
    }
  }

  const op = detectOperator(digits);

  // Validation logic
  let isValid = false;
  let isComplete = false;
  let error: string | null = null;

  if (digitCount === 0) {
    error = null;
  } else if (digitCount === 10) {
    if (digits.startsWith('01')) {
      isValid = true;
      isComplete = true;
    } else {
      error = 'Le numéro à 10 chiffres doit commencer par 01 (ex. : 01 97 00 00 00).';
    }
  } else if (digitCount === 8) {
    // Historic 8-digit format still valid
    isValid = true;
    isComplete = true;
  } else if (digitCount < 8) {
    if (digitCount >= 2 && !digits.startsWith('01') && !MTN_PREFIXES.some(p => digits.startsWith(p)) && !MOOV_PREFIXES.some(p => digits.startsWith(p)) && !CELTIIS_PREFIXES.some(p => digits.startsWith(p))) {
      error = 'Numéro béninois attendu (ex. : 01 97 00 00 00).';
    }
  } else if (digitCount === 9) {
    error = 'Il manque 1 chiffre pour compléter le format 10 chiffres (01 XX XX XX XX).';
  }

  return {
    raw: input,
    digits,
    formatted,
    isValid,
    isComplete,
    digitCount,
    operator: op ? op.name : null,
    operatorColor: op ? op.color : null,
    error,
    slots,
  };
}
