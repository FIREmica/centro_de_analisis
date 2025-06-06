
"use server";

import { analyzeUrlVulnerabilities } from "@/ai/flows/analyze-url-vulnerabilities";
import { analyzeServerSecurity } from "@/ai/flows/analyze-server-security";
import { analyzeDatabaseSecurity } from "@/ai/flows/analyze-database-security";
import { analyzeSastSecurity } from "@/ai/flows/analyze-sast-security";
import { analyzeDastSecurity } from "@/ai/flows/analyze-dast-security";
import { analyzeCloudConfig } from "@/ai/flows/analyze-cloud-config";
import { analyzeContainerSecurity } from "@/ai/flows/analyze-container-security";
import { analyzeDependencies } from "@/ai/flows/analyze-dependencies";
import { analyzeNetworkSecurity } from "@/ai/flows/analyze-network-security";
import { generateSecurityReport } from "@/ai/flows/generate-security-report";
import { generateAttackVectors } from "@/ai/flows/generate-attack-vectors";
import { generalQueryAssistant } from "@/ai/flows/general-query-assistant-flow";
import { generateRemediationPlaybook } from "@/ai/flows/generate-remediation-playbook";

import type {
  AnalysisResult,
  VulnerabilityFinding,
  UrlVulnerabilityAnalysisOutput,
  ServerSecurityAnalysisOutput,
  DatabaseSecurityAnalysisOutput,
  SastAnalysisOutput,
  DastAnalysisOutput,
  CloudConfigAnalysisOutput,
  ContainerAnalysisOutput,
  DependencyAnalysisOutput,
  NetworkSecurityAnalysisOutput,
  RemediationPlaybook,
  AttackVector
} from "@/types";
import type {
  GeneralQueryInput,
  GenerateSecurityReportInput,
  AnalyzeUrlVulnerabilitiesInput,
  ServerConfigInput,
  DatabaseConfigInput,
  SastAnalysisInput,
  DastAnalysisInput,
  CloudConfigInput,
  ContainerAnalysisInput,
  DependencyAnalysisInput,
  NetworkSecurityAnalysisInput,
  RemediationPlaybookInput,
  GenerateAttackVectorsOutput,
  AnalysisRecord,
} from "@/types/ai-schemas";

import { createClient } from '@/lib/supabase/server'; // For server-side Supabase in Server Actions
import { cookies } from 'next/headers';

interface PerformAnalysisParams {
  url?: string;
  serverDescription?: string;
  databaseDescription?: string;
  codeSnippet?: string;
  sastLanguage?: string;
  dastTargetUrl?: string;
  cloudProvider?: "AWS" | "Azure" | "GCP" | "Other";
  cloudConfigDescription?: string;
  cloudRegion?: string;
  containerImageName?: string;
  dockerfileContent?: string;
  kubernetesManifestContent?: string;
  containerAdditionalContext?: string;
  dependencyFileContent?: string;
  dependencyFileType?: "npm" | "pip" | "maven" | "gem" | "other";
  networkDescription?: string;
  networkScanResults?: string;
  networkFirewallRules?: string;
}

