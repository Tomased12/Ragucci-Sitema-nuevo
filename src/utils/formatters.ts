export const formatMoney = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : parseMoney(val);
  return (Math.round(num * 100) / 100).toLocaleString('es-AR');
};

export const parseMoney = (str: number | string | undefined | null): number => {
  if (str === undefined || str === null || str === '') return 0;
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  // Remove thousand dots and replace decimal comma with dot
  const clean = str.toString().replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateStr;
};

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const checkBirthdayToday = (bdayStr?: string): boolean => {
  if (!bdayStr || bdayStr.toLowerCase() === 'no' || !bdayStr.includes('/')) return false;
  const now = new Date();
  const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  return bdayStr.trim() === todayFormatted;
};
