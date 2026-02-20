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
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

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
        if (!value || isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Formatar data
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        if (dateStr.includes('/')) return dateStr; // Já está formatada
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Converter data do Excel (DD/MM/YYYY) para formato do input (YYYY-MM-DD)
    const convertExcelDate = (dateStr) => {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    };

    // Limpar valor monetário (R$ 1.500,00 -> 1500.00)
    const cleanCurrency = (value) => {
        if (!value) return 0;
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
        billingList.innerHTML = '';
        if (billings.length === 0) {
            billingList.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--muted);">Nenhum cliente adicionado</td></tr>';
            return;
        }
        billings.forEach((item, index) => {
            const devendo = (item.total || 0) - (item.paid || 0);
            
            let statusClass = '';
            if (item.status === 'Pago') statusClass = 'status-pago';
            else if (item.status === 'Vencido') statusClass = 'status-vencido';
            else if (item.status === 'Cancelado') statusClass = 'status-cancelado';

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
                        <option value="Pago" ${item.status === 'Acordo' ? 'selected' : ''}>Acordo</option>
                        <option value="Vencido" ${item.status === 'Vermelho' ? 'selected' : ''}>Vermelho</option>
                        <option value="Cancelado" ${item.status === 'Amarelado' ? 'selected' : ''}>Amarelado</option>
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

    const parseExcelLine = (line) => {
        const cleaned = line.replace(/^\d+x:\s*/, '').trim(); // Remove "1x:", "2x:", etc
        
        const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}/;
        const phoneRegex = /\d{2}\s\d{4,5}-\d{4}/g;
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;
        const currencyRegex = /R\$\s*[\d.,]+/g;
        
        // Extrair CPF
        const cpfMatch = cleaned.match(cpfRegex);
        const cpf = cpfMatch ? cpfMatch[0] : '';
        
        // Extrair telefones
        const phones = cleaned.match(phoneRegex) || [];
        const phone = phones[0] || '';
        const phoneRef = phones[1] || '';
        
        // Extrair datas
        const dates = cleaned.match(dateRegex) || [];
        const startDate = dates[0] || '';
        const endDate = dates[1] || '';
        
        // Extrair valores monetários
        const currencies = cleaned.match(currencyRegex) || [];
        const loan = currencies[0] || '';
        const daily = currencies[1] || '';
        const interest = currencies[2] || '';
        const total = currencies[3] || '';
        const paid = currencies[4] || '';
        const fines = currencies[5] || '';
        
        // Extrair nome (tudo antes do CPF)
        const nameEndIndex = cleaned.indexOf(cpf);
        const name = nameEndIndex > 0 ? cleaned.substring(0, nameEndIndex).trim() : '';
        
        // Extrair observações e status (tudo após os valores monetários)
        let observations = '';
        let status = 'Ativo';
        
        if (currencies.length > 0) {
            const lastCurrencyIndex = cleaned.lastIndexOf(currencies[currencies.length - 1]);
            const remaining = cleaned.substring(lastCurrencyIndex + currencies[currencies.length - 1].length).trim();
            
            if (remaining) {
                const statusKeywords = ['Amarelado', 'Vermelho', 'Acordo', 'Ativo'];
                const foundStatus = statusKeywords.find(s => remaining.includes(s));
                if (foundStatus) {
                    status = foundStatus;
                    observations = remaining.replace(foundStatus, '').trim();
                } else {
                    observations = remaining;
                }
            }
        }
        
        return {
            name,
            cpf,
            phone,
            phoneRef,
            startDate: convertExcelDate(startDate),
            endDate: convertExcelDate(endDate),
            loan: cleanCurrency(loan),
            daily: cleanCurrency(daily),
            interest: cleanCurrency(interest),
            total: cleanCurrency(total),
            paid: cleanCurrency(paid),
            fines: cleanCurrency(fines),
            observations,
            status
        };
    };

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
                const newBilling = parseExcelLine(line);
                
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
            tabBtns[0].click(); // Volta para a aba de lista
        } else {
            alert('❌ Nenhum cliente foi processado. Verifique o formato dos dados.\n\nErros:\n' + errors.join('\n'));
        }
    });

    // Deletar cobrança
    window.deleteBilling = (index) => {
        if (confirm('Deseja remover esta cobrança?')) {
            billings.splice(index, 1);
            updateBillings();
        }
    };

    // Copiar texto
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

    // Gerar PDF
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
                item.status || 'Ativo'
            ];
        });

        doc.autoTable({
            startY: 35,
            head: [['#', 'Cliente', 'CPF', 'Telefone', 'Empréstimo', 'Total', 'Pago', 'Devendo', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });

        doc.save(`cobrancas_espartano_${new Date().toLocaleDateString()}.pdf`);
    });

    // Gerar Word (Docx)
    wordBtn.addEventListener('click', () => {
        if (billings.length === 0) return alert('A lista está vazia!');
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } = docx;

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "#", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Cliente", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "CPF", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Telefone", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Empréstimo", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Total", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Pago", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Devendo", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Status", bold: true })] }),
                ]
            })
        ];

        billings.forEach((item, index) => {
            const devendo = (item.total || 0) - (item.paid || 0);
            tableRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: item.name })] }),
                    new TableCell({ children: [new Paragraph({ text: item.cpf || '-' })] }),
                    new TableCell({ children: [new Paragraph({ text: item.phone || '-' })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(item.loan) })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(item.total) })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(item.paid) })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(devendo) })] }),
                    new TableCell({ children: [new Paragraph({ text: item.status || 'Ativo' })] }),
                ]
            }));
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ 
                        text: "RELATÓRIO DE COBRANÇAS ESPARTANO", 
                        heading: HeadingLevel.HEADING_1, 
                        alignment: AlignmentType.CENTER 
                    }),
                    new Paragraph({ 
                        text: `Data: ${new Date().toLocaleDateString('pt-BR')}`, 
                        alignment: AlignmentType.CENTER 
                    }),
                    new Paragraph({ text: "" }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: tableRows
                    })
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `cobrancas_espartano_${new Date().toLocaleDateString()}.docx`);
        });
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja apagar toda a lista?')) {
            billings = [];
            updateBillings();
        }
    });

    renderBillings();
});