export async function performAnalysisAction(params: PerformAnalysisParams, isPremium: boolean): Promise<AnalysisResult> {
  const {
    url, serverDescription, databaseDescription,
    codeSnippet, sastLanguage, dastTargetUrl,
    cloudProvider, cloudConfigDescription, cloudRegion,
    containerImageName, dockerfileContent, kubernetesManifestContent, containerAdditionalContext,
    dependencyFileContent, dependencyFileType,
    networkDescription, networkScanResults, networkFirewallRules
  } = params;

  if (!url && !serverDescription && !databaseDescription && !codeSnippet && !dastTargetUrl && !cloudConfigDescription && (!containerImageName && !dockerfileContent && !kubernetesManifestContent) && !dependencyFileContent && !networkDescription && !networkScanResults && !networkFirewallRules) {
    return {
      urlAnalysis: null, serverAnalysis: null, databaseAnalysis: null,
      sastAnalysis: null, dastAnalysis: null,
      cloudAnalysis: null, containerAnalysis: null, dependencyAnalysis: null, networkAnalysis: null,
      reportText: null, attackVectors: null, remediationPlaybooks: null,
      error: "Al menos uno de los objetivos de análisis debe ser proporcionado." ,
      allFindings: []
    };
  }

  let errorOccurred = false;
  let collectedErrorMessages = "";

  let urlAnalysisResult: UrlVulnerabilityAnalysisOutput | null = null;
  let serverAnalysisResult: ServerSecurityAnalysisOutput | null = null;
  let databaseAnalysisResult: DatabaseSecurityAnalysisOutput | null = null;
  let sastAnalysisResult: SastAnalysisOutput | null = null;
  let dastAnalysisResult: DastAnalysisOutput | null = null;
  let cloudAnalysisResult: CloudConfigAnalysisOutput | null = null;
  let containerAnalysisResult: ContainerAnalysisOutput | null = null;
  let dependencyAnalysisResult: DependencyAnalysisOutput | null = null;
  let networkAnalysisResult: NetworkSecurityAnalysisOutput | null = null;

  let allFindings: VulnerabilityFinding[] = [];
  const analysisPerformedTypes: string[] = [];


  try {
    if (url) {
      try {
        const urlInput: AnalyzeUrlVulnerabilitiesInput = { url };
        urlAnalysisResult = await analyzeUrlVulnerabilities(urlInput);
        if (urlAnalysisResult?.findings) allFindings.push(...urlAnalysisResult.findings);
        if (urlAnalysisResult) analysisPerformedTypes.push("URL");
      } catch (e: any) { collectedErrorMessages += `URL: ${e.message}. `; errorOccurred = true; }
    }

    if (serverDescription) {
      try {
        const serverInput: ServerConfigInput = { serverDescription };
        serverAnalysisResult = await analyzeServerSecurity(serverInput);
        if (serverAnalysisResult?.findings) allFindings.push(...serverAnalysisResult.findings);
        if (serverAnalysisResult) analysisPerformedTypes.push("Server");
      } catch (e: any) { collectedErrorMessages += `Servidor: ${e.message}. `; errorOccurred = true; }
    }

    if (databaseDescription) {
      try {
        const dbInput: DatabaseConfigInput = { databaseDescription };
        databaseAnalysisResult = await analyzeDatabaseSecurity(dbInput);
        if (databaseAnalysisResult?.findings) allFindings.push(...databaseAnalysisResult.findings);
        if (databaseAnalysisResult) analysisPerformedTypes.push("Database");
      } catch (e: any) { collectedErrorMessages += `BD: ${e.message}. `; errorOccurred = true; }
    }

    if (codeSnippet) {
      try {
        const sastInput: SastAnalysisInput = { codeSnippet };
        if (sastLanguage) sastInput.language = sastLanguage;
        sastAnalysisResult = await analyzeSastSecurity(sastInput);
        if (sastAnalysisResult?.findings) allFindings.push(...sastAnalysisResult.findings);
        if (sastAnalysisResult) analysisPerformedTypes.push("SAST");
      } catch (e: any) { collectedErrorMessages += `SAST: ${e.message}. `; errorOccurred = true; }
    }

    if (dastTargetUrl) {
      try {
        const dastInput: DastAnalysisInput = { targetUrl: dastTargetUrl, scanProfile: "Quick" };
        dastAnalysisResult = await analyzeDastSecurity(dastInput);
        if (dastAnalysisResult?.findings) allFindings.push(...dastAnalysisResult.findings);
        if (dastAnalysisResult) analysisPerformedTypes.push("DAST");
      } catch (e: any) { collectedErrorMessages += `DAST: ${e.message}. `; errorOccurred = true; }
    }

    if (cloudProvider && cloudConfigDescription) {
      try {
        const cloudInput: CloudConfigInput = { provider: cloudProvider, configDescription: cloudConfigDescription };
        if (cloudRegion) cloudInput.region = cloudRegion;
        cloudAnalysisResult = await analyzeCloudConfig(cloudInput);
        if (cloudAnalysisResult?.findings) allFindings.push(...cloudAnalysisResult.findings);
        if (cloudAnalysisResult) analysisPerformedTypes.push("Cloud");
      } catch (e: any) { collectedErrorMessages += `Cloud: ${e.message}. `; errorOccurred = true; }
    }

    if (containerImageName || dockerfileContent || kubernetesManifestContent) {
      try {
        const containerInput: ContainerAnalysisInput = {};
        if (containerImageName) containerInput.imageName = containerImageName;
        if (dockerfileContent) containerInput.dockerfileContent = dockerfileContent;
        if (kubernetesManifestContent) containerInput.kubernetesManifestContent = kubernetesManifestContent;
        if (containerAdditionalContext) containerInput.additionalContext = containerAdditionalContext;

        if(Object.keys(containerInput).length > 0 && (containerInput.imageName || containerInput.dockerfileContent || containerInput.kubernetesManifestContent)) {
            containerAnalysisResult = await analyzeContainerSecurity(containerInput);
            if (containerAnalysisResult?.findings) allFindings.push(...containerAnalysisResult.findings);
            if (containerAnalysisResult) analysisPerformedTypes.push("Container");
        }
      } catch (e: any) { collectedErrorMessages += `Contenedor: ${e.message}. `; errorOccurred = true; }
    }

    if (dependencyFileContent && dependencyFileType) {
      try {
        const depInput: DependencyAnalysisInput = { dependencyFileContent, fileType: dependencyFileType };
        dependencyAnalysisResult = await analyzeDependencies(depInput);
        if (dependencyAnalysisResult?.findings) allFindings.push(...dependencyAnalysisResult.findings);
        if (dependencyAnalysisResult) analysisPerformedTypes.push("Dependency");
      } catch (e: any) { collectedErrorMessages += `Dependencias: ${e.message}. `; errorOccurred = true; }
    }

    if (networkDescription || networkScanResults || networkFirewallRules) {
        try {
            const networkInput: NetworkSecurityAnalysisInput = {};
            if (networkDescription) networkInput.networkDescription = networkDescription;
            if (networkScanResults) networkInput.scanResults = networkScanResults;
            if (networkFirewallRules) networkInput.firewallRules = networkFirewallRules;

            if (Object.keys(networkInput).length > 0) {
                networkAnalysisResult = await analyzeNetworkSecurity(networkInput);
                if (networkAnalysisResult?.findings) allFindings.push(...networkAnalysisResult.findings);
                if (networkAnalysisResult) analysisPerformedTypes.push("Network");
            }
        } catch (e: any) { collectedErrorMessages += `Red: ${e.message}. `; errorOccurred = true; }
    }


    if (errorOccurred && allFindings.length === 0) {
       return {
         urlAnalysis: null, serverAnalysis: null, databaseAnalysis: null, sastAnalysis: null, dastAnalysis: null,
         cloudAnalysis: null, containerAnalysis: null, dependencyAnalysis: null, networkAnalysis: null,
         reportText: null, attackVectors: null, remediationPlaybooks: null,
         error: `Todos los análisis fallaron o no produjeron hallazgos. Errores: ${collectedErrorMessages}`,
         allFindings: []
       };
    }

    let targetDescParts = [];
    if (url) targetDescParts.push(`URL (${url})`);
    if (serverDescription) targetDescParts.push('Servidor General/Juegos');
    if (databaseDescription) targetDescParts.push('Base de Datos');
    if (codeSnippet) targetDescParts.push(`Fragmento de Código (${sastLanguage || 'SAST'})`);
    if (dastTargetUrl) targetDescParts.push(`Aplicación URL DAST (${dastTargetUrl})`);
    if (cloudProvider && cloudConfigDescription) targetDescParts.push(`Configuración Cloud (${cloudProvider}${cloudRegion ? `/${cloudRegion}` : ''})`);
    if (containerImageName || dockerfileContent || kubernetesManifestContent) targetDescParts.push('Contenedor/K8s');
    if (dependencyFileContent && dependencyFileType) targetDescParts.push(`Dependencias (${dependencyFileType})`);
    if (networkDescription || networkScanResults || networkFirewallRules) targetDescParts.push('Red');

    const finalTargetDescription = targetDescParts.join(', ').replace(/, $/, '') || "Análisis general";

    const reportInput: GenerateSecurityReportInput = {
        analyzedTargetDescription: `Análisis para ${finalTargetDescription}`,
        urlAnalysis: urlAnalysisResult ?? undefined,
        serverAnalysis: serverAnalysisResult ?? undefined,
        databaseAnalysis: databaseAnalysisResult ?? undefined,
        sastAnalysis: sastAnalysisResult ?? undefined,
        dastAnalysis: dastAnalysisResult ?? undefined,
        cloudAnalysis: cloudAnalysisResult ?? undefined,
        containerAnalysis: containerAnalysisResult ?? undefined,
        dependencyAnalysis: dependencyAnalysisResult ?? undefined,
        networkAnalysis: networkAnalysisResult ?? undefined,
        overallVulnerableFindings: allFindings.filter(f => f.isVulnerable)
    };

    let reportResultText: string | null = "La generación del informe falló o no hay resultados de análisis para informar.";
    try {
        const reportOutput = await generateSecurityReport(reportInput);
        reportResultText = reportOutput.report;
    } catch (e: any) {
        collectedErrorMessages += `Informe: ${e.message}. `;
        errorOccurred = true;
    }

    let attackVectorsResult: AttackVector[] | null = null;
    let remediationPlaybooksResult: RemediationPlaybook[] = [];
    const vulnerableFindingsForPremium = allFindings.filter(v => v.isVulnerable);

    if (isPremium && vulnerableFindingsForPremium.length > 0) {
      try {
        attackVectorsResult = await generateAttackVectors(vulnerableFindingsForPremium);
      } catch (e: any) {
        collectedErrorMessages += `Vectores de Ataque: ${e.message}. `;
      }

      try {
        for (const finding of vulnerableFindingsForPremium) {
          const playbookInput: RemediationPlaybookInput = { vulnerabilityFinding: finding };
          const playbook = await generateRemediationPlaybook(playbookInput);
          remediationPlaybooksResult.push(playbook);
        }
      } catch (e: any) {
         collectedErrorMessages += `Playbooks Remediación: ${e.message}. `;
      }
    }

    // Save Analysis Record to Supabase
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && (urlAnalysisResult || serverAnalysisResult || databaseAnalysisResult || sastAnalysisResult || dastAnalysisResult || cloudAnalysisResult || containerAnalysisResult || dependencyAnalysisResult || networkAnalysisResult)) {
      const overallRisk = reportInput.overallVulnerableFindings.length > 0
        ? (allFindings.some(f => f.severity === 'Critical' || f.severity === 'High') ? 'High' : (allFindings.some(f => f.severity === 'Medium') ? 'Medium' : 'Low'))
        : (allFindings.some(f => f.severity === 'Informational') ? 'Informational' : 'Low');

      const currentReportSummary = reportResultText?.substring(0, 500);
      console.log("DEBUG: report_summary antes de guardar:", currentReportSummary); 

      const analysisRecordData: Omit<AnalysisRecord, 'id' | 'created_at'> = {
        user_id: user.id,
        analysis_type: analysisPerformedTypes.length > 0 ? analysisPerformedTypes[0] as AnalysisRecord['analysis_type'] : 'URL', 
        target_description: finalTargetDescription.substring(0, 250), 
        overall_risk_assessment: overallRisk as AnalysisRecord['overall_risk_assessment'],
        vulnerable_findings_count: reportInput.overallVulnerableFindings.length,
        report_summary: currentReportSummary, 
        full_report_data: {
           allFindings: allFindings, 
           reportText: reportResultText, 
        }
      };
      try {
        const { error: dbError } = await supabase.from('analysis_records').insert([analysisRecordData]);
        if (dbError) {
          console.error("Error guardando registro de análisis en Supabase:", dbError);
          collectedErrorMessages += ` Guardar Registro Análisis: ${dbError.message}. `;
        } else {
          console.log("Registro de análisis guardado en Supabase.");
        }
      } catch (dbCatchError: any) {
          console.error("Excepción guardando registro de análisis:", dbCatchError);
          collectedErrorMessages += ` Excepción Guardar Registro: ${dbCatchError.message}. `;
      }
    } else if (!user) {
      console.log("Usuario no autenticado, omitiendo guardado de registro de análisis.");
    }


    return {
        urlAnalysis: urlAnalysisResult,
        serverAnalysis: serverAnalysisResult,
        databaseAnalysis: databaseAnalysisResult,
        sastAnalysis: sastAnalysisResult,
        dastAnalysis: dastAnalysisResult,
        cloudAnalysis: cloudAnalysisResult,
        containerAnalysis: containerAnalysisResult,
        dependencyAnalysis: dependencyAnalysisResult,
        networkAnalysis: networkAnalysisResult,
        reportText: reportResultText,
        attackVectors: attackVectorsResult,
        remediationPlaybooks: remediationPlaybooksResult.length > 0 ? remediationPlaybooksResult : null,
        allFindings: allFindings,
        error: errorOccurred ? `Uno o más pasos del análisis fallaron. Se pueden mostrar resultados parciales. Errores: ${collectedErrorMessages}` : (collectedErrorMessages ? `Ocurrieron problemas menores: ${collectedErrorMessages}`: null)
    };

  } catch (error: any) {
    console.error("Error crítico en performAnalysisAction:", error);
    let errorMessage = "Ocurrió un error crítico inesperado durante el proceso de análisis. El modelo de IA podría no estar disponible o la entrada podría ser inválida.";

    const apiKeyEnv = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKeyName = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "NEXT_PUBLIC_GOOGLE_API_KEY" : "GOOGLE_API_KEY";

    if (!apiKeyEnv || apiKeyEnv === "tu_clave_api_google_aqui_valida" || apiKeyEnv.trim() === "" || apiKeyEnv === "YOUR_GOOGLE_AI_API_KEY_HERE") {
        errorMessage = `Error de Configuración del Servidor: La clave API (${apiKeyName}) para el servicio de Inteligencia Artificial no está configurada correctamente o es el valor predeterminado. Por favor, revise su archivo .env.local y las instrucciones del README.md.`;
    } else if (error.message && (error.message.includes("API key not valid") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
        errorMessage = `Error de Configuración del Servidor: La clave API (${apiKeyName}) proporcionada para el servicio de Inteligencia Artificial no es válida. Por favor, verifique la clave en Google AI Studio y asegúrese de que esté correctamente configurada en su archivo .env.local.`;
    } else if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
        errorMessage = "Ocurrió un error de red al intentar contactar un servicio de análisis. Por favor, verifica tu conexión a internet e inténtalo de nuevo.";
    } else if (error.message && error.message.includes('quota')) {
        errorMessage = "Se ha excedido una cuota del servicio de análisis (posiblemente de Google AI). Por favor, inténtalo de nuevo más tarde o revisa los límites de tu cuenta.";
    } else if (error.message && (error.message.toLowerCase().includes('json') || error.message.includes('Unexpected token') || error.message.includes('output.findings') || error.message.includes('output!'))) {
          errorMessage = `La IA devolvió un formato inválido o inesperado. Detalles: ${error.message}. Esto puede deberse a un problema temporal con el modelo de IA, filtros de contenido, o un prompt mal formado. Inténtalo de nuevo o simplifica la entrada.`;
    } else {
        errorMessage = `El análisis falló catastróficamente: ${error.message}`;
    }
    return {
      urlAnalysis: null, serverAnalysis: null, databaseAnalysis: null, sastAnalysis: null, dastAnalysis: null,
      cloudAnalysis: null, containerAnalysis: null, dependencyAnalysis: null, networkAnalysis: null,
      reportText: null, attackVectors: null, remediationPlaybooks: null, error: errorMessage, allFindings: []
    };
  }
}

