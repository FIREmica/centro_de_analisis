{ pkgs }:

{
  # Canal que define la versión base de los paquetes
  channel = "stable-24.11";

  # Paquetes que se instalarán en el entorno de desarrollo
  packages = [
    pkgs.nodejs_20   # Incluye npm
    pkgs.yarn        # Yarn explícitamente
    pkgs.zulu        # JVM si usás herramientas como Firebase CLI
  ];

  # Variables de entorno personalizadas (opcional)
  env = {};

  idx = {
    # Extensiones del editor de código (VS Code en IDX)
    extensions = [
      # Ejemplo: "esbenp.prettier-vscode"
    ];

    workspace = {
      onCreate = {
        # Archivos que se abren automáticamente al crear el entorno
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };

    # Configuración de vistas previas (Preview Environment)
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
