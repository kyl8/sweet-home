import { logger } from '../utils/logger';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const reportsService = {
  salesByPeriod: (sales, periodType, startDate, endDate) => {
    try {
      const filtered = (sales || []).filter(sale => {
        const saleDate = new Date(sale.date);
        if (startDate && new Date(startDate) > saleDate) return false;
        if (endDate && new Date(endDate) < saleDate) return false;
        return true;
      });

      const grouped = {};

      filtered.forEach(sale => {
        const date = new Date(sale.date);
        let key;

        if (periodType === 'dia') {
          key = sale.date;
        } else if (periodType === 'semana') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else if (periodType === 'mes') {
          key = sale.date.substring(0, 7);
        }

        if (!grouped[key]) {
          grouped[key] = { periodo: key, vendas: 0, total: 0, custo: 0, lucro: 0 };
        }

        grouped[key].vendas += 1;
        grouped[key].total += Number(sale.totalAmount || 0);
        grouped[key].custo += Number(sale.totalCost || 0);
        grouped[key].lucro += Number(sale.totalProfit || 0);
      });

      logger.info('Sales by period calculated', { periodType, count: Object.keys(grouped).length });
      return Object.values(grouped);
    } catch (error) {
      logger.error('Error calculating sales by period', { error: error.message });
      return [];
    }
  },

  profitMarginByPeriod: (sales, periodType, startDate, endDate) => {
    try {
      const salesByPeriod = reportsService.salesByPeriod(sales, periodType, startDate, endDate);

      return salesByPeriod.map(period => ({
        ...period,
        receita: period.total,
        margem: period.total > 0 ? ((period.lucro / period.total) * 100) : 0
      }));
    } catch (error) {
      logger.error('Error calculating profit margin by period', { error: error.message });
      return [];
    }
  },

  topSellingProducts: (sales, sweets, limit = 10, startDate, endDate) => {
    try {
      const filtered = (sales || []).filter(sale => {
        const saleDate = new Date(sale.date);
        if (startDate && new Date(startDate) > saleDate) return false;
        if (endDate && new Date(endDate) < saleDate) return false;
        return true;
      });

      const productSales = {};

      filtered.forEach(sale => {
        (sale.items || []).forEach(item => {
          if (!productSales[item.sweetId]) {
            const sweet = sweets.find(s => s.id === item.sweetId);
            productSales[item.sweetId] = {
              sweetId: item.sweetId,
              nome: sweet?.name || 'Produto Desconhecido',
              quantidade: 0
            };
          }
          productSales[item.sweetId].quantidade += item.quantity;
        });
      });

      const sorted = Object.values(productSales)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, limit);

      logger.info('Top selling products calculated', { count: sorted.length });
      return sorted;
    } catch (error) {
      logger.error('Error calculating top selling products', { error: error.message });
      return [];
    }
  },

  lowStockAlerts: (sweets, threshold = 5) => {
    try {
      const lowStock = (sweets || [])
        .filter(sweet => Number(sweet.stock || 0) <= threshold)
        .map(sweet => ({
          id: sweet.id,
          nome: sweet.name,
          estoque: sweet.stock
        }))
        .sort((a, b) => a.estoque - b.estoque);

      logger.info('Low stock alerts calculated', { count: lowStock.length });
      return lowStock;
    } catch (error) {
      logger.error('Error calculating low stock alerts', { error: error.message });
      return [];
    }
  },

  exportPDFReport: (title, sections) => {
    try {
      logger.info('PDF report export initiated', { title, sections: sections.length });
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Cores tema
      const primaryColor = [220, 53, 69];     // Rosa principal (#DC3545)
      const lightColor = [253, 230, 239];     // Rosa clara (#FDE6EF)
      const accentColor = [102, 51, 102];     // Roxo escuro (#663366)

      // Função para adicionar cabeçalho em todas as páginas
      const addHeader = (pageNum) => {
        doc.setPage(pageNum);
        
        // Fundo rosa no topo
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Título da empresa
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('Sweet Home', pageWidth / 2, 15, { align: 'center' });

        // Subtítulo
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Relatório de Gestão', pageWidth / 2, 27, { align: 'center' });

        // Linha decorativa
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(0, 35, pageWidth, 35);
      };

      // Adicionar cabeçalho na primeira página
      addHeader(1);
      yPosition = 50;

      // Título do relatório
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...accentColor);
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Data do relatório com estilo
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('Helvetica', 'italic');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
        pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Linha separadora
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      // Processar seções
      sections.forEach((section, sectionIndex) => {
        // Verificar se precisa nova página
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          const pageNum = doc.internal.pages.length - 1;
          addHeader(pageNum);
          yPosition = 50;
        }

        // Título da seção com fundo rosa claro
        doc.setFillColor(...lightColor);
        doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(section.title, 18, yPosition + 1);
        yPosition += 10;

        // Tabela da seção
        if (section.rows && section.rows.length > 0) {
          doc.autoTable({
            head: [section.headers],
            body: section.rows.map(row => 
              section.headers.map(header => {
                const value = row[header];
                if (typeof value === 'number') {
                  return typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value.toString();
                }
                return value || '-';
              })
            ),
            startY: yPosition,
            margin: { left: 15, right: 15 },
            headStyles: { 
              fillColor: primaryColor,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center'
            },
            bodyStyles: { 
              textColor: [50, 50, 50],
              fontSize: 9
            },
            alternateRowStyles: { 
              fillColor: lightColor
            },
            borderColor: [220, 200, 220],
            lineColor: [220, 200, 220],
            lineWidth: 0.3,
            didDrawPage: function(data) {
              yPosition = data.cursor.y + 8;
            }
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text('Sem dados disponíveis', 18, yPosition);
          yPosition += 10;
        }

        yPosition += 5;
      });

      // Rodapé em todas as páginas
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        
        // Linha de rodapé
        doc.setDrawColor(220, 220, 220);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
        
        // Numeração
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Copyright
        doc.setFontSize(7);
        doc.text(
          '© Sweet Home - Todos os direitos reservados',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Baixar PDF
      doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      logger.info('PDF report exported successfully', { title });
      return { success: true, message: 'Relatório exportado com sucesso' };
    } catch (error) {
      logger.error('Error exporting PDF report', { error: error.message });
      throw error;
    }
  }
};
