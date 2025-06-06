
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresca la sesión automáticamente si es necesario.
  // Esta función (`getSession`) leerá las cookies de la solicitud (req),
  // y potencialmente escribirá nuevas cookies en la respuesta (res) si la sesión se actualiza.
  // Si las cookies leídas están malformadas (ej. un valor que se espera sea JSON pero no lo es,
  // o que se espera sea un JWT pero está corrupto), pueden ocurrir errores de parsing aquí
  // o en subsiguientes accesos a la sesión.
  // El error "Failed to parse cookie string: [SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON]"
  // indica que una cadena de cookie que comienza con "base64-" se está intentando parsear como JSON,
  // lo cual fallará. Esto suele ser un problema con una cookie corrupta o malformada en el navegador del cliente.
  // La solución más común es limpiar las cookies del sitio en el navegador.
  await supabase.auth.getSession();

  return res;
}

// Configura en qué rutas aplicar este middleware
export const config = {
  matcher: ['/dashboard/:path*', '/perfil/:path*'], // Asegura sesión en estas rutas
};
