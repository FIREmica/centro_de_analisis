
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Facebook } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function SignupFormFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando formulario de registro...</p>
    </div>
  );
}

export function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading: authIsLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [isFbSdkReady, setIsFbSdkReady] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    setRedirectUrl(redirect || "/");
  }, [searchParams]);

  useEffect(() => {
    if (!authIsLoading && session) {
      router.replace(redirectUrl);
    }
  }, [session, authIsLoading, router, redirectUrl]);

  useEffect(() => {
    const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!facebookAppId || facebookAppId === "TU_FACEBOOK_APP_ID_AQUI") {
      console.warn("SignupForm: Facebook App ID no está configurado.");
      setIsFbSdkReady(false);
      return;
    }

    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: true,
          version: "v19.0",
        });
        setIsFbSdkReady(true);
      }
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/es_LA/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    } else if (window.FB && typeof window.FB.init === "function" && !isFbSdkReady) {
      window.fbAsyncInit();
    }
  }, [isFbSdkReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast({ variant: "destructive", title: "Error", description: "Servicio de autenticación no disponible." });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      let title = "Error de Registro";
      let description = error.message || "No se pudo completar el registro.";

      if (error.message.toLowerCase().includes("invalid api key") || error.message.toLowerCase().includes("api key error") || error.message.toLowerCase().includes("failed to fetch")) {
        title = "Error de Configuración de Supabase";
        description = `Error de Supabase: ${error.message}. Verifique su configuración de .env.local y reinicie el servidor.`;
      } else if (error.message.toLowerCase().includes("captcha verification process failed")) {
        title = "Error de CAPTCHA de Supabase";
        description = `Supabase rechazó el registro por CAPTCHA. Desactive la protección CAPTCHA en la configuración de su proyecto Supabase.`;
      } else if (error.message.toLowerCase().includes("database error saving new user")) {
        title = "Error de Base de Datos al Guardar Usuario";
        description = `Supabase reportó: "${error.message}". Verifique la tabla 'user_profiles' y el trigger 'handle_new_user'.`;
      }
      toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 15000,
      });
    } else if (data.user && data.session) {
      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta ha sido creada y has iniciado sesión. Serás redirigido.",
        variant: "default",
        duration: 3000,
      });
      await refreshUserProfile();
      router.push(redirectUrl);
    } else if (data.user) {
         toast({
            title: "Registro Casi Completo",
            description: "Tu cuenta ha sido creada. Revisa tu correo electrónico para confirmar tu cuenta.",
            variant: "default",
            duration: 7000,
        });
        router.push('/login');
    } else {
        toast({
            variant: "destructive",
            title: "Error de Registro Inesperado",
            description: "Ocurrió un problema inesperado. Por favor, inténtalo de nuevo.",
        });
    }
    setIsLoading(false);
  };

  const handleFacebookLogin = async () => {
    setIsLoadingFacebook(true);
    if (!supabase) {
      toast({ variant: "destructive", title: "Error", description: "Servicio de autenticación no disponible." });
      setIsLoadingFacebook(false);
      return;
    }

    // Use Supabase direct OAuth flow
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Ensure this matches Supabase config
      }
    });

    if (oauthError) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación con Facebook",
        description: oauthError.message,
      });
    }
    // Supabase handles redirection. If successful, user lands on callback page.
    setIsLoadingFacebook(false);
  };

  if (authIsLoading && !session) {
     return <SignupFormFallback />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Crear Cuenta
          </CardTitle>
          <CardDescription>
            Regístrate para empezar a utilizar el Centro de Análisis de Seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading || isLoadingFacebook}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading || isLoadingFacebook}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading || isLoadingFacebook}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isLoadingFacebook}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <div className="my-4 flex items-center before:flex-1 before:border-t before:border-border after:flex-1 after:border-t after:border-border">
            <p className="mx-4 text-center text-sm text-muted-foreground">O</p>
          </div>

          <Button
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
            onClick={handleFacebookLogin}
            disabled={isLoading || isLoadingFacebook || !isFbSdkReady}
          >
            <Facebook className="mr-2 h-5 w-5" />
            {isLoadingFacebook ? "Conectando..." : (isFbSdkReady ? "Registrarse con Facebook" : "Cargando Facebook...")}
          </Button>

          <div className="mt-6 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground p-3 bg-muted rounded-md">
            <strong>Nota Importante:</strong> El registro con Email/Contraseña usa Supabase Auth.
            El registro con Facebook inicia el flujo OAuth de Supabase.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    