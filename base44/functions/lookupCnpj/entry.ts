function cleanCnpj(value: string) {
  return (value || '').replace(/\D/g, '');
}

function isValidCnpj(value: string) {
  const cnpj = cleanCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string) => {
    let pos = base.length - 7;
    let sum = 0;
    for (let i = base.length; i >= 1; i--) {
      sum += Number(base.charAt(base.length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return String(result);
  };

  const first = calcDigit(cnpj.substring(0, 12));
  const second = calcDigit(cnpj.substring(0, 12) + first);
  return cnpj.endsWith(first + second);
}

function onlyText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildAddress(data: Record<string, unknown>) {
  return [
    data.descricao_tipo_de_logradouro,
    data.logradouro,
    data.numero,
    data.complemento,
    data.bairro,
  ].map(onlyText).filter(Boolean).join(', ');
}

function mapBrasilApiCompany(data: Record<string, unknown>) {
  return {
    razao_social: onlyText(data.razao_social),
    nome_fantasia: onlyText(data.nome_fantasia),
    address: buildAddress(data),
    city: onlyText(data.municipio),
    state: onlyText(data.uf),
    zip_code: onlyText(data.cep),
    registration_status: onlyText(data.descricao_situacao_cadastral) || onlyText(data.situacao_cadastral),
    cnae: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
    cnae_description: onlyText(data.cnae_fiscal_descricao),
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const cnpj = cleanCnpj(String(body.cnpj || ''));
    if (!isValidCnpj(cnpj)) {
      return Response.json({ error: 'CNPJ invalido.' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return Response.json({
        error: 'Nao foi possivel consultar os dados publicos do CNPJ.',
        status: response.status,
      }, { status: 502 });
    }

    const company = mapBrasilApiCompany(await response.json());
    return Response.json({ company });
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Consulta ao CNPJ demorou demais. Preencha manualmente.'
      : 'Nao foi possivel consultar os dados publicos do CNPJ.';
    return Response.json({ error: message }, { status: 502 });
  }
});
