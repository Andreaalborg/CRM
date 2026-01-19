"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { MessageSquare, Plus, Send } from "lucide-react";

interface LeadNotesProps {
  submissionId: string;
}

export function LeadNotes({ submissionId }: LeadNotesProps) {
  const [notes, setNotes] = useState<Array<{ id: string; content: string; createdAt: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const router = useRouter();

  async function handleAddNote() {
    if (!newNote.trim()) return;
    
    setIsAdding(true);
    try {
      const response = await fetch(`/api/leads/${submissionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        const note = await response.json();
        setNotes([note, ...notes]);
        setNewNote("");
        setShowInput(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare style={{ width: "20px", height: "20px" }} />
            Notater
          </CardTitle>
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showInput && (
          <div style={{ marginBottom: "16px" }}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Skriv et notat..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                resize: "vertical",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowInput(false);
                  setNewNote("");
                }}
              >
                Avbryt
              </Button>
              <Button 
                size="sm"
                onClick={handleAddNote}
                disabled={isAdding || !newNote.trim()}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Send style={{ width: "14px", height: "14px" }} />
                {isAdding ? "Lagrer..." : "Lagre"}
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showInput ? (
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", padding: "16px 0" }}>
            Ingen notater ennå
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {notes.map((note) => (
              <div 
                key={note.id}
                style={{ 
                  padding: "12px", 
                  background: "#f8fafc", 
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              >
                <p style={{ margin: 0 }}>{note.content}</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "8px 0 0 0" }}>
                  {new Date(note.createdAt).toLocaleDateString("nb-NO", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



