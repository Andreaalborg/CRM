"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { CalendarView, type CalendarEvent } from "@/components/calendar/calendar-view";
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, 
  FileText, RefreshCw, Zap, Phone, TrendingUp,
  ArrowRight, Filter, X
} from "lucide-react";

interface DashboardStats {
  overdueInvoices: number;
  pendingInvoices: number;
  upcomingRecurring: number;
  scheduledJobs: number;
  pendingFollowUps: number;
  activeAutomations: number;
  totalAmount: number;
  overdueAmount: number;
}

const eventTypeConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  invoice_due: { color: "#3b82f6", bg: "#dbeafe", icon: FileText, label: "Faktura forfaller" },
  invoice_overdue: { color: "#dc2626", bg: "#fee2e2", icon: AlertTriangle, label: "Forfalt faktura" },
  recurring_invoice: { color: "#8b5cf6", bg: "#ede9fe", icon: RefreshCw, label: "Gjentakende faktura" },
  scheduled_job: { color: "#f59e0b", bg: "#fef3c7", icon: Zap, label: "Planlagt jobb" },
  follow_up: { color: "#10b981", bg: "#d1fae5", icon: Phone, label: "Oppfølging" },
  automation: { color: "#6366f1", bg: "#e0e7ff", icon: Zap, label: "Aktiv automasjon" },
};

