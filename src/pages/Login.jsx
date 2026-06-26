import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Building2, Lock, Loader2, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { formatCNPJ, cleanCNPJ, validateCNPJ, maskEmail } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";

export default function Login() {
  const [step, setStep] = useState(1);
  const [cnpj, setCnpj] = useState("");
  const [cnpjError, setCnpjError] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCnpj, setCheckingCnpj] = useState(false);

  const handleCnpjSubmit = async (e) => {
    e.preventDefault();
    setCnpjError("");
    setError("");

    if (!validateCNPJ(cnpj)) {
      setCnpjError("CNPJ inválido. Verifique o número digitado.");
      return;
    }

    setCheckingCnpj(true);
    try {
      const tenants = await base44.entities.Tenant.filter({ cnpj: cleanCNPJ(cnpj) });
      if (tenants && tenants.length > 0) {
        const tenant = tenants[0];
        setTenantEmail(tenant.responsible_email || "");
        setTenantName(tenant.name || "");
        if (!tenant.responsible_email) {
          setError("Não foi possível encontrar o e-mail cadastrado para este CNPJ. Entre em contato com o suporte.");
          setCheckingCnpj(false);
          return;
        }
        if (tenant.subscription_status === 'blocked' || tenant.is_suspended) {
          setError("Esta conta está bloqueada. Entre em contato com o suporte para regularizar.");
          setCheckingCnpj(false);
          return;
        }
        setStep(2);
      } else {
        setCnpjError("CNPJ não encontrado. Deseja criar uma nova conta?");
        setCheckingCnpj(false);
      }
    } catch {
      setCnpjError("Erro ao verificar CNPJ. Tente novamente.");
    } finally {
      setCheckingCnpj(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(tenantEmail, password);
      await logAudit('login', `Login realizado via CNPJ: ${tenantName}`);
      window.location.href = "/";
    } catch (err) {
      setError("Senha incorreta. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Acessar Plataforma"
      subtitle="Entre com o CNPJ da sua farmácia"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleCnpjSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ da Farmácia</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="cnpj"
                type="text"
                autoFocus
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjError(""); }}
                className="pl-10 h-12"
                required
              />
            </div>
            {cnpjError && (
              <p className="text-sm text-destructive">{cnpjError}</p>
            )}
            {cnpjError && cnpjError.includes("não encontrado") && (
              <Link to={`/register?cnpj=${cleanCNPJ(cnpj)}`}
                className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                Criar conta com este CNPJ <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={checkingCnpj || cnpj.length < 18}>
            {checkingCnpj ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-foreground">{tenantName}</span>
            </div>
            <p className="text-xs text-muted-foreground">CNPJ: {cnpj}</p>
            <p className="text-xs text-muted-foreground">E-mail: {maskEmail(tenantEmail)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !password}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
          <button
            type="button"
            onClick={() => { setStep(1); setPassword(""); setError(""); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>
          <div className="text-center">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
        </form>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Conexão segura e criptografada</span>
      </div>
    </AuthLayout>
  );
}