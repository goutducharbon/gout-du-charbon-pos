import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteDialog({
  open,
  onOpenChange,
  initialNote,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialNote?: string;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote ?? "");

  useEffect(() => {
    if (open) {
      setNote(initialNote ?? "");
    }
  }, [open, initialNote]);

  const handleConfirm = () => {
    onConfirm(note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-panel">
        <DialogHeader>
          <DialogTitle>Note de cuisine</DialogTitle>
          <DialogDescription>
            Ajoutez une note spéciale pour la cuisine (cuisson, allergies, préférences…).
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Bien cuit, sans oignon, allergique arachides…"
          rows={4}
          className="bg-card"
          autoFocus
        />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