export default function OversiktPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();
      end.setMonth(end.getMonth() + 3);

      const res = await fetch(
        `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Beregn statistikk
  const now = new Date();
  const stats: DashboardStats = {
    overdueInvoices: events.filter(e => e.type === "invoice_overdue").length,
    pendingInvoices: events.filter(e => e.type === "invoice_due" && new Date(e.date) > now).length,
    upcomingRecurring: events.filter(e => e.type === "recurring_invoice").length,
    scheduledJobs: events.filter(e => e.type === "scheduled_job").length,
    pendingFollowUps: events.filter(e => e.type === "follow_up" && e.status !== "completed").length,
    activeAutomations: events.filter(e => e.type === "automation").length,
    totalAmount: events
      .filter(e => e.type === "invoice_due" || e.type === "invoice_overdue")
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    overdueAmount: events
      .filter(e => e.type === "invoice_overdue")
      .reduce((sum, e) => sum + (e.amount || 0), 0),
  };

  // Filtrer events
  const filteredEvents = filterType === "all" 
    ? events 
    : events.filter(e => e.type === filterType);

  // Kommende hendelser (sortert)
  const upcomingEvents = [...filteredEvents]
    .filter(e => e.type !== "automation") // Ikke vis automasjoner i liste
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "16px", color: "#6b7280" }}>Laster oversikt...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>
          📅 Oversikt & Kalender
        </h1>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Full oversikt over alle jobber, fakturaer, automasjoner og oppfølginger
        </p>
      </div>

      {/* Statistikk-kort */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px",
        marginBottom: "32px"
      }}>
        {/* Forfalt */}
        <Card style={{ borderLeft: "4px solid #dc2626" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#dc2626", margin: 0 }}>
                  {stats.overdueInvoices}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Forfalt</p>
              </div>
            </div>
            {stats.overdueAmount > 0 && (
              <p style={{ marginTop: "8px", fontSize: "12px", color: "#dc2626", fontWeight: "500" }}>
                {formatCurrency(stats.overdueAmount)} utestående
              </p>
            )}
          </CardContent>
        </Card>

        {/* Kommende fakturaer */}
        <Card style={{ borderLeft: "4px solid #3b82f6" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#dbeafe",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <FileText size={22} color="#3b82f6" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.pendingInvoices}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Forfaller snart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gjentakende */}
        <Card style={{ borderLeft: "4px solid #8b5cf6" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#ede9fe",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <RefreshCw size={22} color="#8b5cf6" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.upcomingRecurring}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Gjentakende</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Oppfølginger */}
        <Card style={{ borderLeft: "4px solid #10b981" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#d1fae5",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Phone size={22} color="#10b981" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.pendingFollowUps}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Oppfølginger</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planlagte jobber */}
        <Card style={{ borderLeft: "4px solid #f59e0b" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#fef3c7",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Zap size={22} color="#f59e0b" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.scheduledJobs}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Planlagte jobber</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aktive automasjoner */}
        <Card style={{ borderLeft: "4px solid #6366f1" }}>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#e0e7ff",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <TrendingUp size={22} color="#6366f1" />
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                  {stats.activeAutomations}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Aktive automasjoner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter og visningsvalg */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button 
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
          >
            Alle
          </Button>
          {Object.entries(eventTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <Button 
                key={type}
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                style={filterType === type ? { background: config.color } : {}}
              >
                <Icon size={14} style={{ marginRight: "6px" }} />
                {config.label}
              </Button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button 
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
          >
            <Calendar size={16} style={{ marginRight: "6px" }} />
            Kalender
          </Button>
          <Button 
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            <Filter size={16} style={{ marginRight: "6px" }} />
            Liste
          </Button>
        </div>
      </div>

      {/* Hovedinnhold */}
      <div style={{ display: "grid", gridTemplateColumns: view === "calendar" ? "1fr 380px" : "1fr", gap: "24px" }}>
        {/* Kalender eller liste */}
        {view === "calendar" ? (
          <CalendarView 
            events={filteredEvents}
            onEventClick={handleEventClick}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Alle hendelser</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcomingEvents.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>
                    Ingen hendelser å vise
                  </p>
                ) : (
                  upcomingEvents.map(event => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config?.icon || Clock;
                    const isPast = new Date(event.date) < now;
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => event.link && router.push(event.link)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "16px",
                          background: isPast ? "#fafafa" : "#fff",
                          borderRadius: "12px",
                          border: `1px solid ${config?.color || "#e5e7eb"}20`,
                          cursor: event.link ? "pointer" : "default",
                          transition: "all 0.2s",
                          opacity: isPast ? 0.7 : 1
                        }}
                      >
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: config?.bg || "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <Icon size={20} color={config?.color || "#6b7280"} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            margin: 0, 
                            fontWeight: "600", 
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {event.title}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                            {event.description}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {event.amount && (
                            <p style={{ 
                              margin: 0, 
                              fontWeight: "600", 
                              color: event.type === "invoice_overdue" ? "#dc2626" : "#1a1a1a"
                            }}>
                              {formatCurrency(event.amount)}
                            </p>
                          )}
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                            {formatDate(event.date)}
                          </p>
                        </div>
                        {event.link && (
                          <ArrowRight size={16} color="#9ca3af" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sidebar med kommende hendelser (kun i kalender-visning) */}
        {view === "calendar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Kommende */}
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={18} />
                  Kommende hendelser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                  {upcomingEvents.filter(e => new Date(e.date) >= now).slice(0, 10).map(event => {
                    const config = eventTypeConfig[event.type];
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => event.link && router.push(event.link)}
                        style={{
                          padding: "12px",
                          background: "#f9fafb",
                          borderRadius: "8px",
                          borderLeft: `3px solid ${config?.color || "#6b7280"}`,
                          cursor: event.link ? "pointer" : "default",
                        }}
                      >
                        <p style={{ 
                          margin: 0, 
                          fontSize: "13px", 
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {event.title}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#6b7280" }}>
                          {formatDate(event.date)}
                        </p>
                        {event.amount && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: "600", color: config?.color }}>
                            {formatCurrency(event.amount)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Forfalt */}
            {stats.overdueInvoices > 0 && (
              <Card style={{ borderColor: "#fecaca" }}>
                <CardHeader style={{ background: "#fef2f2" }}>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                    <AlertTriangle size={18} />
                    Krever oppmerksomhet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {events
                      .filter(e => e.type === "invoice_overdue" || (e.type === "follow_up" && e.status === "overdue"))
                      .slice(0, 5)
                      .map(event => (
                        <div
                          key={event.id}
                          onClick={() => event.link && router.push(event.link)}
                          style={{
                            padding: "12px",
                            background: "#fff",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            cursor: event.link ? "pointer" : "default",
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#dc2626" }}>
                            {event.title}
                          </p>
                          {event.amount && (
                            <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: "600" }}>
                              {formatCurrency(event.amount)}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Event detalj modal */}
      {selectedEvent && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <Card 
            style={{ width: "450px", maxHeight: "80vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <CardHeader style={{ 
              background: eventTypeConfig[selectedEvent.type]?.bg || "#f3f4f6",
              borderBottom: `3px solid ${eventTypeConfig[selectedEvent.type]?.color || "#6b7280"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <CardTitle style={{ color: eventTypeConfig[selectedEvent.type]?.color }}>
                  {selectedEvent.title}
                </CardTitle>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} color="#6b7280" />
                </button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>Dato</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>{formatDate(selectedEvent.date)}</p>
                </div>
                
                {selectedEvent.description && (
                  <div>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>Beskrivelse</p>
                    <p style={{ margin: 0 }}>{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.amount && (
                  <div>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>Beløp</p>
                    <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: eventTypeConfig[selectedEvent.type]?.color }}>
                      {formatCurrency(selectedEvent.amount)}
                    </p>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>Type</p>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "500",
                    background: eventTypeConfig[selectedEvent.type]?.bg,
                    color: eventTypeConfig[selectedEvent.type]?.color
                  }}>
                    {eventTypeConfig[selectedEvent.type]?.label}
                  </span>
                </div>

                {selectedEvent.link && (
                  <Button 
                    onClick={() => {
                      router.push(selectedEvent.link!);
                      setSelectedEvent(null);
                    }}
                    style={{ marginTop: "8px" }}
                  >
                    Gå til detaljer
                    <ArrowRight size={16} style={{ marginLeft: "8px" }} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

