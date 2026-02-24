import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/apiClient";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MODEL_TYPES = ["BOM Diff", "AAS BOM Diff"];

const BUILD_TYPES = ["KB Release", "Skinny Release"];

// Generate week options: current week + next 4 weeks
const generateWeekOptions = () => {
  const weeks: { value: string; label: string }[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  start.setHours(0, 0, 0, 0);

  for (let i = -2; i <= 4; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({
      value: format(weekStart, "yyyy-MM-dd"),
      label: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`,
    });
  }
  return weeks;
};

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState("");
  const [buildType, setBuildType] = useState("");
  const [releaseWeek, setReleaseWeek] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const weekOptions = generateWeekOptions();

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast({ title: "Invalid file", description: "Please upload an Excel or CSV file.", variant: "destructive" });
      return;
    }
    setFile(f);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file || !modelType || !buildType) {
      toast({ title: "Missing fields", description: "Please select model type, build type, and file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetNames = workbook.SheetNames;

      const { data: fileRecord, error: fileError } = await supabase
        .from("regression_files")
        .insert({
          file_name: file.name,
          model_type: modelType,
          build_type: buildType,
          release_date: releaseWeek || null,
          sheet_names: sheetNames,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

        const { error: sheetError } = await supabase.from("regression_sheets").insert([insertData]);
        if (sheetError) throw sheetError;
      }

      toast({ title: "Upload successful", description: `${file.name} with ${sheetNames.length} sheet(s) uploaded.` });
      navigate(`/file/${fileRecord.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Upload Regression File</h1>
        <p className="text-muted-foreground mb-8">Upload an Excel file to store and review regression data.</p>

        <div className="space-y-6">
          {/* Model Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Model Type</label>
            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder="Select model type..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {MODEL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Build Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Build Type</label>
            <Select value={buildType} onValueChange={setBuildType}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder="Select build type..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {BUILD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Release Week */}
          <div>
            <label className="text-sm font-medium mb-2 block">Release Week</label>
            <Select value={releaseWeek} onValueChange={setReleaseWeek}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder="Select release week..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {weekOptions.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Zone */}
          <div>
            <label className="text-sm font-medium mb-2 block">Excel File</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-accent" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-4 p-1 rounded-md hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">Drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse — .xlsx, .xls, .csv</p>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !modelType || !buildType || uploading}
            className="w-full h-12 text-base"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4 mr-2" />
                Upload & Process
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
