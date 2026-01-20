"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "invoice_due" | "invoice_overdue" | "recurring_invoice" | "scheduled_job" | "follow_up" | "automation";
  status: "pending" | "completed" | "overdue" | "cancelled";
  description?: string;
  amount?: number;
  link?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const eventTypeConfig: Record<string, { color: string; bg: string; icon: string }> = {
  invoice_due: { color: "#3b82f6", bg: "#dbeafe", icon: "💰" },
  invoice_overdue: { color: "#dc2626", bg: "#fee2e2", icon: "⚠️" },
  recurring_invoice: { color: "#8b5cf6", bg: "#ede9fe", icon: "🔄" },
  scheduled_job: { color: "#f59e0b", bg: "#fef3c7", icon: "⚡" },
  follow_up: { color: "#10b981", bg: "#d1fae5", icon: "📞" },
  automation: { color: "#6366f1", bg: "#e0e7ff", icon: "🤖" },
};

export function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Få første dag i måneden og antall dager
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Mandag = 0

  // Månedsnavn på norsk
  const monthNames = [
    "Januar", "Februar", "Mars", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  // Navigasjon
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Finn events for en spesifikk dag
  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Sjekk om en dag er i dag
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Generer kalender-grid
  const calendarDays: (number | null)[] = [];
  
  // Tomme celler før første dag
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Dager i måneden
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button 
            variant="outline" 
            onClick={goToPreviousMonth}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }}
          >
            <ChevronLeft size={20} />
          </Button>
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            color: "#fff",
            margin: 0,
            minWidth: "200px",
            textAlign: "center"
          }}>
            {monthNames[month]} {year}
          </h2>
          <Button 
            variant="outline" 
            onClick={goToNextMonth}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
        <Button 
          onClick={goToToday}
          style={{ background: "rgba(255,255,255,0.9)", color: "#6366f1" }}
        >
          I dag
        </Button>
      </div>

      {/* Ukedager */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb"
      }}>
        {dayNames.map(day => (
          <div 
            key={day}
            style={{
              padding: "12px",
              textAlign: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "#6b7280",
              textTransform: "uppercase"
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Kalender grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
      }}>
        {calendarDays.map((day, index) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const today = isToday(day || 0);
          
          return (
            <div
              key={index}
              onClick={() => day && onDateClick?.(new Date(year, month, day))}
              style={{
                minHeight: "120px",
                padding: "8px",
                borderRight: (index + 1) % 7 !== 0 ? "1px solid #f3f4f6" : "none",
                borderBottom: "1px solid #f3f4f6",
                background: today ? "#f0f9ff" : day ? "#fff" : "#fafafa",
                cursor: day ? "pointer" : "default",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (day) e.currentTarget.style.background = today ? "#e0f2fe" : "#f9fafb";
              }}
              onMouseLeave={(e) => {
                if (day) e.currentTarget.style.background = today ? "#f0f9ff" : "#fff";
              }}
            >
              {day && (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "4px"
                  }}>
                    <span style={{
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      fontSize: "14px",
                      fontWeight: today ? "700" : "500",
                      color: today ? "#fff" : "#374151",
                      background: today ? "#6366f1" : "transparent"
                    }}>
                      {day}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {dayEvents.slice(0, 3).map(event => {
                      const config = eventTypeConfig[event.type] || eventTypeConfig.automation;
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          style={{
                            padding: "4px 6px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "500",
                            background: config.bg,
                            color: config.color,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "pointer",
                            transition: "transform 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {config.icon} {event.title.substring(0, 20)}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{
                        padding: "2px 6px",
                        fontSize: "10px",
                        color: "#6b7280",
                        fontWeight: "500"
                      }}>
                        +{dayEvents.length - 3} flere
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Forklaring */}
      <div style={{
        display: "flex",
        gap: "16px",
        padding: "16px 24px",
        borderTop: "1px solid #e5e7eb",
        background: "#f9fafb",
        flexWrap: "wrap"
      }}>
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background: config.bg,
              border: `2px solid ${config.color}`
            }} />
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {config.icon} {type === "invoice_due" ? "Faktura forfaller" :
                type === "invoice_overdue" ? "Forfalt faktura" :
                type === "recurring_invoice" ? "Gjentakende" :
                type === "scheduled_job" ? "Planlagt jobb" :
                type === "follow_up" ? "Oppfølging" : "Automasjon"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

