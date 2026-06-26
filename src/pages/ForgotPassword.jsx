import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { formatCNPJ, cleanCNPJ, validateCNPJ, maskEmail } from "@/lib/auth-helpers";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [cnpj, setCnpj] = useState("");
  const [cnpjError, setCnpjError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCnpjSubmit = async (e) => {
    e.preventDefault();
    setCnpjError("");

    if (!validateCNPJ(cnpj)) {
      setCnpjError("CNPJ inválido.");
      return;
    }

    setLoading(true);
    try {
      const tenants = await base44.entities.Tenant.filter({ cnpj: cleanCNPJ(cnpj) });
      if (tenants && tenants.length > 0 && tenants[0].responsible_email) {
        setEmail(tenants[0].responsible_email);
        setStep(2);
      } else {
        // Generic success to prevent CNPJ enumeration
        setSent(true);
      }
    } catch {
      setCnpjError("Erro ao verificar CNPJ. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Link enviado"
        subtitle="Verifique seu e-mail"
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar para o login
          </Link>
        }
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <p className="text-sm text-foreground">
            Enviamos um link de recuperação para o e-mail cadastrado.
          </p>
          <p className="text-xs text-muted-foreground">
            Se não receber em alguns minutos, verifique a pasta de spam ou tente novamente.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (step === 2) {
    return (
      <AuthLayout
        icon={Mail}
        title="Confirmar e-mail"
        subtitle="Confirme o e-mail para receber o link"
        footer={
          <button onClick={() => setStep(1)} className="text-primary font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar
          </button>
        }
      >
        <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">CNPJ:</span>
          <span className="font-medium text-foreground">{cnpj}</span>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail cadastrado</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} readOnly
                className="pl-10 h-12 bg-muted/50" />
            </div>
            <p className="text-xs text-muted-foreground">Envie o link de recuperação para este e-mail.</p>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              <>Enviar link de recuperação <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Recuperar senha"
      subtitle="Informe o CNPJ da sua farmácia"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar para o login
        </Link>
      }
    >
      {cnpjError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{cnpjError}</div>
      )}

      <form onSubmit={handleCnpjSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="cnpj" type="text" autoFocus placeholder="00.000.000/0000-00"
              value={cnpj} onChange={(e) => { setCnpj(formatCNPJ(e.target.value)); setCnpjError(""); }}
              className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || cnpj.length < 18}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
          ) : (
            <>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}