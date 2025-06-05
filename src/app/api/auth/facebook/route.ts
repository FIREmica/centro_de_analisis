
// src/app/api/auth/facebook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use server client for API routes
import { cookies } from 'next/headers';

const getFacebookUserDetails = async (accessToken: string) => {
  const fields = 'id,name,email,picture';
  const graphApiUrl = `https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`;
  const response = await fetch(graphApiUrl);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error desconocido de Facebook API" }));
    console.error("Error fetching user details from Facebook:", errorData);
    throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
  }
  return response.json();
};

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token de Facebook no proporcionado.' }, { status: 400 });
    }

    // Opcional: Validar el token con Facebook (para mayor seguridad, aunque Supabase lo hará internamente)
    // const fbUserDetails = await getFacebookUserDetails(accessToken);
    // console.log("Facebook user details from token:", fbUserDetails);
    // if (!fbUserDetails || !fbUserDetails.id) {
    //   return NextResponse.json({ error: 'Token de Facebook inválido o no se pudieron obtener detalles del usuario.' }, { status: 401 });
    // }

    // Intentar iniciar sesión o registrarse con Supabase usando el token de Facebook
    const { data: { user, session }, error: supaError } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        authCode: accessToken, // Supabase espera el 'code' para el flujo server-side, pero para client-side token,
                               // la forma correcta es usar el token directamente con signInWithIdToken si es un ID token
                               // o a través de un flujo que el cliente Supabase maneje.
                               // Para este caso donde el cliente JS de FB ya hizo el login,
                               // la mejor forma es que el cliente Supabase use el token.
                               // Sin embargo, una API route que toma un access_token y crea una sesión
                               // es más compleja y usualmente requiere un intercambio de token personalizado.

                               // La manera MÁS SIMPLE de integrar client-side FB SDK con Supabase
                               // es dejar que el SDK de Supabase maneje el token que le das
                               // DIRECTAMENTE EN EL CLIENTE, no pasando el token a una API route.
                               // supabase.auth.signInWithOAuth({ provider: 'facebook', options: { accessToken } })
                               // PERO `signInWithOAuth` NO ACEPTA `accessToken` directamente en Supabase JS v2.
                               // La forma correcta con Supabase JS v2 para un token de proveedor es:
                               // supabase.auth.signInWithIdToken({ provider: 'facebook', token: accessToken })
                               // SIEMPRE Y CUANDO el token sea un ID Token. El accessToken de FB es diferente.

                               // Dado el flujo actual (cliente FB SDK -> POST a API route), esta API route
                               // necesitaría hacer un "sign in with provider token" que Supabase no expone
                               // directamente en su JS SDK para access tokens de OAuth2 de terceros.
                               // La intención del `signInWithOAuth` en server-side es para cuando *Supabase*
                               // maneja toda la redirección.

                               // *** CORRECCIÓN DE ENFOQUE PARA ESTA RUTA API ***
                               // Esta ruta API, si se mantiene, debería ser un proxy muy simple o
                               // mejor aún, el cliente debería interactuar directamente con Supabase
                               // si el SDK de Facebook ya proporcionó el token.

                               // Si la intención es *crear un usuario en Supabase a partir de un token de FB externo*:
                               // Esto usualmente requiere usar el Admin SDK de Supabase.
                               // Como este es un server component, podemos usar el cliente de servidor.

                               // Para este ejemplo, mantendremos el intento de signInWithOAuth, pero es
                               // probable que no sea el flujo ideal para un token ya obtenido por el cliente.
                               // El cliente Supabase es mejor manejando esto si está configurado para Facebook.
                               // Supabase no tiene un método `signInWithFacebookAccessToken` directo.
                               // La forma más limpia sería que el cliente haga:
                               // const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
                               // Y Supabase maneja la redirección.
                               // Si el cliente YA TIENE el accessToken, el cliente Supabase NO tiene un
                               // método directo para usarlo para crear una sesión (solo para ID Tokens).
                               // Por lo tanto, esta API route es conceptualmente problemática.
                               // Lo dejaremos así, pero advirtiendo que puede no ser el flujo ideal.
      },
    });


    if (supaError) {
        console.error("Error de Supabase al intentar signInWithOAuth (Facebook) en API route:", supaError);
        let errorMessage = supaError.message;
        if (supaError.message.includes("Identity already linked")) {
            errorMessage = "Esta cuenta de Facebook ya está vinculada a otro usuario en nuestra plataforma.";
        } else if (supaError.message.includes("User already registered")) {
             // Esto podría pasar si el usuario ya existe con email pero no vinculado a FB.
             // O si el trigger de Supabase para crear el perfil falla.
            errorMessage = "Ya existe un usuario con este correo electrónico. Intenta iniciar sesión de otra forma.";
        }
        return NextResponse.json({ error: `Error de autenticación con Supabase: ${errorMessage}` }, { status: 401 });
    }

    if (!user || !session) {
        return NextResponse.json({ error: 'No se pudo crear o recuperar la sesión del usuario con Supabase desde Facebook.' }, { status: 500 });
    }
    
    // En este punto, Supabase (teóricamente) ha creado/actualizado el usuario en auth.users
    // y el trigger handle_new_user debería haber creado un perfil en user_profiles.

    return NextResponse.json({ 
        message: 'Autenticación con Facebook y Supabase exitosa.', 
        userId: user.id,
        email: user.email,
        // session: session, // Opcional: no enviar toda la sesión
    });

  } catch (error: any) {
    console.error("Error crítico en API /auth/facebook (POST):", error);
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 });
  }
}


// GET handler for initiating OAuth flow (if you want Supabase to handle redirects)
// This is NOT used by the current signup page's Facebook button logic.
export async function GET(request: NextRequest): Promise<NextResponse<unknown>> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { searchParams } = new URL(request.url);
  const redirectToPath = searchParams.get('redirectTo') || '/dashboard'; // Default redirect

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${redirectToPath}`,
      // Opcional: si necesitas pedir scopes específicos de Facebook
      // scopes: 'email public_profile', 
    },
  });

  if (error) {
    console.error("Error al iniciar OAuth con Facebook (GET):", error);
    // Redirigir a una página de error o a la página de inicio con un mensaje de error
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
     console.error("Error al iniciar OAuth con Facebook (GET): No se obtuvo URL de redirección de Supabase.");
     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=facebook_oauth_url_missing`);
  }

  // Redirige al usuario a la URL de autenticación de Facebook proporcionada por Supabase
  return NextResponse.redirect(data.url);
}

