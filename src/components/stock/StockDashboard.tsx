import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockItem } from '../../types';
import { formatMoney, getTodayString } from '../../utils/formatters';
import { 
  Package, 
  PlusCircle, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Tag, 
  Minus, 
  Plus, 
  FileSpreadsheet,
  Filter,
  RefreshCw
} from 'lucide-react';

const CATEGORIES: StockItem['category'][] = [
  'Sacos RTW',
  'Ambos RTW',
  'Camisas',
  'Corbatas & Pañuelos',
  'Accesorios',
  'Otros'
];

export const StockDashboard: React.FC = () => {
  const { stockItems, config, saveStockItemData, removeStockItemData } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modal State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const handleMigrateFromConfig = async () => {
    const rtwMap = config.rtwPrecios || {};
    const rtwKeys = Object.keys(rtwMap);

    if (rtwKeys.length === 0) {
      alert("No hay productos RTW guardados en la configuración de Ajustes.");
      return;
    }

    if (!confirm(`¿Deseas importar los ${rtwKeys.length} productos RTW desde Ajustes al inventario de Stock?`)) {
      return;
    }

    let countMigrated = 0;

    for (const key of rtwKeys) {
      const itemName = key;
      const price = rtwMap[key] || 0;

      // Check if already exists in stock
      const exists = stockItems.some(i => i.name.toLowerCase().trim() === itemName.toLowerCase().trim());
      if (exists) continue;

      let cat: StockItem['category'] = 'Otros';
      const nameUpper = itemName.toUpperCase();
      if (nameUpper.includes('SACO')) cat = 'Sacos RTW';
      else if (nameUpper.includes('AMBO')) cat = 'Ambos RTW';
      else if (nameUpper.includes('CAMISA')) cat = 'Camisas';
      else if (nameUpper.includes('CORBATA') || nameUpper.includes('MOÑO') || nameUpper.includes('PAÑUELO')) cat = 'Corbatas & Pañuelos';
      else if (nameUpper.includes('PANTALÓN') || nameUpper.includes('ZAPATO') || nameUpper.includes('SWEATER') || nameUpper.includes('CAMPERA') || nameUpper.includes('SOBRETODO')) cat = 'Accesorios';

      const newItem: StockItem = {
        id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
        code: `RTW-${Math.floor(1000 + Math.random() * 9000)}`,
        name: itemName,
        category: cat,
        size: '50',
        color: 'Estándar',
        quantity: 1,
        minStockWarning: 1,
        costPrice: Math.round(price * 0.5),
        retailPrice: price,
        supplier: 'Sastrería Ragucci RTW',
        lastUpdated: getTodayString()
      };

      try {
        await saveStockItemData(newItem);
        countMigrated++;
      } catch (err) {
        console.error("Error migrando item:", itemName, err);
      }
    }

    alert(`✅ ${countMigrated} productos RTW importados con éxito a la pestaña de Stock! Ahora puedes editar los talles, colores y cantidades de cada uno.`);
  };

  // Form Fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<StockItem['category']>('Sacos RTW');
  const [size, setSize] = useState<string>('50');
  const [color, setColor] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [minStockWarning, setMinStockWarning] = useState<string>('2');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [retailPrice, setRetailPrice] = useState<string>('0');
  const [supplier, setSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleOpenNewModal = () => {
    setEditingItem(null);
    setCode(`RTW-${Date.now().toString().slice(-4)}`);
    setName('');
    setCategory('Sacos RTW');
    setSize('50');
    setColor('');
    setQuantity('1');
    setMinStockWarning('2');
    setCostPrice('0');
    setRetailPrice('0');
    setSupplier('');
    setNotes('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItem(item);
    setCode(item.code || '');
    setName(item.name || '');
    setCategory(item.category || 'Sacos RTW');
    setSize(item.size || '');
    setColor(item.color || '');
    setQuantity(item.quantity.toString());
    setMinStockWarning(item.minStockWarning.toString());
    setCostPrice(item.costPrice.toString());
    setRetailPrice(item.retailPrice.toString());
    setSupplier(item.supplier || '');
    setNotes(item.notes || '');
    setShowFormModal(true);
  };

  const handleSaveStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert("Por favor completa el código y nombre del producto.");
      return;
    }

    const parsedQty = parseInt(quantity) || 0;
    const parsedMin = parseInt(minStockWarning) || 1;
    const parsedCost = parseFloat(costPrice) || 0;
    const parsedRetail = parseFloat(retailPrice) || 0;

    const newItem: StockItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      firestoreId: editingItem?.firestoreId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      size: size.trim(),
      color: color.trim(),
      quantity: parsedQty,
      minStockWarning: parsedMin,
      costPrice: parsedCost,
      retailPrice: parsedRetail,
      supplier: supplier.trim(),
      notes: notes.trim(),
      lastUpdated: getTodayString()
    };

    try {
      await saveStockItemData(newItem, newItem.firestoreId);
      setShowFormModal(false);
    } catch (err) {
      alert("Error al guardar el producto en el inventario.");
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
    if (!item.firestoreId) return;
    if (confirm(`¿Deseas eliminar "${item.name}" (Código: ${item.code}) del inventario?`)) {
      try {
        await removeStockItemData(item.firestoreId);
      } catch (err) {
        alert("Error al eliminar el producto.");
      }
    }
  };

  // Quick adjust quantity (+1 or -1)
  const handleQuickAdjustQty = async (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    const updated = { ...item, quantity: newQty, lastUpdated: getTodayString() };
    try {
      await saveStockItemData(updated, item.firestoreId);
    } catch (err) {
      alert("Error al actualizar stock.");
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return stockItems.filter((i) => {
      if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
      if (onlyLowStock && i.quantity > i.minStockWarning) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = i.code?.toLowerCase().includes(term);
        const matchesName = i.name?.toLowerCase().includes(term);
        const matchesSize = i.size?.toLowerCase().includes(term);
        const matchesColor = i.color?.toLowerCase().includes(term);
        const matchesSupplier = i.supplier?.toLowerCase().includes(term);
        return matchesCode || matchesName || matchesSize || matchesColor || matchesSupplier;
      }
      return true;
    });
  }, [stockItems, selectedCategory, onlyLowStock, searchTerm]);

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    stockItems.forEach((i) => {
      totalUnits += i.quantity;
      totalCostValuation += i.quantity * (i.costPrice || 0);
      totalRetailValuation += i.quantity * (i.retailPrice || 0);
      if (i.quantity <= i.minStockWarning) lowStockCount++;
    });

    return {
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      lowStockCount,
      totalItemsCount: stockItems.length
    };
  }, [stockItems]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border border-ragucci-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold uppercase text-ragucci-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-ragucci-gold" />
            <span>Control de Stock & Inventario (Productos Terminados / RTW)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Gestión de unidades disponibles en boutique de sacos RTW, camisas, corbatas, pañuelos y accesorios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMigrateFromConfig}
            className="bg-ragucci-primary-light hover:bg-ragucci-primary text-ragucci-gold font-extrabold px-3.5 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border border-ragucci-gold/30"
            title="Importar la lista de productos RTW que tienes guardada en la pestaña de Ajustes"
          >
            <RefreshCw className="w-4 h-4 text-ragucci-gold" />
            <span>⚡ Migrar Productos RTW desde Ajustes</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="bg-ragucci-gold hover:bg-ragucci-gold-light text-ragucci-primary font-extrabold px-4 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>➕ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-ragucci-primary mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Prendas / Unidades Totales</span>
            <Package className="w-4 h-4 text-ragucci-gold" />
          </div>
          <strong className="text-xl font-extrabold text-ragucci-primary block font-sans">
            {metrics.totalUnits} unidades
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">{metrics.totalItemsCount} productos registrados</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-amber-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valorización a Costo</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <strong className="text-xl font-extrabold text-amber-700 block font-sans">
            ${formatMoney(Math.round(metrics.totalCostValuation))}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Capital invertido en stock</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-emerald-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Potencial de Venta Público</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <strong className="text-xl font-extrabold text-emerald-600 block font-sans">
            ${formatMoney(Math.round(metrics.totalRetailValuation))}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Facturación potencial de boutique</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-red-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Stock Bajo / Reposición</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <strong className="text-xl font-extrabold text-red-600 block font-sans">
            {metrics.lowStockCount} ítems
          </strong>
          <span className="text-[10px] text-red-500 font-medium block mt-0.5">Mínimo alcanzado o sin stock</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, prenda, talle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:border-ragucci-gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded text-xs font-bold bg-gray-50 text-ragucci-primary focus:outline-none focus:border-ragucci-gold cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-amber-50 px-3 py-2 border border-amber-200 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="accent-ragucci-gold"
            />
            <span>⚠️ Solo Stock Bajo</span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md border border-ragucci-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ragucci-primary text-ragucci-gold uppercase tracking-wider text-[11px] font-extrabold border-b border-ragucci-gold">
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Producto / Nombre</th>
                <th className="py-3 px-3">Talle & Color</th>
                <th className="py-3 px-3 text-center">Stock Actual</th>
                <th className="py-3 px-3 text-right">Precio Costo</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-right">Margen %</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 font-medium italic">
                    No se encontraron productos en el inventario. Haz clic en "➕ Nuevo Producto en Stock" para registrar prendas.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minStockWarning;
                  const marginPct = item.costPrice > 0 ? Math.round(((item.retailPrice - item.costPrice) / item.retailPrice) * 100) : 100;

                  return (
                    <tr key={item.id} className={`hover:bg-amber-50/40 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-ragucci-primary whitespace-nowrap">
                        {item.code}
                      </td>

                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        <span className="bg-ragucci-bg text-ragucci-primary px-2 py-0.5 rounded text-[10px] border border-ragucci-border font-extrabold">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <strong className="text-gray-900 block font-bold text-xs">{item.name}</strong>
                        {item.supplier && <span className="text-[10px] text-gray-500 block">Prov: {item.supplier}</span>}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-gray-800 whitespace-nowrap">
                        <span>Talle {item.size}</span>
                        {item.color && <span className="text-gray-500 font-normal"> ({item.color})</span>}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickAdjustQty(item, -1)}
                            className="w-5 h-5 rounded bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors font-bold text-xs cursor-pointer"
                            title="Restar 1 unidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <strong className={`px-2 py-0.5 rounded text-xs font-extrabold min-w-[28px] text-center ${
                            isLow ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {item.quantity}
                          </strong>

                          <button
                            onClick={() => handleQuickAdjustQty(item, 1)}
                            className="w-5 h-5 rounded bg-gray-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors font-bold text-xs cursor-pointer"
                            title="Sumar 1 unidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-semibold text-gray-600 whitespace-nowrap">
                        ${formatMoney(item.costPrice)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                        ${formatMoney(item.retailPrice)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-extrabold text-ragucci-primary whitespace-nowrap">
                        {marginPct}%
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-ragucci-gold text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold p-1 rounded transition-colors"
                            title="Editar Producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                            title="Eliminar Producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal: Registrar / Editar Producto en Stock */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStockItem} className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-ragucci-gold" />
                <span>{editingItem ? 'Editar Producto en Stock' : 'Registrar Nuevo Producto RTW'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-ragucci-primary block mb-1">Código del Producto *</label>
                  <input
                    type="text"
                    placeholder="Ej: SAC-LINO-50"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-mono font-extrabold focus:outline-none focus:border-ragucci-gold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-ragucci-primary block mb-1">Categoría *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StockItem['category'])}
                    className="w-full p-2 border border-gray-300 rounded font-bold focus:outline-none focus:border-ragucci-gold cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-ragucci-primary block mb-1">Nombre / Descripción de la Prenda *</label>
                <input
                  type="text"
                  placeholder="Ej: Saco de Lino Beige Listo para Llevar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-bold focus:outline-none focus:border-ragucci-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-gray-800 block mb-1">Talle (ej: 48, 50, M, L)</label>
                  <input
                    type="text"
                    placeholder="Ej: 50"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-bold focus:outline-none focus:border-ragucci-gold"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-gray-800 block mb-1">Color / Tono</label>
                  <input
                    type="text"
                    placeholder="Ej: Azul Marino"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-ragucci-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-emerald-800 block mb-1">Cantidad Inicial en Stock *</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2 border-2 border-emerald-500 rounded font-black text-sm text-emerald-900 focus:outline-none"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-red-700 block mb-1">Alerta de Stock Mínimo</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={minStockWarning}
                    onChange={(e) => setMinStockWarning(e.target.value)}
                    className="w-full p-2 border border-red-300 rounded font-bold text-red-900 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-amber-800 block mb-1">Precio de Costo ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-extrabold focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-emerald-700 block mb-1">Precio Venta Público ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="w-full p-2 border-2 border-ragucci-gold rounded font-extrabold text-sm focus:outline-none text-ragucci-primary"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Proveedor / Taller Confección</label>
                <input
                  type="text"
                  placeholder="Ej: Taller Camisero Guillermo / Taller Santiago"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-ragucci-gold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notas Adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ubicación en percha 3. Tela 100% lino italiano."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-ragucci-gold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-1/2 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-ragucci-primary text-ragucci-gold font-extrabold text-xs uppercase rounded hover:bg-ragucci-primary-light transition-colors shadow-sm cursor-pointer"
              >
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
