import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/apiClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EDITABLE_COLUMNS = [
  "KE Comments (Related ALM / PERT ID)",
  "KE Comments (Related ALM/PERT ID)",
  "KB Go/No Go",
  "ke comments (related alm / pert id)",
  "ke comments (related alm/pert id)",
  "kb go/no go",
  "KE Comments",
  "ke comments",
  "KB Go No Go",
  "kb go no go",
];

const isEditableColumn = (header: string) =>
  EDITABLE_COLUMNS.some((c) => c.toLowerCase() === header.toLowerCase());

interface SheetData {
  id: string;
  sheet_name: string;
  headers: string[];
  data: Record<string, unknown>[];
}

const FileView = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<{ file_name: string; model_type: string; uploaded_at: string; sheet_names: string[] } | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: fileData } = await supabase.from("regression_files").select("*").eq("id", id).single();
      if (fileData) setFile(fileData);

      const { data: sheetsData } = await supabase.from("regression_sheets").select("*").eq("file_id", id);
      if (sheetsData) {
        const parsed = sheetsData.map((s) => ({
          ...s,
          headers: s.headers as string[],
          data: (s.data as unknown as Record<string, unknown>[]) || [],
        }));
        setSheets(parsed);
        if (parsed.length > 0) setSelectedSheet(parsed[0].id);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const currentSheet = sheets.find((s) => s.id === selectedSheet);

  const handleCellEdit = useCallback((rowIdx: number, header: string, value: string) => {
    setEditedCells((prev) => ({ ...prev, [`${rowIdx}__${header}`]: value }));
  }, []);

  const getCellValue = (rowIdx: number, header: string, original: unknown) => {
    const key = `${rowIdx}__${header}`;
    return key in editedCells ? editedCells[key] : String(original ?? "");
  };

  const hasEdits = Object.keys(editedCells).length > 0;

  const handleSaveEdits = async () => {
    if (!currentSheet || !hasEdits) return;
    setSaving(true);
    try {
      const updatedData = currentSheet.data.map((row, i) => {
        const newRow = { ...row };
        currentSheet.headers.forEach((h) => {
          const key = `${i}__${h}`;
          if (key in editedCells) newRow[h] = editedCells[key];
        });
        return newRow;
      });

      const { error } = await supabase
        .from("regression_sheets")
        .update({ data: updatedData })
        .eq("id", currentSheet.id);

      if (error) throw error;
      setSheets((prev) => prev.map((s) => (s.id === currentSheet.id ? { ...s, data: updatedData } : s)));
      setEditedCells({});
      toast({ title: "Saved", description: "Your edits have been saved successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!file) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">File not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{file.file_name}</h1>
              <p className="text-sm text-muted-foreground">
                {file.model_type} · {new Date(file.uploaded_at).toLocaleDateString()} · {sheets.length} sheet(s)
              </p>
            </div>
          </div>
          {hasEdits && (
            <Button onClick={handleSaveEdits} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Edits
            </Button>
          )}
        </div>

        {sheets.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Sheet:</label>
            <Select value={selectedSheet} onValueChange={(v) => { setSelectedSheet(v); setEditedCells({}); }}>
              <SelectTrigger className="w-64 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {sheets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.sheet_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentSheet && currentSheet.data.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="data-table-header">#</th>
                    {currentSheet.headers.map((h) => (
                      <th
                        key={h}
                        className={`data-table-header whitespace-nowrap ${isEditableColumn(h) ? "bg-primary/10 text-primary" : ""}`}
                      >
                        {h}
                        {isEditableColumn(h) && <span className="ml-1 text-[10px] opacity-60">✏️</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSheet.data.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="data-table-cell text-muted-foreground">{i + 1}</td>
                      {currentSheet.headers.map((h) =>
                        isEditableColumn(h) ? (
                          <td key={h} className="px-1 py-1 border-b border-border">
                            <Input
                              value={getCellValue(i, h, row[h])}
                              onChange={(e) => handleCellEdit(i, h, e.target.value)}
                              className="h-8 text-sm bg-primary/5 border-primary/20 focus:border-primary font-mono min-w-[200px]"
                            />
                          </td>
                        ) : (
                          <td key={h} className="data-table-cell whitespace-nowrap">
                            {String(row[h] ?? "")}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-xl bg-card">
            No data in this sheet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FileView;
