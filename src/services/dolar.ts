export const fetchDolarBlue = async (): Promise<{ venta: number; error: boolean }> => {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    if (data?.venta && typeof data.venta === 'number') {
      return { venta: data.venta, error: false };
    }
    return { venta: 1500, error: true };
  } catch (e) {
    console.warn("No se pudo obtener la cotización del dólar blue, usando valor por defecto 1500:", e);
    return { venta: 1500, error: true };
  }
};