export async function askGeneralAssistantAction(input: GeneralQueryInput): Promise<string> {
  try {
    const result = await generalQueryAssistant(input);
    return result.aiResponse;
  } catch (error: any) {
    console.error("Error interacting with General Assistant:", error);
    let errorMessage = "Lo siento, no pude procesar tu pregunta en este momento. Por favor, intenta de nuevo más tarde.";

    const apiKeyEnv = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKeyName = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "NEXT_PUBLIC_GOOGLE_API_KEY" : "GOOGLE_API_KEY";

    if (!apiKeyEnv || apiKeyEnv === "tu_clave_api_google_aqui_valida" || apiKeyEnv.trim() === "" || apiKeyEnv === "YOUR_GOOGLE_AI_API_KEY_HERE") {
        errorMessage = `Error de Configuración del Asistente: La clave API (${apiKeyName}) para el servicio de Inteligencia Artificial no está configurada o es el valor predeterminado. Por favor, contacte al administrador de la plataforma.`;
    } else if (error.message && (error.message.includes("API key not valid") || error.message.includes("API key is invalid") || error.message.includes("API_KEY_INVALID"))) {
        errorMessage = `Error de Configuración del Asistente: La clave API (${apiKeyName}) para el servicio de Inteligencia Artificial no es válida. Por favor, contacte al administrador de la plataforma.`;
    }
    return errorMessage;
  }
}

export async function exportAllFindingsAsJsonAction(allFindings: VulnerabilityFinding[]): Promise<string> {
  if (!allFindings || allFindings.length === 0) {
    return JSON.stringify({ message: "No hay hallazgos para exportar." }, null, 2);
  }
  try {
    return JSON.stringify(allFindings, null, 2);
  } catch (error: any) {
    console.error("Error al convertir hallazgos a JSON:", error);
    return JSON.stringify({ error: "Error al generar el archivo JSON.", details: error.message }, null, 2);
  }
}

