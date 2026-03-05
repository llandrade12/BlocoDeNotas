/**
 * Sistema de Processamento de Dados Robusto para Bloco de Notas
 * Esta versão substitui a lógica de parseExcelLine por uma abordagem baseada em colunas (tabs/espaços múltiplos)
 * que é muito mais resiliente a variações de formato de CPF, Telefone e Datas.
 */

const parseExcelLineRobust = (line) => {
    // 1. Limpeza inicial: remove o índice inicial (ex: "1 ", "2 ") e espaços extras
    let cleaned = line.replace(/^\d+\s+/, '').trim();
    
    // 2. Divide a linha por tabs ou múltiplos espaços (comum ao copiar de planilhas)
    // Se não houver tabs, tenta dividir por espaços duplos ou triplos
    let parts = cleaned.split(/\t+/);
    if (parts.length < 5) {
        parts = cleaned.split(/\s{2,}/);
    }
    
    // Se ainda assim tiver poucas partes, tenta uma limpeza agressiva de espaços simples
    // mas isso pode quebrar nomes, então usamos como último recurso ou apenas para identificar campos
    
    // Mapeamento esperado baseado no exemplo do usuário:
    // 0: Nome
    // 1: CPF
    // 2: Telefone 1
    // 3: Telefone 2 (Ref)
    // 4: Data Inicial
    // 5: Data Final
    // 6: Empréstimo
    // 7: Diária
    // 8: Juros
    // 9: Total
    // 10: Pago
    
    const getPart = (idx) => (parts[idx] || '').trim();

    // Função auxiliar para limpar e validar data
    const parseDate = (dateStr) => {
        if (!dateStr) return '';
        const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            const [_, d, m, y] = match;
            return `${y}-${m}-${d}`;
        }
        return '';
    };

    // Função auxiliar para limpar valores monetários
    const parseMoney = (val) => {
        if (!val) return 0;
        // Remove R$, pontos de milhar e troca vírgula por ponto
        const clean = val.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(clean) || 0;
    };

    // Se a divisão por colunas funcionou (temos pelo menos 5 colunas)
    if (parts.length >= 5) {
        return {
            name: getPart(0),
            cpf: getPart(1).replace(/\D/g, ''), // Apenas números no CPF
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

    // Fallback: Se a linha estiver toda "grudada" ou com espaços simples (Regex melhorado)
    // Tenta identificar o CPF como âncora
    const cpfMatch = cleaned.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/) || cleaned.match(/\d{11}/);
    const cpf = cpfMatch ? cpfMatch[0] : '';
    
    let name = '';
    if (cpf) {
        name = cleaned.split(cpf)[0].trim();
    }

    // Busca datas (DD/MM/YYYY)
    const dates = cleaned.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
    
    // Busca valores monetários (R$ ...)
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

// Instruções para aplicar:
// Substitua a função parseExcelLine no script.js por esta versão robusta.
// Além disso, certifique-se de que o split das linhas no batchBtn.addEventListener use:
// const lines = text.split('\n').filter(line => line.trim());
