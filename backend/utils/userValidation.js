const isValidEmail = (value) => (
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
);

const isValidPhone = (value) => {
  if (typeof value !== 'string') return false;
  const phone = value.trim();
  const digits = phone.replace(/\D/g, '');
  return /^\+?[\d\s().-]{7,20}$/.test(phone) && digits.length >= 7;
};

module.exports = { isValidEmail, isValidPhone };
