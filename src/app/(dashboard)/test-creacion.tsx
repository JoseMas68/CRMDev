import { TestCreacion } from "@/app/(dashboard)/test-creacion";

export default async function TestDiagnostico() {
  console.log("=== TEST DE DIAGNÓSTICO ===");
  console.log("Hora:", new Date().toLocaleTimeString());

  // Test 1: Verificar imagen
  const img = new Image();
  img.src = "/next.svg";
  img.width = 100;
  img.height = 100;
  console.log("Test 1: Imagen Next.js optimizada");
  console.log("  - src:", img.src);

  // Test 2: Verificar título
  const title = document.title;
  console.log("Test 2: Título:", title);
  console.log("  - innerText:", title.innerText);

  // Test 3: Verificar meta descripción
  const description = document.querySelector('meta[name="description"]');
  console.log("Test 3: Descripción:", description?.getAttribute("content") || "No encontrada");

  // Test 4: Verificar errores
  const errors = document.querySelectorAll('[role="alert"]');
  console.log("Test 4: Errores:", errors.length);
  errors.forEach((error, i) => {
    console.log(`Error ${i}:`, error.textContent, error.ariaLabel);
  });

  console.log("=== FIN DEL TEST ===");
}
