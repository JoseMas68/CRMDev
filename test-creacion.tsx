"use client";

import { createTask } from "@/actions/tasks";
import { toast } from "sonner";

export default function TestCreacion() {
  async function probarCreacionBasica() {
    // Test 1: Crear tarea SIN asignado
    console.log("Test 1: Crear tarea sin asignado...");
    const result1 = await createTask({
      title: "Tarea de prueba sin asignado",
      status: "TODO",
      priority: "MEDIUM",
    });

    console.log("Resultado 1:", result1);

    // Test 2: Crear tarea CON asignado
    console.log("Test 2: Crear tarea con asignado...");
    const result2 = await createTask({
      title: "Tarea de prueba con asignado",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "cljt8s9h00000000xz2l8f8", // ID de prueba
    });

    console.log("Resultado 2:", result2);

    return (
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-bold">Test de Creación de Tareas</h2>
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log("Test 1: Crear tarea sin asignado");
              probarCreacionBasica();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test 1: Crear sin asignado
          </button>

          <button
            onClick={() => {
              console.log("Test 2: Crear tarea con asignado");
              probarCreacionBasica();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Test 2: Crear con asignado
          </button>
        </div>
      </div>
    );
  }
}
