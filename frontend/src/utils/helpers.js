export const formatCurrency = (amount) => {
  if (amount == null || isNaN(Number(amount))) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getMonthName = (month) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return months[month - 1] || '';
};

export const getMonthYear = (date) => {
  const d = new Date(date);
  return `${getMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;
};

export const getCategoryLabel = (category) => {
  const labels = {
    gaji_satpam: 'Gaji Satpam',
    listrik_pos: 'Token Listrik Pos',
    perbaikan_jalan: 'Perbaikan Jalan',
    perbaikan_selokan: 'Perbaikan Selokan',
    lainnya: 'Lainnya',
  };
  return labels[category] || category;
};

export const getCategoryBadgeClass = (category) => {
  const classes = {
    gaji_satpam: 'badge-info',
    listrik_pos: 'badge-warning',
    perbaikan_jalan: 'badge-orange',
    perbaikan_selokan: 'badge-purple',
    lainnya: 'badge-gray',
  };
  return classes[category] || 'badge-gray';
};
