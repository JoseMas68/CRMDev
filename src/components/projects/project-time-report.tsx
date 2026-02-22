"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Download, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { getProjectTimeReport } from "@/actions/time";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProjectTimeReportProps {
    projectId: string;
    projectName: string;
}

export function ProjectTimeReport({ projectId, projectName }: ProjectTimeReportProps) {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadReport() {
            const result = await getProjectTimeReport(projectId);
            if (result.success && result.data) {
                setReportData(result.data);
            }
            setIsLoading(false);
        }
        loadReport();
    }, [projectId]);

    // Aggregate stats
    const totalMinutes = reportData.reduce((acc, entry) => acc + entry.duration, 0);
    const totalHoursStr = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    // Aggregate by user
    const userStats = reportData.reduce((acc, entry) => {
        const userId = entry.user.id;
        if (!acc[userId]) {
            acc[userId] = {
                user: entry.user,
                totalMinutes: 0
            };
        }
        acc[userId].totalMinutes += entry.duration;
        return acc;
    }, {} as Record<string, { user: any; totalMinutes: number }>);

    const userStatsArray = Object.values(userStats).sort((a, b) => b.totalMinutes - a.totalMinutes);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        toast.info("Generando PDF, por favor espera...", { id: "pdf-toast" });

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Better resolution
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Reporte_Horas_${projectName.replace(/\s+/g, '_')}.pdf`);

            toast.success("PDF generado exitosamente", { id: "pdf-toast" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF", { id: "pdf-toast" });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <div className="h-6 w-1/3 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-20 w-full bg-muted rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Control de Tiempo</h3>
                <Button onClick={handleExportPDF} disabled={isExporting || reportData.length === 0} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Generando..." : "Descargar PDF"}
                </Button>
            </div>

            {reportData.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center">
                        <Clock className="h-10 w-10 mb-4 opacity-50" />
                        <p>No hay registros de tiempo en este proyecto todavía.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="hidden-pdf-wrapper">
                    {/* Printable Area */}
                    <div ref={reportRef} className="bg-background text-foreground space-y-6 rounded-lg p-1">
                        {/* Header Solo para el PDF (invisible normal, visible en el canvas, o simplemente styled para quedar bien) */}
                        <div className="border border-border p-6 rounded-xl shadow-sm bg-card">
                            <div className="flex justify-between items-start mb-6 border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight mb-1">Reporte de Horas</h2>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> {projectName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Generado el</p>
                                    <p className="font-medium">{format(new Date(), "dd MMM, yyyy", { locale: es })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center tracking-wider text-muted-foreground uppercase">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Total Dedicado
                                    </h3>
                                    <div className="text-4xl font-black text-primary">{totalHoursStr}</div>
                                    <p className="text-sm text-muted-foreground mt-1">{reportData.length} registros totales</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center tracking-wider text-muted-foreground uppercase">
                                        <Users className="h-4 w-4 mr-2" />
                                        Por Miembro
                                    </h3>
                                    <div className="space-y-2">
                                        {userStatsArray.map((stat) => (
                                            <div key={stat.user.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={stat.user.image} />
                                                        <AvatarFallback>{stat.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{stat.user.name}</span>
                                                </div>
                                                <span className="text-sm font-bold">
                                                    {Math.floor(stat.totalMinutes / 60)}h {stat.totalMinutes % 60}m
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logs Detallados */}
                        <div className="border border-border rounded-xl shadow-sm overflow-hidden bg-card">
                            <div className="bg-muted px-4 py-3 border-b border-border">
                                <h3 className="font-semibold">Desglose de Tareas</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {reportData.map((entry) => (
                                    <div key={entry.id} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{entry.task.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-[500px] leading-relaxed">
                                                {entry.description || "Sin descripción"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {format(new Date(entry.startTime), "dd/MM/yyyy HH:mm")}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <div className="text-lg font-bold">
                                                {entry.duration >= 60 ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m` : `${entry.duration}m`}
                                            </div>
                                            <div className="flex justify-end items-center gap-1 mt-1 text-muted-foreground text-xs">
                                                <Avatar className="h-4 w-4">
                                                    <AvatarImage src={entry.user.image} />
                                                    <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {entry.user.name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
