export interface OpcaoFrete {
    id: string;
    nome: string;
    prazo: string;
    preco: number;
    gratis?: boolean;
}

export interface ResultadoFrete {
    sucesso: boolean;
    opcoes: OpcaoFrete[];
    mensagem?: string;
}

/**
 * Simulação de cálculo de frete.
 * 
 * HOJE → Retorna dados fictícios realistas
 * AMANHÃ → Só troque o miolo desta função pela API real (Melhor Envio / Correios)
 */
export async function calcularFrete(cep: string, valorCarrinho: number = 0): Promise<ResultadoFrete> {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        return {
            sucesso: false,
            opcoes: [],
            mensagem: "CEP inválido. Digite um CEP com 8 dígitos.",
        };
    }

    // Simula um pequeno delay de rede
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Lógica simples de região baseada no início do CEP
    const prefixo = parseInt(cepLimpo.substring(0, 2));

    let opcoes: OpcaoFrete[] = [];

    // Região Sudeste (SP, RJ, MG, ES) → frete mais barato
    if (prefixo >= 1 && prefixo <= 39) {
        opcoes = [
            {
                id: "pac",
                nome: "PAC",
                prazo: "6 a 10 dias úteis",
                preco: valorCarrinho >= 299 ? 0 : 18.90,
                gratis: valorCarrinho >= 299,
            },
            {
                id: "sedex",
                nome: "SEDEX",
                prazo: "2 a 4 dias úteis",
                preco: 29.90,
            },
            {
                id: "sedex10",
                nome: "SEDEX 10",
                prazo: "1 dia útil (até 10h)",
                preco: 49.90,
            },
        ];
    }
    // Sul e Centro-Oeste
    else if ((prefixo >= 80 && prefixo <= 99) || (prefixo >= 70 && prefixo <= 79)) {
        opcoes = [
            {
                id: "pac",
                nome: "PAC",
                prazo: "8 a 14 dias úteis",
                preco: valorCarrinho >= 399 ? 0 : 24.90,
                gratis: valorCarrinho >= 399,
            },
            {
                id: "sedex",
                nome: "SEDEX",
                prazo: "3 a 6 dias úteis",
                preco: 36.90,
            },
        ];
    }
    // Norte e Nordeste
    else {
        opcoes = [
            {
                id: "pac",
                nome: "PAC",
                prazo: "12 a 20 dias úteis",
                preco: valorCarrinho >= 499 ? 0 : 34.90,
                gratis: valorCarrinho >= 499,
            },
            {
                id: "sedex",
                nome: "SEDEX",
                prazo: "5 a 9 dias úteis",
                preco: 52.90,
            },
        ];
    }

    return {
        sucesso: true,
        opcoes,
    };
}