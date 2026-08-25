export interface EnderecoViaCep {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string; // cidade
    uf: string;
    ibge?: string;
    gia?: string;
    ddd?: string;
    siafi?: string;
    erro?: boolean;
}

/**
 * Consulta o ViaCEP e retorna o endereço formatado.
 * Não precisa de chave de API.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
    // Remove tudo que não for número
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        throw new Error("CEP deve conter 8 dígitos");
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

        if (!response.ok) {
            throw new Error("Erro ao consultar o CEP");
        }

        const data: EnderecoViaCep = await response.json();

        if (data.erro) {
            return null; // CEP não encontrado
        }

        return data;
    } catch (error) {
        console.error("Erro no cepService:", error);
        throw new Error("Não foi possível consultar o CEP. Tente novamente.");
    }
}

/**
 * Formata o CEP para o padrão 00000-000
 */
export function formatarCep(cep: string): string {
    const numeros = cep.replace(/\D/g, "").slice(0, 8);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}