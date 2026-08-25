import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockItem, StockSizeVariant } from '../../types';
import { formatMoney, getTodayString } from '../../utils/formatters';
import { UserBadge } from '../common/UserBadge';
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
  RefreshCw,
  Layers,
  Check
} from 'lucide-react';

const CATEGORIES: StockItem['category'][] = [
  'Sacos RTW',
  'Ambos RTW',
  'Pantalones RTW',
  'Sobretodos & Camperas',
  'Camisas',
  'Corbatas & Pañuelos',
  'Accesorios & Zapatos',
  'Otros'
];

const PRESET_SIZES = ['44', '46', '48', '50', '52', '54', '56', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];

export const StockDashboard: React.FC = () => {
  const { stockItems, config, saveStockItemData, removeStockItemData } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modal State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form Fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<StockItem['category']>('Sacos RTW');
  const [sizesList, setSizesList] = useState<StockSizeVariant[]>([]);
  const [minStockWarning, setMinStockWarning] = useState<string>('1');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [retailPrice, setRetailPrice] = useState<string>('0');
  const [supplier, setSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customSizeInput, setCustomSizeInput] = useState<string>('');

  const handleOpenNewModal = () => {
    setEditingItem(null);
    setCode(`RTW-${Date.now().toString().slice(-4)}`);
    setName('');
    setCategory('Sacos RTW');
    setSizesList([
      { size: '50', quantity: 1 }
    ]);
    setMinStockWarning('1');
    setCostPrice('0');
    setRetailPrice('0');
    setSupplier('');
    setNotes('');
    setCustomSizeInput('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItem(item);
    setCode(item.code || '');
    setName(item.name || '');
    setCategory(item.category || 'Sacos RTW');
    
    // Convert legacy size/quantity to sizes array if empty
    let initialSizes: StockSizeVariant[] = item.sizes && item.sizes.length > 0 ? [...item.sizes] : [];
    if (initialSizes.length === 0 && item.size) {
      initialSizes = [{ size: item.size, color: item.color || '', quantity: item.quantity || 1 }];
    }
    if (initialSizes.length === 0) {
      initialSizes = [{ size: 'Único', quantity: 1 }];
    }

    setSizesList(initialSizes);
    setMinStockWarning(item.minStockWarning ? item.minStockWarning.toString() : '1');
    setCostPrice(item.costPrice ? item.costPrice.toString() : '0');
    setRetailPrice(item.retailPrice ? item.retailPrice.toString() : '0');
    setSupplier(item.supplier || '');
    setNotes(item.notes || '');
    setCustomSizeInput('');
    setShowFormModal(true);
  };

  // Add a size preset to the current editing modal
  const handleTogglePresetSize = (preset: string) => {
    const exists = sizesList.some(s => s.size.toLowerCase() === preset.toLowerCase());
    if (exists) {
      setSizesList(prev => prev.filter(s => s.size.toLowerCase() !== preset.toLowerCase()));
    } else {
      setSizesList(prev => [...prev, { size: preset, quantity: 1 }]);
    }
  };

  // Add custom size
  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim();
    if (!sizesList.some(s => s.size.toLowerCase() === clean.toLowerCase())) {
      setSizesList(prev => [...prev, { size: clean, quantity: 1 }]);
    }
    setCustomSizeInput('');
  };

  // Update quantity for specific size in modal
  const handleUpdateSizeQtyInModal = (index: number, newQty: number) => {
    const updated = [...sizesList];
    updated[index].quantity = Math.max(0, newQty);
    setSizesList(updated);
  };

  // Remove size from modal list
  const handleRemoveSizeInModal = (index: number) => {
    setSizesList(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save Product (Master Row)
  const handleSaveStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert("Por favor completa el código y nombre del producto.");
      return;
    }

    const totalCombinedQty = sizesList.reduce((acc, s) => acc + (s.quantity || 0), 0);
    const parsedMin = parseInt(minStockWarning) || 1;
    const parsedCost = parseFloat(costPrice) || 0;
    const parsedRetail = parseFloat(retailPrice) || 0;

    const newItem: StockItem = {
      id: editingItem ? editingItem.id : Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      firestoreId: editingItem?.firestoreId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      sizes: sizesList,
      quantity: totalCombinedQty,
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

  // Quick adjust size quantity directly from table row
  const handleQuickAdjustSizeQty = async (item: StockItem, sizeName: string, delta: number) => {
    let updatedSizes = item.sizes && item.sizes.length > 0 ? [...item.sizes] : [];
    if (updatedSizes.length === 0 && item.size) {
      updatedSizes = [{ size: item.size, quantity: item.quantity || 1 }];
    }

    const idx = updatedSizes.findIndex(s => s.size.toLowerCase() === sizeName.toLowerCase());
    if (idx >= 0) {
      updatedSizes[idx].quantity = Math.max(0, updatedSizes[idx].quantity + delta);
    } else if (delta > 0) {
      updatedSizes.push({ size: sizeName, quantity: delta });
    }

    const totalQty = updatedSizes.reduce((acc, s) => acc + s.quantity, 0);

    const updatedItem: StockItem = {
      ...item,
      sizes: updatedSizes,
      quantity: totalQty,
      lastUpdated: getTodayString()
    };

    try {
      await saveStockItemData(updatedItem, item.firestoreId);
    } catch (err) {
      alert("Error al actualizar stock del talle.");
    }
  };

  // Delete product master row
  const handleDeleteItem = async (item: StockItem) => {
    if (!item.firestoreId) return;
    if (confirm(`¿Deseas eliminar el producto "${item.name}" con todos sus talles del inventario?`)) {
      try {
        await removeStockItemData(item.firestoreId);
      } catch (err) {
        alert("Error al eliminar el producto.");
      }
    }
  };

  // Auto-consolidate duplicate product entries into 1 single master row with matrix of sizes
  const handleConsolidateDuplicates = async () => {
    const rtwMap = config.rtwPrecios || {};
    const rtwKeys = Object.keys(rtwMap);

    if (!confirm("¿Deseas consolidar todos los productos en filas únicas por modelo con su matriz de talles? (Esto unificará productos duplicados)")) {
      return;
    }

    // Group stock items by normalized name
    const groupedMap = new Map<string, StockItem[]>();
    stockItems.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)!.push(item);
    });

    let countConsolidated = 0;

    for (const [normName, items] of groupedMap.entries()) {
      if (items.length > 1) {
        // Merge into first item
        const master = items[0];
        const mergedSizesMap = new Map<string, number>();

        items.forEach((it) => {
          if (it.sizes && it.sizes.length > 0) {
            it.sizes.forEach(s => {
              const szKey = s.size.trim();
              mergedSizesMap.set(szKey, (mergedSizesMap.get(szKey) || 0) + s.quantity);
            });
          } else if (it.size) {
            const szKey = it.size.trim();
            mergedSizesMap.set(szKey, (mergedSizesMap.get(szKey) || 0) + (it.quantity || 1));
          }
        });

        const mergedSizes: StockSizeVariant[] = Array.from(mergedSizesMap.entries()).map(([sz, qty]) => ({
          size: sz,
          quantity: qty
        }));

        const masterUpdated: StockItem = {
          ...master,
          sizes: mergedSizes,
          quantity: mergedSizes.reduce((acc, s) => acc + s.quantity, 0),
          costPrice: rtwMap[master.name] || master.costPrice || 0,
          lastUpdated: getTodayString()
        };

        try {
          await saveStockItemData(masterUpdated, master.firestoreId);
          // Delete extra duplicate docs
          for (let i = 1; i < items.length; i++) {
            if (items[i].firestoreId) {
              await removeStockItemData(items[i].firestoreId!);
            }
          }
          countConsolidated++;
        } catch (err) {
          console.error("Error consolidando:", normName, err);
        }
      } else {
        // Single item: ensure costPrice matches Ajustes if available
        const single = items[0];
        const costFromAjustes = rtwMap[single.name];
        if (costFromAjustes !== undefined && costFromAjustes !== single.costPrice) {
          const updated = {
            ...single,
            costPrice: costFromAjustes,
            lastUpdated: getTodayString()
          };
          await saveStockItemData(updated, single.firestoreId);
        }
      }
    }

    // Also import any missing items from Ajustes
    for (const key of rtwKeys) {
      const itemName = key;
      const baseCost = rtwMap[key] || 0;
      const exists = stockItems.some(i => i.name.toLowerCase().trim() === itemName.toLowerCase().trim());

      if (!exists) {
        let cat: StockItem['category'] = 'Otros';
        const nameUpper = itemName.toUpperCase();
        if (nameUpper.includes('SACO')) cat = 'Sacos RTW';
        else if (nameUpper.includes('AMBO')) cat = 'Ambos RTW';
        else if (nameUpper.includes('PANTALÓN') || nameUpper.includes('PANTALON')) cat = 'Pantalones RTW';
        else if (nameUpper.includes('SOBRETODO') || nameUpper.includes('CAMPERA') || nameUpper.includes('CAMISACO')) cat = 'Sobretodos & Camperas';
        else if (nameUpper.includes('CAMISA')) cat = 'Camisas';
        else if (nameUpper.includes('CORBATA') || nameUpper.includes('MOÑO') || nameUpper.includes('PAÑUELO')) cat = 'Corbatas & Pañuelos';
        else if (nameUpper.includes('ZAPATO') || nameUpper.includes('SWEATER') || nameUpper.includes('CINTURÓN')) cat = 'Accesorios & Zapatos';

        const newItem: StockItem = {
          id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
          code: `RTW-${Math.floor(1000 + Math.random() * 9000)}`,
          name: itemName,
          category: cat,
          sizes: [
            { size: '48', quantity: 0 },
            { size: '50', quantity: 1 },
            { size: '52', quantity: 0 }
          ],
          quantity: 1,
          minStockWarning: 1,
          costPrice: baseCost,
          retailPrice: 0,
          supplier: 'Sastrería Ragucci RTW',
          lastUpdated: getTodayString()
        };
        await saveStockItemData(newItem);
      }
    }

    alert(`✅ Inventario consolidado con éxito en filas únicas por modelo de producto con su matriz de talles.`);
  };

  // Filtered Master Items
  const filteredItems = useMemo(() => {
    return stockItems.filter((i) => {
      if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
      if (onlyLowStock && i.quantity > i.minStockWarning) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = i.code?.toLowerCase().includes(term);
        const matchesName = i.name?.toLowerCase().includes(term);
        const matchesSizes = i.sizes?.some(s => s.size.toLowerCase().includes(term));
        const matchesSupplier = i.supplier?.toLowerCase().includes(term);
        return matchesCode || matchesName || matchesSizes || matchesSupplier;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [stockItems, selectedCategory, onlyLowStock, searchTerm]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    stockItems.forEach((i) => {
      const itemQty = i.sizes && i.sizes.length > 0 
        ? i.sizes.reduce((acc, s) => acc + s.quantity, 0)
        : (i.quantity || 0);

      totalUnits += itemQty;
      totalCostValuation += itemQty * (i.costPrice || 0);
      totalRetailValuation += itemQty * (i.retailPrice || 0);
      if (itemQty <= i.minStockWarning) lowStockCount++;
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
            <span>Control de Stock & Inventario (Filas Únicas por Modelo)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Cada producto figura en 1 sola fila con su matriz de talles y stock disponible editable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConsolidateDuplicates}
            className="bg-ragucci-primary-light hover:bg-ragucci-primary text-ragucci-gold font-extrabold px-3.5 py-2 rounded text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border border-ragucci-gold/30"
            title="Consolidar productos duplicados en 1 sola fila con sus talles"
          >
            <Layers className="w-4 h-4 text-ragucci-gold" />
            <span>⚡ Consolidar Filas & Talles</span>
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
            {metrics.totalUnits} prendas
          </strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">{metrics.totalItemsCount} modelos registrados</span>
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
          <span className="text-[10px] text-gray-400 block mt-0.5">Facturación potencial boutique</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-ragucci-gold-light">
          <div className="flex justify-between items-center text-red-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Stock Bajo / Reposición</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <strong className="text-xl font-extrabold text-red-600 block font-sans">
            {metrics.lowStockCount} modelos
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
            placeholder="Buscar por producto, talle (48, 50, S, M)..."
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

      {/* Inventory Table (Master Rows with Size Matrix) */}
      <div className="bg-white rounded-lg shadow-md border border-ragucci-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ragucci-primary text-ragucci-gold uppercase tracking-wider text-[11px] font-extrabold border-b border-ragucci-gold">
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Producto / Modelo</th>
                <th className="py-3 px-3">Matriz de Talles & Stock por Talle</th>
                <th className="py-3 px-3 text-center">Stock Total</th>
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
                    No se encontraron productos en el inventario. Haz clic en "➕ Nuevo Producto" o "⚡ Consolidar Filas & Talles".
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const sizes: StockSizeVariant[] = item.sizes && item.sizes.length > 0 
                    ? item.sizes 
                    : (item.size ? [{ size: item.size, quantity: item.quantity || 0 }] : [{ size: 'Único', quantity: item.quantity || 0 }]);
                  
                  const totalQty = sizes.reduce((acc, s) => acc + s.quantity, 0);
                  const isLow = totalQty <= item.minStockWarning;
                  const marginPct = item.retailPrice > 0 && item.costPrice > 0 
                    ? Math.round(((item.retailPrice - item.costPrice) / item.retailPrice) * 100) 
                    : 0;

                  return (
                    <tr key={item.id} className={`hover:bg-amber-50/40 dark:hover:bg-red-950/40 transition-colors ${isLow ? 'bg-red-50/40 dark:bg-red-950/40' : ''}`}>
                      <td className="py-3 px-3 font-mono font-extrabold text-ragucci-primary whitespace-nowrap">
                        {item.code}
                      </td>

                      <td className="py-3 px-3 font-bold whitespace-nowrap">
                        <span className="bg-ragucci-bg text-ragucci-primary px-2 py-0.5 rounded text-[10px] border border-ragucci-border font-extrabold">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-gray-900 block font-bold text-xs">{item.name}</strong>
                        {item.supplier && <span className="text-[10px] text-gray-500 block">Prov: {item.supplier}</span>}
                        {(item.createdBy || item.updatedBy) && (
                          <div className="mt-1">
                            <UserBadge initial={item.updatedBy || item.createdBy} size="xs" showFullName={true} />
                          </div>
                        )}
                      </td>

                      {/* Size Matrix Column */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {sizes.map((s, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-extrabold border shadow-2xs ${
                                s.quantity > 0 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <span>Talle {s.size}:</span>
                              <div className="flex items-center gap-0.5 ml-0.5">
                                <button
                                  onClick={() => handleQuickAdjustSizeQty(item, s.size, -1)}
                                  className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors text-[10px] font-bold cursor-pointer text-gray-800 dark:text-gray-200"
                                  title={`Restar 1 al talle ${s.size}`}
                                >
                                  -
                                </button>
                                <strong className="px-1 text-xs">{s.quantity}</strong>
                                <button
                                  onClick={() => handleQuickAdjustSizeQty(item, s.size, 1)}
                                  className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors text-[10px] font-bold cursor-pointer text-gray-800 dark:text-gray-200"
                                  title={`Sumar 1 al talle ${s.size}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <strong className={`px-2.5 py-1 rounded text-xs font-black min-w-[32px] inline-block ${
                          isLow ? 'bg-red-600 text-white animate-pulse' : 'bg-ragucci-primary text-ragucci-gold'
                        }`}>
                          {totalQty} u.
                        </strong>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-gray-600 whitespace-nowrap">
                        ${formatMoney(item.costPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                        ${formatMoney(item.retailPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-ragucci-primary whitespace-nowrap">
                        {marginPct}%
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-ragucci-gold text-ragucci-primary hover:bg-ragucci-primary hover:text-ragucci-gold px-2.5 py-1 rounded transition-colors font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Gestionar Talles, Precios y Stock de esta prenda"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar / Talles</span>
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-colors cursor-pointer"
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

      {/* Form Modal: Editar / Modificar Matriz de Talles de un Producto */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStockItem} className="bg-white rounded-lg shadow-xl border border-ragucci-gold max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ragucci-gold pb-2">
              <h3 className="font-extrabold text-sm uppercase text-ragucci-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-ragucci-gold" />
                <span>{editingItem ? `Editar Producto: ${editingItem.name}` : 'Registrar Nuevo Producto'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
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
                <label className="font-extrabold text-ragucci-primary block mb-1">Nombre del Modelo / Prenda *</label>
                <input
                  type="text"
                  placeholder="Ej: Pantalón Lino Lennon - Azul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded font-bold focus:outline-none focus:border-ragucci-gold"
                  required
                />
              </div>

              {/* Matriz de Talles & Cantidades */}
              <div className="bg-amber-50/60 p-3.5 border border-amber-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <strong className="font-extrabold text-ragucci-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-ragucci-gold" />
                    <span>Desglose de Talles & Unidades en Stock</span>
                  </strong>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Stock Total: {sizesList.reduce((acc, s) => acc + (s.quantity || 0), 0)} u.
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div>
                  <span className="text-[10px] font-bold text-gray-600 block mb-1">Agregar / Quitar Talle con 1 Toque:</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_SIZES.map((preset) => {
                      const isActive = sizesList.some(s => s.size.toLowerCase() === preset.toLowerCase());
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleTogglePresetSize(preset)}
                          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-ragucci-primary text-ragucci-gold shadow-xs border border-ragucci-gold'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-amber-100'
                          }`}
                        >
                          {isActive ? `✓ Talle ${preset}` : `+ Talle ${preset}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Size Addition */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Escribir talle personalizado (ej: 58, 3XL, Especial)..."
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="flex-1 p-1.5 border border-gray-300 rounded font-medium focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="bg-purple-800 text-white font-extrabold px-3 py-1.5 rounded text-xs hover:bg-purple-900 transition-colors"
                  >
                    ➕ Añadir
                  </button>
                </div>

                {/* Active Sizes List with Qty Controls */}
                <div className="space-y-1.5 pt-2">
                  {sizesList.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic text-center py-2">
                      No hay talles agregados. Selecciona talles arriba o escribe uno personalizado.
                    </p>
                  ) : (
                    sizesList.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 border border-gray-200 rounded shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-ragucci-primary text-xs">
                            Talle {s.size}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-bold">Stock:</span>
                          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-300">
                            <button
                              type="button"
                              onClick={() => handleUpdateSizeQtyInModal(idx, s.quantity - 1)}
                              className="w-5 h-5 rounded bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={s.quantity}
                              onChange={(e) => handleUpdateSizeQtyInModal(idx, parseInt(e.target.value) || 0)}
                              className="w-12 text-center font-black text-xs bg-transparent focus:outline-none"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateSizeQtyInModal(idx, s.quantity + 1)}
                              className="w-5 h-5 rounded bg-gray-200 hover:bg-emerald-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSizeInModal(idx)}
                            className="text-red-500 hover:text-red-700 p-1 font-bold text-xs"
                            title="Quitar este talle"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-red-700 block mb-1">Alerta Stock Mínimo (Total)</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={minStockWarning}
                    onChange={(e) => setMinStockWarning(e.target.value)}
                    className="w-full p-2 border border-red-300 rounded font-bold text-red-900 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Proveedor / Confección</label>
                  <input
                    type="text"
                    placeholder="Ej: Taller Guillermo"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded font-medium focus:outline-none focus:border-ragucci-gold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notas Adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ubicación perchero 2. Tela 100% lino puro."
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
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
