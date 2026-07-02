import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Building2, Lock, Loader2, ArrowLeft, ArrowRight, Check, ShieldCheck, Search, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import { formatCNPJ, cleanCNPJ, validateCNPJ, validatePassword, getPasswordStrength } from "@/lib/auth-helpers";
import { fetchCompanyByCNPJ } from "@/lib/cnpjLookup";
import { logAudit } from "@/lib/audit";
import { cn } from "@/lib/utils";

function getSignupErrorMessage(err) {
  const apiMessage = err?.data?.error ||
    err?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.message;

  if (apiMessage) {
    return apiMessage;
  }

  const status = err?.status || err?.response?.status;
  if (status === 409) {
    return "Este e-mail ja esta cadastrado. Faca login ou recupere sua senha.";
  }
  if (status === 400) {
    return "Nao foi possivel criar a conta. Verifique os dados informados.";
  }
  if (status === 429) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }

  return err?.message || "Erro ao criar conta. Verifique os dados e tente novamente.";
}

export default function Register() {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: CNPJ
  const [cnpj, setCnpj] = useState("");
  const [cnpjError, setCnpjError] = useState("");

  // Step 2: Company data
  const [company, setCompany] = useState({
    razao_social: "",
    nome_fantasia: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    registration_status: "",
    cnae: "",
    cnae_description: "",
    responsible_name: "",
    responsible_email: "",
    responsible_phone: "",
  });
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillTried, setAutoFillTried] = useState(false);
  const [autoFillError, setAutoFillError] = useState("");

  // Step 3: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Step 4: OTP
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const cnpjParam = searchParams.get('cnpj');
    if (cnpjParam) {
      const formatted = formatCNPJ(cnpjParam);
      setCnpj(formatted);
      if (validateCNPJ(formatted)) {
        handleCnpjContinue(formatted);
      }
    }
  }, []);

  const handleCnpjContinue = async (cnpjValue) => {
    const cnpjToCheck = cnpjValue || cnpj;
    setCnpjError("");
    setError("");

    if (!validateCNPJ(cnpjToCheck)) {
      setCnpjError("CNPJ inválido. Verifique o número digitado.");
      return;
    }

    setLoading(true);
    try {
      const existing = await base44.entities.Tenant.filter({ cnpj: cleanCNPJ(cnpjToCheck) });
      if (existing && existing.length > 0) {
        setCnpjError("Este CNPJ ja esta cadastrado. Faca login ou recupere sua senha.");
        setLoading(false);
        return;
      }
    } catch {
      // A checagem client-side pode ser limitada por ACL/RLS antes do login.
      // A validacao definitiva de duplicidade ocorre em registerTenant.
    }

    setStep(2);
    autoFillCompanyData(cleanCNPJ(cnpjToCheck));
    setLoading(false);
  };
  const autoFillCompanyData = async (cleanCnpj) => {
    setAutoFilling(true);
    setAutoFillTried(true);
    setAutoFillError("");
    try {
      const result = await fetchCompanyByCNPJ(cleanCnpj);

      if (result) {
        setCompany(prev => ({
          ...prev,
          razao_social: result.razao_social || prev.razao_social,
          nome_fantasia: result.nome_fantasia || prev.nome_fantasia,
          address: result.address || prev.address,
          city: result.city || prev.city,
          state: result.state || prev.state,
          zip_code: result.zip_code || prev.zip_code,
          registration_status: result.registration_status || prev.registration_status,
          cnae: result.cnae || prev.cnae,
          cnae_description: result.cnae_description || prev.cnae_description,
        }));
      }
    } catch (err) {
      setAutoFillError(err.message || "Nao foi possivel buscar os dados automaticamente. Preencha manualmente.");
    } finally {
      setAutoFilling(false);
    }
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!company.razao_social.trim()) {
      setError("Informe a razão social da empresa.");
      return;
    }
    if (!company.responsible_name.trim()) {
      setError("Informe o nome do responsável.");
      return;
    }
    if (!company.responsible_email.trim()) {
      setError("Informe o e-mail do responsável.");
      return;
    }
    setStep(3);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await base44.auth.register({ email: company.responsible_email, password });
      setStep(4);
    } catch (err) {
      const message = getSignupErrorMessage(err);
      setError(message);
      setPasswordError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: company.responsible_email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);

        const registerRes = await fetch('/api/functions/registerTenant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cnpj: cleanCNPJ(cnpj),
            company,
          }),
        });
        const registerPayload = await registerRes.json().catch(() => ({}));
        if (!registerRes.ok) {
          throw new Error(registerPayload.error || 'Nao foi possivel salvar os dados da farmacia.');
        }
        const tenant = registerPayload.tenant;
        if (!tenant?.id || !registerPayload.pharmacySettings?.id) {
          throw new Error('Cadastro incompleto: Tenant ou configuracoes da farmacia nao foram salvos.');
        }
        await logAudit('login', `Nova farmácia cadastrada: ${company.razao_social} (CNPJ: ${cleanCNPJ(cnpj)})`, {
          tenant_id: tenant.id, tenant_name: company.razao_social,
        });

        window.location.href = "/welcome";
      }
    } catch (err) {
      setError(err.message || "Código de verificação inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(company.responsible_email);
    } catch {
      setError("Erro ao reenviar código.");
    }
  };

  const strength = getPasswordStrength(password);

  if (step === 4) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código para ${company.responsible_email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
          ) : (
            "Verificar e ativar conta"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button>
        </p>
      </AuthLayout>
    );
  }

  if (step === 3) {
    return (
      <AuthLayout
        icon={Lock}
        title="Crie sua senha"
        subtitle="Sua senha deve ser segura"
        footer={
          <button onClick={() => setStep(2)} className="text-primary font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar
          </button>
        }
      >
        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{passwordError}</div>
        )}
        {error && !passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput id="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              autoComplete="new-password" autoFocus />

            {password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all", strength.color)} style={{ width: `${(strength.score / 6) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12">{strength.label}</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Senha</Label>
            <PasswordInput id="confirm" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password" />

          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Sua senha deve conter:</p>
            <Requirement met={password.length >= 8} text="Pelo menos 8 caracteres" />
            <Requirement met={/[A-Z]/.test(password)} text="Uma letra maiúscula" />
            <Requirement met={/[a-z]/.test(password)} text="Uma letra minúscula" />
            <Requirement met={/[0-9]/.test(password)} text="Um número" />
            <Requirement met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)} text="Um caractere especial" />
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</> : "Criar conta"}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 2) {
    return (
      <AuthLayout
        icon={Building2}
        title="Dados da Farmácia"
        subtitle={autoFilling ? "Buscando dados públicos..." : "Confirme os dados da sua empresa"}
        footer={
          <button onClick={() => setStep(1)} className="text-primary font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar
          </button>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">CNPJ:</span>
          <span className="font-medium text-foreground">{cnpj}</span>
        </div>

        {autoFilling && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-700">
            <Search className="w-4 h-4 animate-pulse" />
            Buscando dados públicos da empresa...
          </div>
        )}

        {autoFillTried && !autoFilling && !company.razao_social && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4" />
            {autoFillError || "Nao foi possivel obter dados automaticamente. Preencha manualmente."}
          </div>
        )}

        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="razao">Razão Social *</Label>
            <Input id="razao" value={company.razao_social} autoFocus
              onChange={(e) => setCompany({ ...company, razao_social: e.target.value })}
              placeholder="Razão social da empresa" className="h-12" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fantasia">Nome Fantasia</Label>
            <Input id="fantasia" value={company.nome_fantasia}
              onChange={(e) => setCompany({ ...company, nome_fantasia: e.target.value })}
              placeholder="Nome fantasia (opcional)" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">EndereÃ§o</Label>
            <Input id="address" value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              placeholder="EndereÃ§o da farmÃ¡cia" className="h-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={company.city}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                placeholder="Cidade" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={company.state}
                onChange={(e) => setCompany({ ...company, state: e.target.value })}
                placeholder="UF" className="h-12" maxLength={2} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="zip">CEP</Label>
              <Input id="zip" value={company.zip_code}
                onChange={(e) => setCompany({ ...company, zip_code: e.target.value })}
                placeholder="00000-000" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">SituaÃ§Ã£o cadastral</Label>
              <Input id="status" value={company.registration_status}
                onChange={(e) => setCompany({ ...company, registration_status: e.target.value })}
                placeholder="Ativa" className="h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnae">CNAE</Label>
            <Input id="cnae" value={company.cnae_description || company.cnae}
              onChange={(e) => setCompany({ ...company, cnae_description: e.target.value })}
              placeholder="Atividade principal" className="h-12" />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-3">Dados do Responsável</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resp">Nome do Responsável *</Label>
                <Input id="resp" value={company.responsible_name}
                  onChange={(e) => setCompany({ ...company, responsible_name: e.target.value })}
                  placeholder="Nome completo" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={company.responsible_email}
                  onChange={(e) => setCompany({ ...company, responsible_email: e.target.value })}
                  placeholder="responsavel@farmacia.com" className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={company.responsible_phone}
                  onChange={(e) => setCompany({ ...company, responsible_phone: e.target.value })}
                  placeholder="(00) 00000-0000" className="h-12" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            Continuar <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // Step 1: CNPJ
  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar Conta"
      subtitle="Comece grátis por 14 dias"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </>
      }
    >
      {cnpjError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{cnpjError}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleCnpjContinue(); }} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ da Farmácia</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="cnpj" type="text" autoFocus placeholder="00.000.000/0000-00"
              value={cnpj} onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjError(""); }}
              className="pl-10 h-12" required />
          </div>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium text-accent-dark mb-1">✓ Período de teste gratuito</p>
          <p>Aproveite todas as funcionalidades por 14 dias. Sem cartão de crédito.</p>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || cnpj.length < 18}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</> : "Começar cadastro"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function Requirement({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? <Check className="w-3.5 h-3.5 text-accent" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />}
      <span className={met ? "text-accent-dark" : ""}>{text}</span>
    </div>
  );
}
