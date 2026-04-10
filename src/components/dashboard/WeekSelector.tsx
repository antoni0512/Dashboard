import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekCycle } from "@/lib/mockData";

interface Props {
  week: WeekCycle;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

export default function WeekSelector({ week, onPrev, onNext, canGoNext }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span>{week.label}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext} disabled={!canGoNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
