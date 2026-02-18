import { useCallback, useEffect, useState } from "react";
import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAppointments, updateAppointment } from "@/lib/api";
import { ViewingAppointment, ViewingStatus } from "@/types/property";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";

const STATUS_VARIANTS: Record<ViewingStatus, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "secondary",
    confirmed: "default",
    completed: "outline",
    cancelled: "destructive",
};

export default function ViewingAppointments() {
    const [appointments, setAppointments] = useState<ViewingAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchAppointments();
            setAppointments(res.results);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const handleUpdateStatus = async (id: string, status: ViewingStatus) => {
        try {
            await updateAppointment(id, { status });
            toast.success(`Appointment ${status}`);
            loadAppointments(); // Refresh list to get updated state
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    return (
        <AgentShell>
            <div className="p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Viewing Appointments</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">Loading appointments...</TableCell>
                                    </TableRow>
                                ) : appointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">No appointments found.</TableCell>
                                    </TableRow>
                                ) : (
                                    appointments.map((app) => {
                                        const date = new Date(app.scheduled_for);
                                        return (
                                            <TableRow key={app.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center text-sm font-medium">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {date.toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{app.property?.title}</div>
                                                    <div className="text-xs text-muted-foreground">{app.property?.city}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{app.inquiry?.name || 'Anonymous'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={STATUS_VARIANTS[app.status] || "outline"}>
                                                        {app.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Select
                                                        value={app.status}
                                                        onValueChange={(val) => handleUpdateStatus(app.id, val as ViewingStatus)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-8 ml-auto">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="confirmed">Confirm</SelectItem>
                                                            <SelectItem value="completed">Complete</SelectItem>
                                                            <SelectItem value="cancelled">Cancel</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AgentShell>
    );
}
