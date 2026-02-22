"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: { id: string; name: string } | null;
}

interface TimeTrackerProps {
  tasks: Task[];
}

export function TimeTracker({ tasks }: TimeTrackerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [startTime, setStartTime] = useState<number | null>(null);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("timeTracker");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.startTime && (state.isRunning || Date.now() - state.startTime < 86400000)) {
        setSelectedTaskId(state.taskId);
        setStartTime(state.startTime);
        setIsRunning(state.isRunning);
        if (state.isRunning) {
          setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
        } else {
          setElapsedTime(state.elapsedTime || 0);
        }
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((state: any) => {
    localStorage.setItem("timeTracker", JSON.stringify(state));
  }, []);

  const handleStart = async () => {
    if (!selectedTaskId) {
      toast.error("Selecciona una tarea primero");
      return;
    }

    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);

    saveState({
      taskId: selectedTaskId,
      startTime: now,
      isRunning: true,
      elapsedTime: 0,
    });

    toast.success("Timer iniciado");
  };

  const handlePause = async () => {
    setIsRunning(false);
    const elapsed = elapsedTime;

    saveState({
      taskId: selectedTaskId,
      startTime,
      isRunning: false,
      elapsedTime: elapsed,
    });

    toast.success("Timer pausado");
  };

  const handleStop = async () => {
    if (!startTime || !selectedTaskId) {
      toast.error("No hay tiempo activo para guardar");
      return;
    }

    try {
      const response = await fetch("/api/time-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString(),
          duration: Math.floor(elapsedTime / 60), // Convert to minutes
          description: tasks.find((t) => t.id === selectedTaskId)?.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar entrada de tiempo");
      }

      // Reset state
      setIsRunning(false);
      setElapsedTime(0);
      setStartTime(null);
      setSelectedTaskId(null);
      localStorage.removeItem("timeTracker");

      toast.success("Tiempo guardado correctamente");
    } catch (error) {
      console.error("Error saving time entry:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar el tiempo");
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <Card className="border-2 border-primary/20 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Task Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Seleccionar Tarea</label>
          <Select value={selectedTaskId || ""} onValueChange={setSelectedTaskId} disabled={isRunning}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una tarea..." />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                  {task.project && (
                    <span className="text-muted-foreground ml-2">
                      • {task.project.name}
                    </span>
                  )}
                </SelectItem>
              ))}
              {tasks.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No hay tareas disponibles
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Timer Display */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRunning ? "running" : "stopped"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold tracking-wider font-mono">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {selectedTask ? (
                  <span className="truncate block">{selectedTask.title}</span>
                ) : (
                  <span>Selecciona una tarea para comenzar</span>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!selectedTaskId}
              size="lg"
              className="flex-1 gap-2 h-12"
            >
              <Play className="h-5 w-5" />
              {elapsedTime > 0 ? "Continuar" : "Iniciar"}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="secondary"
              size="lg"
              className="flex-1 gap-2 h-12"
            >
              <Pause className="h-5 w-5" />
              Pausar
            </Button>
          )}
          <Button
            onClick={handleStop}
            disabled={!isRunning && elapsedTime === 0}
            variant="destructive"
            size="lg"
            className="gap-2 h-12 px-6"
          >
            <Square className="h-5 w-5" />
            {elapsedTime > 0 ? "Guardar" : "Detener"}
          </Button>
        </div>

        {/* Status indicator */}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-medium">Contando tiempo...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
