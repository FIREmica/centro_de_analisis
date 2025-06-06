
"use client"; // This directive stays for the Suspense wrapper and fallback

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams will be used in SignupPageContent
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus, Facebook } from "lucide-react"; // Added UserPlus and Facebook back

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

// Fallback component to show while the actual content is loading
function SignupPageFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando formulario de registro...</p>
    </div>
  );
}

// This component contains all the actual signup logic and uses useSearchParams
function SignupPageContent() {
  const searchParams = useSearchParams(); // Moved here
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
    // get "redirect" query param
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
      console.warn("SignupPageContent: Facebook App ID no está configurado.");
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

  const getPremiumStatusForToast = async (userId: string): Promise<boolean> => {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    if (profile && !profileError) {
      const premiumStatuses = ["active_premium", "premium_monthly", "premium_yearly", "active"];
      return premiumStatuses.some(status =>
        profile.subscription_status?.toLowerCase().includes(status)
      );
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        description = `Error de Supabase: ${error.message}. Verifique:
        1. Que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local sean correctas.
        2. Que haya REINICIADO su servidor de desarrollo (npm run dev) después de guardar .env.local.
        3. Su conexión a internet y acceso a la URL de Supabase.`;
      } else if (error.message.toLowerCase().includes("captcha verification process failed")) {
        title = "Error de CAPTCHA de Supabase";
        description = `Supabase rechazó el registro por CAPTCHA. 
        **Solución Posible:** En la configuración de tu proyecto Supabase (Autenticación -> Configuración), asegúrate de que la "Protección con CAPTCHA" esté DESACTIVADA y guarda los cambios. Este proyecto actualmente no implementa un CAPTCHA frontend compatible con esa configuración de Supabase. Contacta al administrador de la plataforma si el problema persiste.`;
      } else if (error.message.toLowerCase().includes("database error saving new user")) {
        title = "Error de Base de Datos al Guardar Usuario";
        description = `Supabase reportó: "${error.message}". Esto usualmente indica un problema con la configuración de la base de datos, como la tabla 'user_profiles' o el trigger 'handle_new_user'. 
        **Acciones Sugeridas:**
        1. Verifique que haya ejecutado COMPLETAMENTE el script SQL proporcionado en el archivo README.md en el Editor SQL de su proyecto Supabase.
        2. Revise los logs de su base de datos en el panel de Supabase (Database > Logs) para errores más específicos en el momento del registro.
        3. Asegúrese de que el correo electrónico no esté ya registrado de forma parcial.`;
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
        description: "Tu cuenta ha sido creada. Si la configuración de Supabase lo requiere, revisa tu correo electrónico para confirmar tu cuenta. Luego podrás iniciar sesión.",
        variant: "default",
        duration: 7000,
      });
      router.push('/login');
    } else {
      toast({
        variant: "destructive",
        title: "Error de Registro Inesperado",
        description: "Ocurrió un problema inesperado durante el registro. Por favor, inténtalo de nuevo.",
      });
    }
    setIsLoading(false);
  };

  const handleFacebookLogin = async () => {
    setIsLoadingFacebook(true);

    if (!isFbSdkReady || !window.FB || typeof window.FB.login !== "function") {
      toast({
        variant: "destructive",
        title: "Error de Facebook Login",
        description: "El SDK de Facebook no está listo o no se pudo inicializar.",
      });
      setIsLoadingFacebook(false);
      return;
    }

    window.FB.login(async (response: any) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        try {
          const res = await fetch("/api/auth/facebook", { // This is the GET endpoint for initiating
            method: "GET", // Changed to GET for the initial redirect
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error del servidor al iniciar autenticación con Facebook.");
          if (data.url) { // If Supabase provided a redirect URL
            window.location.href = data.url; // Redirect the user to Facebook
          } else {
            // This block might be hit if /api/auth/facebook is changed to POST and expects a token,
            // which is the alternative flow. For now, direct Supabase OAuth is simpler.
            // Or if Supabase SDK direct call is preferred:
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: 'facebook',
              options: {
                redirectTo: `${window.location.origin}/auth/callback`
              }
            });
            if (oauthError) throw oauthError;
          }
        } catch (err: any) {
          toast({
            variant: "destructive",
            title: "Error de Autenticación con Facebook",
            description: err.message,
          });
          setIsLoadingFacebook(false);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Inicio de sesión cancelado",
          description: "No se completó el inicio con Facebook.",
        });
        setIsLoadingFacebook(false);
      }
    }, { scope: "email,public_profile" });
  };
  
  if (authIsLoading && !session) { // Show loader if auth state is loading AND there's no session yet
     return <SignupPageFallback />; // Use the same fallback for initial auth check
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

// Default export for the page route
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}

    