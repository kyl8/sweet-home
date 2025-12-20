import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/sanitizer';

const EXPORT_TYPES = {
  SWEETS: 'sweets',
  INGREDIENTS: 'ingredients',
  KITCHENWARE: 'kitchenware',
  SALES: 'sales',
  ALL: 'all'
};

const ALL_MARKER = '__ALL_DATA_CSV_V1'
const SECTION_MARKER = '__SECTION__'
const MAX_CSV_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 10000;

const escapeCSVValue = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/"/g, '""').substring(0, 50000);
};

const generateCSVContent = (headers, rows) => {
  const headerRow = headers.map(h => `"${escapeCSVValue(h)}"`).join(',');
  const dataRows = rows.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${escapeCSVValue(JSON.stringify(value))}"`;
      if (typeof value === 'string') return `"${escapeCSVValue(value)}"`;
      return String(value);
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

const downloadCSV = (content, filename) => {
  if (typeof content !== 'string' || content.length === 0) {
    logger.error('CSV conteudo vazio');
    return;
  }

  if (content.length > MAX_CSV_SIZE) {
    logger.error('CSV excede tamanho maximo', { size: content.length });
    return;
  }

  const sanitizedFilename = sanitizeInput(filename, { maxLength: 100 });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', sanitizedFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  logger.info('CSV baixado', { filename: sanitizedFilename, size: blob.size });
};

const validateCSVSize = (content) => {
  if (typeof content !== 'string') {
    throw new Error('CSV invalido');
  }
  if (content.length > MAX_CSV_SIZE) {
    throw new Error(`CSV excede tamanho maximo de ${MAX_CSV_SIZE / 1024 / 1024}MB`);
  }
};

const parseCSVContentSecure = (content) => {
  validateCSVSize(content);

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV invalido sem dados');

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().substring(0, 100));
  const rows = [];
  let rowCount = 0;

  for (let i = 1; i < lines.length; i++) {
    if (rowCount >= MAX_ROWS) {
      logger.warn('Limite de linhas CSV atingido', { maxRows: MAX_ROWS });
      break;
    }

    const row = {};
    let insideQuotes = false;
    let currentValue = '';
    let columnIndex = 0;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      const nextChar = lines[i][j + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        const headerKey = headers[columnIndex]?.trim();
        if (headerKey) {
          row[headerKey] = sanitizeInput(currentValue.trim(), { maxLength: 1000, removeHtml: true });
        }
        currentValue = '';
        columnIndex++;
      } else {
        currentValue += char;
      }
    }

    if (columnIndex < headers.length) {
      const headerKey = headers[columnIndex]?.trim();
      if (headerKey) {
        row[headerKey] = sanitizeInput(currentValue.trim(), { maxLength: 1000, removeHtml: true });
      }
    }

    if (Object.keys(row).some(key => row[key])) {
      rows.push(row);
      rowCount++;
    }
  }

  return { headers, rows };
};

