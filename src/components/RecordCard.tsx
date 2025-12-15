import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

interface RecordCardProps {
  date: string;
  amount: number;
  reason?: string;
  personName?: string;
  status?: string;
  type: "income" | "expense" | "toGive" | "debt";
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RecordCard({
  date,
  amount,
  reason,
  personName,
  status,
  type,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: RecordCardProps) {
  const amountColorClass = type === "income" ? "text-success" : "text-destructive";
  const prefix = type === "expense" ? "-" : "";

  return (
    <Card className="animate-fade-in hover-scale">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-xl font-bold ${amountColorClass}`}>
                {prefix}PKR {Math.round(Number(amount)).toLocaleString()}
              </span>
              {status && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  status.toLowerCase().includes("paid") || status.toLowerCase().includes("returned")
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}>
                  {status}
                </span>
              )}
            </div>
            
            {(reason || personName) && (
              <p className="text-sm text-muted-foreground truncate mb-1">
                {personName ? `${personName}${reason ? ` - ${reason}` : ""}` : reason}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </p>
          </div>

          {(canEdit || canDelete) && (
            <div className="flex gap-1 shrink-0">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
