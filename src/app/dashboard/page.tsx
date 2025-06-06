
"use client";

import { useEffect, useState } from 'react';
import { AppHeader } from "@/components/layout/header";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, FileText, History, Eye, BarChart3, ShieldCheck, Trash2 } from "lucide-react";
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client'; 
import type { AnalysisRecord as AnalysisRecordType } from '@/types/ai-schemas';


interface AnalysisRecordDisplay extends Omit<AnalysisRecordType, 'full_report_data' | 'user_id' | 'report_summary'> {
  id: string; 
  created_at: string; 
}

export default function DashboardPage() {
  const { user, isLoading: authIsLoading, session, userProfile, isPremium } = useAuth();
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecordDisplay[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [errorRecords, setErrorRecords] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysisRecords = async () => {
      if (!user || !session) {
        setIsLoadingRecords(false);
        return;
      }

      setIsLoadingRecords(true);
      setErrorRecords(null);
      
      const { data, error } = await supabase
        .from('analysis_records')
        .select('id, created_at, analysis_type, target_description, overall_risk_assessment, vulnerable_findings_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error al obtener registros de análisis:", error);
        setErrorRecords(`Error al cargar el historial: ${error.message}`);
        setAnalysisRecords([]);
      } else {
        setAnalysisRecords(data as AnalysisRecordDisplay[] || []);
        if (data && data.length === 0) {
            setErrorRecords("No tienes análisis guardados todavía. ¡Realiza tu primer análisis!");
        }
      }
      setIsLoadingRecords(false);
    };

    if (!authIsLoading && session) { 
      fetchAnalysisRecords();
    } else if (!authIsLoading && !session) {
        setIsLoadingRecords(false);
        setErrorRecords("Debes iniciar sesión para ver tu historial de análisis.");
    }
  }, [user, authIsLoading, session]);

  if (authIsLoading) { 
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 md:py-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Cargando tu dashboard...</p>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">Debes iniciar sesión para acceder a tu dashboard y ver tu historial de análisis.</p>
          <Button asChild>
            <Link href="/login?redirect=/dashboard">Iniciar Sesión</Link>
          </Button>
        </main>
      </div>
    );
  }
  
  const getRiskBadgeVariant = (risk?: string): "destructive" | "outline" | "default" | "secondary" => {
    switch (risk?.toLowerCase()) {
        case 'critical':
        case 'high':
            return 'destructive';
        case 'medium':
            return 'outline'; 
        case 'low':
            return 'secondary'; 
        case 'informational':
        default:
            return 'default'; 
    }
  };

  const getRiskBadgeClass = (risk?: string): string => {
     switch (risk?.toLowerCase()) {
        case 'critical':
        case 'high':
            return 'bg-destructive/80 border-destructive text-destructive-foreground';
        case 'medium':
            return 'border-orange-500 text-orange-500 dark:border-orange-400 dark:text-orange-400';
        case 'low':
            return 'border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-500';
        case 'informational':
        default:
            return 'bg-blue-500/80 border-blue-600 text-primary-foreground';
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <section className="mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center">
                <History className="mr-3 h-8 w-8 text-primary" />
                Dashboard de Análisis
              </h1>
              <div className="text-lg text-muted-foreground mt-1">
                Bienvenido, {userProfile?.full_name || user?.email?.split('@')[0] || 'Usuario'}. Aquí puedes ver y gestionar tus análisis de seguridad.
              </div>
            </div>
            <Button asChild className="mt-4 sm:mt-0">
                <Link href="/"><FileText className="mr-2 h-4 w-4"/> Realizar Nuevo Análisis</Link>
            </Button>
          </div>
        </section>

        <Card className="shadow-xl border border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Historial de Análisis</CardTitle>
            <CardDescription>
              Aquí se muestran los análisis que has realizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecords && (
                 <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Cargando historial...</p>
                </div>
            )}
            {!isLoadingRecords && errorRecords && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300" role="alert">
                <div className="flex">
                  <div className="py-1"><AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400 mr-3" /></div>
                  <div>
                    <p className="font-bold">Notificación</p>
                    <p className="text-sm">{errorRecords}</p>
                  </div>
                </div>
              </div>
            )}
            {!isLoadingRecords && !errorRecords && analysisRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo de Análisis</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Riesgo General</TableHead>
                    <TableHead className="text-center">Hallazgos Vulnerables</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                      <TableCell><Badge variant="secondary">{record.analysis_type || 'N/A'}</Badge></TableCell>
                      <TableCell className="truncate max-w-xs">{record.target_description}</TableCell>
                      <TableCell>
                        {record.overall_risk_assessment ? (
                           <Badge variant={getRiskBadgeVariant(record.overall_risk_assessment)} className={getRiskBadgeClass(record.overall_risk_assessment)}>
                            {record.overall_risk_assessment}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.vulnerable_findings_count !== undefined ? (
                            <Badge variant={record.vulnerable_findings_count > 0 ? "destructive" : "default"}
                                   className={record.vulnerable_findings_count > 0 ? "" : "bg-green-600/80 border-green-700 text-primary-foreground"}>
                                {record.vulnerable_findings_count}
                            </Badge>
                        ): (
                             <Badge variant="secondary">N/A</Badge>
                        )}
                        </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" disabled> {/* TODO: Implementar vista de detalle */}
                          <Eye className="mr-2 h-4 w-4" /> Ver (Próximamente)
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              !isLoadingRecords && !errorRecords && analysisRecords.length === 0 && <p className="text-muted-foreground">Aún no tienes análisis guardados.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8 shadow-lg border-border">
            <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center"><BarChart3 className="mr-2 h-5 w-5"/>Estadísticas Generales (Próximamente)</CardTitle>
                <CardDescription>Resumen visual de tu postura de seguridad.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Aquí se mostrarían gráficos y métricas sobre los tipos de vulnerabilidades más comunes encontradas, tendencias de riesgo, etc.</p>
            </CardContent>
        </Card>

         <Card className="mt-8 shadow-lg border-border">
            <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center"><ShieldCheck className="mr-2 h-5 w-5"/>Gestión de Suscripción (Próximamente)</CardTitle>
                 <CardDescription>Gestiona tu plan y detalles de facturación.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-muted-foreground">Tu estado actual de suscripción: {isPremium ? <Badge className="ml-2 bg-green-500 text-white">Premium Activa</Badge> : <Badge variant="outline" className="ml-2">Gratuita</Badge>}</div>
                <p className="text-sm text-muted-foreground mt-2">Aquí podrás cambiar tu plan, ver historial de pagos, etc.</p>
            </CardContent>
        </Card>

      </main>
      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border bg-card">
        <p>© {new Date().getFullYear()} Centro de Análisis de Seguridad Integral. Todos los derechos reservados.</p>
        <p className="mb-2">Idea y Visión: Ronald Gonzalez Niche</p>
        <div className="space-x-3">
          <Link href="/terms" className="text-xs text-primary hover:underline"> Términos y Condiciones </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/privacy" className="text-xs text-primary hover:underline"> Política de Privacidad </Link>
        </div>
      </footer>
    </div>
  );
}