const tryParseJSON = (str) => {
  try {
    if (typeof str !== 'string') return str;
    if (!/^[\[\{]/.test(str.trim())) {
      return str;
    }
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return str;
  } catch {
    return str;
  }
};

const buildSection = (name, headers, rows) => {
  const headerLine = headers.join(',')
  const rowLines = rows.map(r =>
    headers.map(h => {
      let v = r[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') v = JSON.stringify(v)
      const s = String(v).replace(/"/g,'""')
      return `"${s}"`
    }).join(',')
  )
  return [`${SECTION_MARKER},${name}`, headerLine, ...rowLines]
}

const exportAllSingle = (sweets, ingredients, kitchenware, sales) => {
  try {
    if (!Array.isArray(sweets) || !Array.isArray(ingredients) || 
        !Array.isArray(kitchenware) || !Array.isArray(sales)) {
      throw new Error('Dados invalidos para exportacao');
    }

    const lines = [ALL_MARKER]

    lines.push(
      ...buildSection(
        'sweets',
        ['id','name','stock','price','expiry_date','unitName','unitWeight','image','observations'],
        (sweets || []).slice(0, MAX_ROWS).map(s=>({
          id:s.id,
          name:s.name,
          stock:s.stock,
          price:s.price,
          expiry_date:s.expiry_date||'',
          unitName:s.unitName||'unidade',
          unitWeight:s.unitWeight||'',
          image:s.image||'',
          observations:s.observations||''
        }))
      )
    )

    lines.push(
      ...buildSection(
        'ingredients',
        ['id','name','brand','purchaseDate','expiryDate','stockInBaseUnit','baseUnit','displayUnit','displayUnitFactor','displayUnitPrice','costPerBaseUnit','observations'],
        (ingredients || []).slice(0, MAX_ROWS).map(i=>({
          id:i.id,
          name:i.name,
          brand:i.brand||'',
          purchaseDate:i.purchaseDate||'',
          expiryDate:i.expiryDate||'',
          stockInBaseUnit:i.stockInBaseUnit||0,
          baseUnit:i.baseUnit||'g',
          displayUnit:i.displayUnit||'',
          displayUnitFactor:i.displayUnitFactor||0,
          displayUnitPrice:i.displayUnitPrice||0,
          costPerBaseUnit:i.costPerBaseUnit||0,
          observations:i.observations||''
        }))
      )
    )

    lines.push(
      ...buildSection(
        'kitchenware',
        ['id','name','quantity','condition','observations'],
        (kitchenware || []).slice(0, MAX_ROWS).map(k=>({
          id:k.id,
          name:k.name,
          quantity:k.quantity,
          condition:k.condition,
          observations:k.observations||''
        }))
      )
    )

    lines.push(
      ...buildSection(
        'sales',
        ['id','date','timestamp','itemCount','totalAmount','totalCost','totalProfit','operatorName','items'],
        (sales || []).slice(0, MAX_ROWS).map(s=>({
          id:s.id||'',
          date:s.date,
          timestamp:s.timestamp||'',
          itemCount:s.items?.length||0,
          totalAmount:s.totalAmount||0,
          totalCost:s.totalCost||0,
          totalProfit:s.totalProfit||0,
          operatorName:s.operatorName||'',
          items:JSON.stringify(s.items||[])
        }))
      )
    )

    const content = lines.join('\n')
    downloadCSV(content, `all_data_${new Date().toISOString().slice(0,10)}.csv`)
    logger.info('CSV unico com todos os dados exportado')
  } catch (e) {
    logger.error('CSV unico erro ao exportar', { error: e.message })
    throw e
  }
}

const parseAllSingle = (content) => {
  validateCSVSize(content);
  
  const lines = content.split(/\r?\n/).filter(l=>l.trim()!=='')
  if (!lines.length || lines[0].trim() !== ALL_MARKER) throw new Error('Formato invalido')
  const result = { sweets:[], ingredients:[], kitchenware:[], sales:[] }
  let i = 1
  while(i < lines.length){
    const line = lines[i]
    if (!line.startsWith(SECTION_MARKER)) throw new Error(`Marcador de secao esperado na linha ${i+1}`)
    const sectionName = line.split(',')[1]
    i++
    if (i >= lines.length) break
    const headers = lines[i].split(',').map(h=>h.trim())
    i++
    let sectionRowCount = 0;
    while(i < lines.length && !lines[i].startsWith(SECTION_MARKER)){
      if (sectionRowCount >= MAX_ROWS) {
        logger.warn('Limite de linhas por secao atingido', { section: sectionName, maxRows: MAX_ROWS });
        break;
      }
      const rowLine = lines[i]
      const cols = []
      let cur='', inQuotes=false
      for (let p=0;p<rowLine.length;p++){
        const c=rowLine[p], n=rowLine[p+1]
        if (c === '"'){
          if (inQuotes && n === '"'){ cur+='"'; p++ }
          else inQuotes = !inQuotes
        } else if (c === ',' && !inQuotes){
          cols.push(cur); cur=''
        } else cur+=c
      }
      cols.push(cur)
      const obj={}
      headers.forEach((h,idx)=>{
        let v = (cols[idx]||'').replace(/^"|"$/g,'').replace(/""/g,'"')
        if (v.startsWith('{') || v.startsWith('[')){
          try { v = JSON.parse(v) } catch {}
        } else if (!isNaN(v) && v.trim()!==''){
          const num = Number(v)
          if (!isNaN(num)) v = num
        }
        obj[h]=v
      })
      if (Object.keys(obj).some(key => obj[key])) {
        if (result[sectionName]) result[sectionName].push(obj)
        sectionRowCount++;
      }
      i++
    }
  }
  return result
}

export const csvService = {
  exportSweets: (sweets) => {
    try {
      if (!Array.isArray(sweets)) {
        throw new Error('Dados de doces invalidos');
      }

      const headers = [
        'id', 'name', 'stock', 'price', 'expiry_date', 
        'unitName', 'unitWeight', 'image', 'observations'
      ];
      
      const rows = sweets.slice(0, MAX_ROWS).map(sweet => ({
        id: sweet.id,
        name: sweet.name,
        stock: sweet.stock,
        price: sweet.price,
        expiry_date: sweet.expiry_date || '',
        unitName: sweet.unitName || 'unidade',
        unitWeight: sweet.unitWeight || '',
        image: sweet.image || '',
        observations: sweet.observations || ''
      }));

      const content = generateCSVContent(headers, rows);
      downloadCSV(content, `sweets_${new Date().toISOString().split('T')[0]}.csv`);
      logger.info('Doces exportados', { count: rows.length });
    } catch (error) {
      logger.error('Erro ao exportar doces', { error: error.message });
      throw error;
    }
  },

  exportIngredients: (ingredients) => {
    try {
      if (!Array.isArray(ingredients)) {
        throw new Error('Dados de ingredientes invalidos');
      }

      const headers = [
        'id', 'name', 'brand', 'purchaseDate', 'expiryDate',
        'stockInBaseUnit', 'baseUnit', 'displayUnit', 'displayUnitFactor',
        'displayUnitPrice', 'costPerBaseUnit', 'observations'
      ];

      const rows = ingredients.slice(0, MAX_ROWS).map(ing => ({
        id: ing.id,
        name: ing.name,
        brand: ing.brand || '',
        purchaseDate: ing.purchaseDate || '',
        expiryDate: ing.expiryDate || '',
        stockInBaseUnit: ing.stockInBaseUnit,
        baseUnit: ing.baseUnit,
        displayUnit: ing.displayUnit,
        displayUnitFactor: ing.displayUnitFactor,
        displayUnitPrice: ing.displayUnitPrice,
        costPerBaseUnit: ing.costPerBaseUnit,
        observations: ing.observations || ''
      }));

      const content = generateCSVContent(headers, rows);
      downloadCSV(content, `ingredients_${new Date().toISOString().split('T')[0]}.csv`);
      logger.info('Ingredientes exportados', { count: rows.length });
    } catch (error) {
      logger.error('Erro ao exportar ingredientes', { error: error.message });
      throw error;
    }
  },

  exportKitchenware: (kitchenware) => {
    try {
      if (!Array.isArray(kitchenware)) {
        throw new Error('Dados de utensilios invalidos');
      }

      const headers = ['id', 'name', 'quantity', 'condition', 'observations'];

      const rows = kitchenware.slice(0, MAX_ROWS).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        condition: item.condition,
        observations: item.observations || ''
      }));

      const content = generateCSVContent(headers, rows);
      downloadCSV(content, `kitchenware_${new Date().toISOString().split('T')[0]}.csv`);
      logger.info('Utensílios exportados', { count: rows.length });
    } catch (error) {
      logger.error('Erro ao exportar utensílios', { error: error.message });
      throw error;
    }
  },

  exportSales: (sales) => {
    try {
      if (!Array.isArray(sales)) {
        throw new Error('Dados de vendas invalidos');
      }

      const headers = [
        'id', 'date', 'timestamp', 'itemCount', 'totalAmount',
        'totalCost', 'totalProfit', 'operatorName', 'items'
      ];

      const rows = sales.slice(0, MAX_ROWS).map(sale => ({
        id: sale.id || '',
        date: sale.date,
        timestamp: sale.timestamp || '',
        itemCount: sale.items?.length || 0,
        totalAmount: sale.totalAmount,
        totalCost: sale.totalCost,
        totalProfit: sale.totalProfit,
        operatorName: sale.operatorName || '',
        items: JSON.stringify(sale.items || [])
      }));

      const content = generateCSVContent(headers, rows);
      downloadCSV(content, `sales_${new Date().toISOString().split('T')[0]}.csv`);
      logger.info('Vendas exportadas', { count: rows.length });
    } catch (error) {
      logger.error('Erro ao exportar vendas', { error: error.message });
      throw error;
    }
  },

  exportAll: (sweets, ingredients, kitchenware, sales) => {
    try {
      csvService.exportSweets(sweets);
      csvService.exportIngredients(ingredients);
      csvService.exportKitchenware(kitchenware);
      csvService.exportSales(sales);

      logger.info('Todos os dados exportados com sucesso');
    } catch (error) {
      logger.error('Erro ao exportar todos os dados', { error: error.message });
      throw error;
    }
  },

  importSweets: (csvContent) => {
    try {
      const { headers, rows } = parseCSVContentSecure(csvContent);
      
      const sweets = rows.map(row => ({
        id: parseInt(row.id) || Date.now(),
        name: sanitizeInput(row.name, { maxLength: 100 }),
        stock: Math.max(0, parseInt(row.stock) || 0),
        price: Math.max(0.01, parseFloat(row.price) || 0),
        expiry_date: row.expiry_date || '',
        unitName: row.unitName || 'unidade',
        unitWeight: Math.max(0, parseFloat(row.unitWeight) || 0),
        image: row.image || '',
        observations: sanitizeInput(row.observations || '', { maxLength: 150 })
      }));

      logger.info('Doces importados', { count: sweets.length });
      return sweets;
    } catch (error) {
      logger.error('Erro ao importar doces', { error: error.message });
      throw error;
    }
  },

  importIngredients: (csvContent) => {
    try {
      const { headers, rows } = parseCSVContentSecure(csvContent);

      const ingredients = rows.map(row => ({
        id: parseInt(row.id) || Date.now(),
        name: sanitizeInput(row.name, { maxLength: 100 }),
        brand: sanitizeInput(row.brand || '', { maxLength: 100 }),
        purchaseDate: row.purchaseDate || new Date().toISOString().split('T')[0],
        expiryDate: row.expiryDate || '',
        stockInBaseUnit: Math.max(0, parseFloat(row.stockInBaseUnit) || 0),
        baseUnit: row.baseUnit || 'g',
        displayUnit: row.displayUnit || '',
        displayUnitFactor: Math.max(0, parseFloat(row.displayUnitFactor) || 1),
        displayUnitPrice: Math.max(0, parseFloat(row.displayUnitPrice) || 0),
        costPerBaseUnit: Math.max(0, parseFloat(row.costPerBaseUnit) || 0),
        observations: sanitizeInput(row.observations || '', { maxLength: 150 })
      }));

      logger.info('Ingredientes importados', { count: ingredients.length });
      return ingredients;
    } catch (error) {
      logger.error('Erro ao importar ingredientes', { error: error.message });
      throw error;
    }
  },

  importKitchenware: (csvContent) => {
    try {
      const { headers, rows } = parseCSVContentSecure(csvContent);

      const kitchenware = rows.map(row => ({
        id: parseInt(row.id) || Date.now(),
        name: sanitizeInput(row.name, { maxLength: 100 }),
        quantity: Math.max(0, parseInt(row.quantity) || 0),
        condition: ['Novo', 'Bom', 'Desgastado'].includes(row.condition) ? row.condition : 'Bom',
        observations: sanitizeInput(row.observations || '', { maxLength: 150 })
      }));

      logger.info('Utensílios importados', { count: kitchenware.length });
      return kitchenware;
    } catch (error) {
      logger.error('Erro ao importar utensílios', { error: error.message });
      throw error;
    }
  },

  importSales: (csvContent) => {
    try {
      const { headers, rows } = parseCSVContentSecure(csvContent);

      const sales = rows.map(row => ({
        id: row.id || `sale_${Date.now()}`,
        date: row.date,
        timestamp: parseInt(row.timestamp) || Date.now(),
        items: tryParseJSON(row.items) || [],
        totalAmount: Math.max(0, parseFloat(row.totalAmount) || 0),
        totalCost: Math.max(0, parseFloat(row.totalCost) || 0),
        totalProfit: parseFloat(row.totalProfit) || 0,
        operatorName: sanitizeInput(row.operatorName || '', { maxLength: 100 }),
        status: 'completed'
      }));

      logger.info('Vendas importadas', { count: sales.length });
      return sales;
    } catch (error) {
      logger.error('Erro ao importar vendas', { error: error.message });
      throw error;
    }
  },

  exportAllSingle: exportAllSingle,
  importAllSingle: parseAllSingle
};
