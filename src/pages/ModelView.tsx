import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/apiClient";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SLUG_TO_MODEL: Record<string, string> = {
  "bom-diff": "BOM Diff",
  "aas-bom-diff": "AAS BOM Diff",
};

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

interface FileEntry {
  id: string;
  file_name: string;
  uploaded_at: string;
  build_type: string;
  release_date: string | null;
}

interface SheetData {
  id: string;
  sheet_name: string;
  headers: string[];
  data: Record<string, unknown>[];
}

const ModelView = () => {
  const { slug } = useParams<{ slug: string }>();
  const modelType = SLUG_TO_MODEL[slug || ""] || slug || "";
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [selectedBuild, setSelectedBuild] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch files for this model type
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("regression_files")
        .select("id, file_name, uploaded_at, build_type, release_date")
        .eq("model_type", modelType)
        .order("uploaded_at", { ascending: false });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      if (data && data.length > 0) {
        setFiles(data);
        // Initial defaults
        const firstBuild = data[0].build_type;
        const firstDate = data[0].release_date || "";
        setSelectedBuild(firstBuild);
        setSelectedDate(firstDate);
        setSelectedFileId(data[0].id);
      } else {
        setFiles([]);
        setSelectedBuild("");
        setSelectedDate("");
        setSelectedFileId("");
        setSheets([]);
        setSelectedSheet("");
      }
      setLoading(false);
    };
    fetchFiles();
  }, [modelType]);

  // Unique release dates for dropdown
  const releaseDates = useMemo(() => {
    const dates = new Set<string>();
    files.forEach((f) => {
      if (f.release_date) {
        dates.add(f.release_date);
      }
    });
    return Array.from(dates).sort().reverse();
  }, [files]);

  // Filtered files by build + date
  const filteredFiles = useMemo(() => {
    let result = files;
    if (selectedBuild) result = result.filter((f) => f.build_type === selectedBuild);
    if (selectedDate) {
      result = result.filter((f) => f.release_date === selectedDate);
    }
    return result;
  }, [files, selectedBuild, selectedDate]);

  // When filters change, select first matching file
  useEffect(() => {
    if (filteredFiles.length > 0 && !filteredFiles.find((f) => f.id === selectedFileId)) {
      setSelectedFileId(filteredFiles[0].id);
    }
  }, [filteredFiles]);

  // Fetch sheets when file changes
  useEffect(() => {
    if (!selectedFileId) { setSheets([]); setSelectedSheet(""); return; }
    setEditedCells({});
    const fetchSheets = async () => {
      const { data } = await supabase
        .from("regression_sheets")
        .select("*")
        .eq("file_id", selectedFileId);
      if (data) {
        const parsed = data.map((s) => ({
          ...s,
          headers: s.headers as string[],
          data: (s.data as unknown as Record<string, unknown>[]) || [],
        }));
        setSheets(parsed);
        if (parsed.length > 0) setSelectedSheet(parsed[0].id);
        else setSelectedSheet("");
      }
    };
    fetchSheets();
  }, [selectedFileId]);

  const currentSheet = sheets.find((s) => s.id === selectedSheet);
  const selectedFile = files.find((f) => f.id === selectedFileId);

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
          if (key in editedCells) {
            newRow[h] = editedCells[key];
          }
        });
        return newRow;
      });

      const { error } = await supabase
        .from("regression_sheets")
        .update({ data: updatedData })
        .eq("id", currentSheet.id);

      if (error) throw error;

      // Update local state
      setSheets((prev) =>
        prev.map((s) => (s.id === currentSheet.id ? { ...s, data: updatedData } : s))
      );
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

  if (files.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h2 className="text-lg font-medium mb-1">No {modelType} files yet</h2>
          <p className="text-muted-foreground mb-4">Upload your first {modelType} regression file.</p>
          <Link to="/upload">
            <Button variant="outline">Upload File</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{modelType}</h1>
            <p className="text-muted-foreground mt-1">
              {filteredFiles.length} file(s)
              {selectedFile?.release_date && (
                <> · Release Date: {new Date(selectedFile.release_date).toLocaleDateString()}</>
              )}
            </p>
          </div>
          {hasEdits && (
            <Button onClick={handleSaveEdits} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Edits
            </Button>
          )}
        </div>

        {/* Selectors row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Build:</label>
            <Select value={selectedBuild} onValueChange={setSelectedBuild}>
              <SelectTrigger className="w-48 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="KB Release">KB Release</SelectItem>
                <SelectItem value="Skinny Release">Skinny Release</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Release Date:</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {releaseDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {new Date(d).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredFiles.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">File:</label>
              <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                <SelectTrigger className="w-72 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {filteredFiles.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.file_name} — {new Date(f.uploaded_at).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sheets.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sheet:</label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                <SelectTrigger className="w-56 bg-card">
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
        </div>

        {/* Data table with editable columns */}
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

export default ModelView;
