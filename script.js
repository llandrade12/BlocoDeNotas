document.addEventListener('DOMContentLoaded', () => {
    const billingForm = document.getElementById('billing-form');
    const billingList = document.getElementById('billing-list');
    const copyBtn = document.getElementById('copy-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const wordBtn = document.getElementById('word-btn');
    const clearBtn = document.getElementById('clear-btn');
    const batchBtn = document.getElementById('batch-btn');
    const batchInput = document.getElementById('batch-input');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const modal = document.getElementById('detail-modal');
    const closeModal = document.querySelector('.close');

    let billings = JSON.parse(localStorage.getItem('espartano_billings')) || [];

    // ===== GERENCIAMENTO DE ABAS =====
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });

    // ===== MODAL =====
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Função para salvar e renderizar
    const updateBillings = () => {
        localStorage.setItem('espartano_billings', JSON.stringify(billings));
        renderBillings();
    };

    // Formatar moeda
    const formatCurrency = (value) => {
        if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Formatar data para exibição (YYYY-MM-DD -> DD/MM/YYYY)
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        if (dateStr.includes('/')) return dateStr; 
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    // Converter data do Excel (DD/MM/YYYY) para formato do input (YYYY-MM-DD)
    const convertExcelDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    // Limpar valor monetário (R$ 1.500,00 -> 1500.00)
    const cleanCurrency = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        return parseFloat(
            value
                .replace(/R\$\s?/g, '')
                .replace(/\./g, '')
                .replace(/,/g, '.')
                .trim()
        ) || 0;
    };

    window.changeStatus = (index, newStatus) => {
        billings[index].status = newStatus;
        localStorage.setItem('espartano_billings', JSON.stringify(billings));
        renderBillings(); 
    };

    const renderBillings = () => {
        if (!billingList) return;
        billingList.innerHTML = '';
        if (billings.length === 0) {
            billingList.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--muted);">Nenhum cliente adicionado</td></tr>';
            return;
        }
        billings.forEach((item, index) => {
            const devendo = (item.total || 0) - (item.paid || 0);
            
            let statusClass = '';
            if (item.status === 'Pago' || item.status === 'Acordo') statusClass = 'status-pago';
            else if (item.status === 'Vencido' || item.status === 'Vermelho') statusClass = 'status-vencido';
            else if (item.status === 'Cancelado' || item.status === 'Amarelado') statusClass = 'status-cancelado';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.cpf || '-'}</td>
                <td>${item.phone || '-'}</td>
                <td>${formatCurrency(item.loan)}</td>
                <td>${formatCurrency(item.total)}</td>
                <td>${formatCurrency(item.paid)}</td>
                <td style="color: #ef4444; font-weight: bold;">${formatCurrency(devendo)}</td>
                <td>
                    <select class="status-select ${statusClass}" onchange="changeStatus(${index}, this.value)">
                        <option value="Ativo" ${item.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="Acordo" ${item.status === 'Acordo' || item.status === 'Pago' ? 'selected' : ''}>Acordo</option>
                        <option value="Vermelho" ${item.status === 'Vermelho' || item.status === 'Vencido' ? 'selected' : ''}>Vermelho</option>
                        <option value="Amarelado" ${item.status === 'Amarelado' || item.status === 'Cancelado' ? 'selected' : ''}>Amarelado</option>
                    </select>
                </td>
                <td>
                    <button class="btn-view" onclick="viewDetails(${index})" title="Ver detalhes">👁️</button>
                    <button class="btn-delete" onclick="deleteBilling(${index})" title="Deletar">🗑️</button>
                </td>
            `;
            billingList.appendChild(tr);
        });
    };

    // Ver detalhes
    window.viewDetails = (index) => {
        const item = billings[index];
        const devendo = (item.total || 0) - (item.paid || 0);
        let html = `
            <div class="detail-row">
                <strong>Cliente:</strong>
                <span>${item.name}</span>
            </div>
            <div class="detail-row">
                <strong>CPF:</strong>
                <span>${item.cpf || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Telefone:</strong>
                <span>${item.phone || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Telefone/Ref:</strong>
                <span>${item.phoneRef || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Data Inicial:</strong>
                <span>${formatDate(item.startDate)}</span>
            </div>
            <div class="detail-row">
                <strong>Data Final:</strong>
                <span>${formatDate(item.endDate)}</span>
            </div>
            <div class="detail-row">
                <strong>Empréstimo:</strong>
                <span>${formatCurrency(item.loan)}</span>
            </div>
            <div class="detail-row">
                <strong>Diária:</strong>
                <span>${formatCurrency(item.daily)}</span>
            </div>
            <div class="detail-row">
                <strong>Juros:</strong>
                <span>${formatCurrency(item.interest)}</span>
            </div>
            <div class="detail-row">
                <strong>Total à Pagar:</strong>
                <span>${formatCurrency(item.total)}</span>
            </div>
            <div class="detail-row">
                <strong>Valor Pago:</strong>
                <span>${formatCurrency(item.paid)}</span>
            </div>
            <div class="detail-row">
                <strong>Devendo:</strong>
                <span style="color: var(--danger); font-weight: bold;">${formatCurrency(devendo)}</span>
            </div>
            <div class="detail-row">
                <strong>Multas:</strong>
                <span>${formatCurrency(item.fines)}</span>
            </div>
            <div class="detail-row">
                <strong>Observações:</strong>
                <span>${item.observations || '-'}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span>${item.status || 'Ativo'}</span>
            </div>
        `;
        document.getElementById('modal-title').textContent = `Detalhes - ${item.name}`;
        document.getElementById('modal-body').innerHTML = html;
        modal.style.display = 'block';
    };

    if (billingForm) {
        billingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newBilling = {
                name: document.getElementById('name').value,
                cpf: document.getElementById('cpf').value,
                phone: document.getElementById('phone').value,
                phoneRef: document.getElementById('phone-ref').value,
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                loan: parseFloat(document.getElementById('loan').value) || 0,
                daily: parseFloat(document.getElementById('daily').value) || 0,
                interest: parseFloat(document.getElementById('interest').value) || 0,
                total: parseFloat(document.getElementById('total').value) || 0,
                paid: parseFloat(document.getElementById('paid').value) || 0,
                fines: parseFloat(document.getElementById('fines').value) || 0,
                observations: document.getElementById('observations').value,
                status: document.getElementById('status').value
            };
            billings.push(newBilling);
            updateBillings();
            billingForm.reset();
            alert('Cliente adicionado com sucesso!');
        });
    }

    const parseExcelLineRobust = (line) => {
        let cleaned = line.replace(/^\d+\s+/, '').trim();
        
        let parts = cleaned.split(/\t+/);
        if (parts.length < 5) {
            parts = cleaned.split(/\s{2,}/);
        }
        
        const getPart = (idx) => (parts[idx] || '').trim();

        const parseDate = (dateStr) => {
            if (!dateStr) return '';
            const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) {
                const [_, d, m, y] = match;
                return `${y}-${m}-${d}`;
            }
            return '';
        };

        const parseMoney = (val) => {
            if (!val) return 0;
            const clean = val.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
            return parseFloat(clean) || 0;
        };

        if (parts.length >= 5) {
            return {
                name: getPart(0),
                cpf: getPart(1).replace(/\D/g, ''),
                phone: getPart(2),
                phoneRef: getPart(3),
                startDate: parseDate(getPart(4)),
                endDate: parseDate(getPart(5)),
                loan: parseMoney(getPart(6)),
                daily: parseMoney(getPart(7)),
                interest: parseMoney(getPart(8)),
                total: parseMoney(getPart(9)),
                paid: parseMoney(getPart(10)),
                fines: 0,
                observations: parts.slice(11).join(' '),
                status: 'Ativo'
            };
        }

        // Fallback Regex
        const cpfMatch = cleaned.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/) || cleaned.match(/\d{11}/);
        const cpf = cpfMatch ? cpfMatch[0] : '';
        let name = '';
        if (cpf) {
            name = cleaned.split(cpf)[0].trim();
        }
        const dates = cleaned.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
        const moneyValues = cleaned.match(/R\$\s?[\d.,]+/g) || [];

        return {
            name: name || "Nome não identificado",
            cpf: cpf.replace(/\D/g, ''),
            phone: (cleaned.match(/\d{2}\s?\d{4,5}-?\d{4}/g) || [])[0] || '',
            phoneRef: (cleaned.match(/\d{2}\s?\d{4,5}-?\d{4}/g) || [])[1] || '',
            startDate: parseDate(dates[0]),
            endDate: parseDate(dates[1]),
            loan: parseMoney(moneyValues[0]),
            daily: parseMoney(moneyValues[1]),
            interest: parseMoney(moneyValues[2]),
            total: parseMoney(moneyValues[3]),
            paid: parseMoney(moneyValues[4]),
            fines: 0,
            observations: '',
            status: 'Ativo'
        };
    };

    if (batchBtn) {
        batchBtn.addEventListener('click', () => {
            const text = batchInput.value.trim();
            if (!text) {
                alert('Cole os dados do Excel primeiro!');
                return;
            }

            const lines = text.split('\n').filter(line => line.trim());
            let addedCount = 0;
            let errors = [];

            lines.forEach((line, idx) => {
                try {
                    const newBilling = parseExcelLineRobust(line);
                    
                    if (newBilling.name && (newBilling.total > 0 || newBilling.loan > 0)) {
                        billings.push(newBilling);
                        addedCount++;
                    } else {
                        errors.push(`Linha ${idx + 1}: Nome ou valores não encontrados`);
                    }
                } catch (e) {
                    errors.push(`Linha ${idx + 1}: ${e.message}`);
                    console.error('Erro ao processar linha:', line, e);
                }
            });

            if (addedCount > 0) {
                updateBillings();
                batchInput.value = '';
                let message = `✅ ${addedCount} cliente(s) adicionado(s) com sucesso!`;
                if (errors.length > 0) {
                    message += `\n\n⚠️ ${errors.length} linha(s) com problemas:\n${errors.slice(0, 3).join('\n')}`;
                }
                alert(message);
                tabBtns[0].click(); 
            } else {
                alert('❌ Nenhum cliente foi processado. Verifique o formato dos dados.\n\nErros:\n' + errors.join('\n'));
            }
        });
    }

    // Deletar cobrança
    window.deleteBilling = (index) => {
        if (confirm('Deseja remover esta cobrança?')) {
            billings.splice(index, 1);
            updateBillings();
        }
    };

    // Limpar lista
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Deseja limpar toda a lista?')) {
                billings = [];
                updateBillings();
            }
        });
    }

    // Copiar texto
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (billings.length === 0) return alert('A lista está vazia!');
            let text = "--- LISTA DE COBRANÇAS ESPARTANO ---\n\n";
            billings.forEach((item, index) => {
                const devendo = (item.total || 0) - (item.paid || 0);
                text += `${index + 1}. ${item.name.toUpperCase()}\n`;
                text += `   CPF: ${item.cpf || '-'}\n`;
                text += `   Telefone: ${item.phone || '-'}\n`;
                text += `   Empréstimo: ${formatCurrency(item.loan)}\n`;
                text += `   Total à Pagar: ${formatCurrency(item.total)}\n`;
                text += `   Valor Pago: ${formatCurrency(item.paid)}\n`;
                text += `   Devendo: ${formatCurrency(devendo)}\n`;
                text += `   Prazo: ${formatDate(item.startDate)} até ${formatDate(item.endDate)}\n`;
                if (item.observations) text += `   Obs: ${item.observations}\n`;
                text += `   Status: ${item.status || 'Ativo'}\n`;
                text += "-----------------------------------\n";
            });
            
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ Lista copiada para a área de transferência!');
            });
        });
    }

    // Gerar PDF
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            if (billings.length === 0) return alert('A lista está vazia!');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text("RELATÓRIO DE COBRANÇAS ESPARTANO", 14, 20);
            doc.setFontSize(10);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
            
            const tableData = billings.map((item, index) => {
                const devendo = (item.total || 0) - (item.paid || 0);
                return [
                    index + 1,
                    item.name,
                    item.cpf || '-',
                    item.phone || '-',
                    formatCurrency(item.loan),
                    formatCurrency(item.total),
                    formatCurrency(item.paid),
                    formatCurrency(devendo),
                    item.status
                ];
            });

            doc.autoTable({
                startY: 35,
                head: [['#', 'Cliente', 'CPF', 'Telefone', 'Empr.', 'Total', 'Pago', 'Devendo', 'Status']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] }
            });

            doc.save(`cobrancas_espartano_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    }

    // Gerar Word
    if (wordBtn) {
        wordBtn.addEventListener('click', () => {
            if (billings.length === 0) return alert('A lista está vazia!');
            
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = window.docx;

            const rows = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "#", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Cliente", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "CPF", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Total", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Pago", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Devendo", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Status", bold: true })] }),
                    ],
                }),
            ];

            billings.forEach((item, index) => {
                const devendo = (item.total || 0) - (item.paid || 0);
                rows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                            new TableCell({ children: [new Paragraph({ text: item.name })] }),
                            new TableCell({ children: [new Paragraph({ text: item.cpf || '-' })] }),
                            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.total) })] }),
                            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.paid) })] }),
                            new TableCell({ children: [new Paragraph({ text: formatCurrency(devendo) })] }),
                            new TableCell({ children: [new Paragraph({ text: item.status })] }),
                        ],
                    })
                );
            });

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: rows,
            });

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "RELATÓRIO DE COBRANÇAS ESPARTANO", bold: true, size: 32 })],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: "" }),
                        table,
                    ],
                }],
            });

            Packer.toBlob(doc).then((blob) => {
                saveAs(blob, `cobrancas_espartano_${new Date().toISOString().split('T')[0]}.docx`);
            });
        });
    }

    // Inicializar lista
    renderBillings();
});
