export function formatCNPJ(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function cleanCNPJ(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}

export function validateCNPJ(cnpj) {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  let digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export function validatePassword(password) {
  if (!password || password.length < 8)
    return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(password))
    return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!/[a-z]/.test(password))
    return 'A senha deve conter pelo menos uma letra minúscula';
  if (!/[0-9]/.test(password))
    return 'A senha deve conter pelo menos um número';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password))
    return 'A senha deve conter pelo menos um caractere especial (!@#$...)';
  return null;
}

export function maskEmail(email) {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length <= 2
    ? name[0] + '•'.repeat(Math.max(name.length - 1, 1))
    : name[0] + '•'.repeat(name.length - 2) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-muted' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Média', color: 'bg-yellow-500' };
  return { score, label: 'Forte', color: 'bg-accent' };
}