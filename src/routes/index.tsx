import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  Keyboard,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Document Autofill Tool | Dynamic Form Fill AI" },
      {
        name: "description",
        content:
          "Upload a document template, parse raw text, review mapped fields, and generate a completed form.",
      },
      { property: "og:title", content: "Document Autofill Tool | Dynamic Form Fill AI" },
      {
        property: "og:description",
        content:
          "Upload a document template, parse raw text, review mapped fields, and generate a completed form.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const sampleRawText =
  "Document package for Road Improvement Project - Phase II, project number CIP-24-118. Principal: ABC Construction LLC, 1250 Alameda Street, Los Angeles, CA 90012. Obligee: City of Montebello. Bid package: Street resurfacing, traffic signal upgrades, and sidewalk accessibility improvements. Bid amount: $250,000. Required bond percentage: 10%. Bid opening date: October 18, 2026 at 2:00 PM Pacific. Bond type: Bid Bond. Surety: Pacific Guarantee Surety Company. Jurisdiction: California. Bond validity: 90 days after bid opening. Authorized signer: Jordan Diaz. The obligee address and signer title are not included in the request package.";

const fieldBlueprints = [
  {
    id: "project",
    label: "Project name",
    value: "Road Improvement Project - Phase II",
    status: "verified",
    confidence: "98%",
    source: "Project title",
    required: true,
  },
  {
    id: "projectNumber",
    label: "Project number",
    value: "CIP-24-118",
    status: "verified",
    confidence: "93%",
    source: "Project number",
    required: true,
  },
  {
    id: "contractor",
    label: "Contractor / principal",
    value: "ABC Construction LLC",
    status: "verified",
    confidence: "96%",
    source: "Principal",
    required: true,
  },
  {
    id: "contractorAddress",
    label: "Contractor address",
    value: "1250 Alameda Street, Los Angeles, CA 90012",
    status: "verified",
    confidence: "94%",
    source: "Principal address",
    required: true,
  },
  {
    id: "obligee",
    label: "Obligee",
    value: "City of Montebello",
    status: "review",
    confidence: "82%",
    source: "Obligee",
    required: true,
  },
  {
    id: "address",
    label: "Obligee address",
    value: "",
    status: "missing",
    confidence: "0%",
    source: "Not found",
    required: true,
  },
  {
    id: "bidPackage",
    label: "Bid package / scope",
    value: "Street resurfacing, traffic signal upgrades, and sidewalk accessibility improvements",
    status: "review",
    confidence: "79%",
    source: "Bid package description",
    required: true,
  },
  {
    id: "amount",
    label: "Bid amount",
    value: "$250,000.00",
    status: "verified",
    confidence: "99%",
    source: "Bid amount",
    required: true,
  },
  {
    id: "bidPercentage",
    label: "Bond percentage",
    value: "10%",
    status: "verified",
    confidence: "92%",
    source: "Required bond percentage",
    required: true,
  },
  {
    id: "date",
    label: "Bid opening date",
    value: "October 18, 2026",
    status: "verified",
    confidence: "95%",
    source: "Bid opening date",
    required: true,
  },
  {
    id: "bidTime",
    label: "Bid opening time",
    value: "2:00 PM Pacific",
    status: "verified",
    confidence: "90%",
    source: "Bid opening time",
    required: true,
  },
  {
    id: "surety",
    label: "Surety company",
    value: "Pacific Guarantee Surety Company",
    status: "verified",
    confidence: "91%",
    source: "Surety",
    required: true,
  },
  {
    id: "suretyAddress",
    label: "Surety address",
    value: "",
    status: "missing",
    confidence: "0%",
    source: "Not found",
    required: false,
  },
  {
    id: "bondType",
    label: "Document type",
    value: "Bid Bond",
    status: "verified",
    confidence: "97%",
    source: "Bond type",
    required: true,
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    value: "California",
    status: "verified",
    confidence: "88%",
    source: "Jurisdiction",
    required: true,
  },
  {
    id: "validityPeriod",
    label: "Validity period",
    value: "90 days after bid opening",
    status: "verified",
    confidence: "86%",
    source: "Bond validity",
    required: true,
  },
  {
    id: "authorizedSigner",
    label: "Authorized signer",
    value: "Jordan Diaz",
    status: "verified",
    confidence: "84%",
    source: "Authorized signer",
    required: true,
  },
  {
    id: "signerTitle",
    label: "Signer title",
    value: "",
    status: "missing",
    confidence: "0%",
    source: "Not found",
    required: true,
  },
] as const;

const workflowSteps = [
  { id: "upload", label: "Upload Template" },
  { id: "raw", label: "Provide Raw Text" },
  { id: "extract", label: "Extract & Map" },
  { id: "review", label: "Review & Edit" },
  { id: "fill", label: "Fill Template" },
  { id: "store", label: "Store" },
] as const;

type FieldId = (typeof fieldBlueprints)[number]["id"];
type FieldValues = Record<FieldId, string>;
type WorkflowStage = "upload" | "raw" | "mapped" | "generated";

const fieldPageMap: Record<FieldId, number> = {
  project: 1,
  projectNumber: 1,
  contractor: 1,
  contractorAddress: 1,
  obligee: 1,
  address: 1,
  bidPackage: 2,
  amount: 1,
  bidPercentage: 2,
  date: 1,
  bidTime: 2,
  surety: 2,
  suretyAddress: 2,
  bondType: 2,
  jurisdiction: 2,
  validityPeriod: 2,
  authorizedSigner: 3,
  signerTitle: 3,
};

function Index() {
  const [templateName, setTemplateName] = useState("");
  const [rawText, setRawText] = useState(sampleRawText);
  const [selected, setSelected] = useState<FieldId>("address");
  const [values, setValues] = useState<FieldValues>(() =>
    fieldBlueprints.reduce(
      (current, field) => ({ ...current, [field.id]: field.value }),
      {} as FieldValues,
    ),
  );
  const [page, setPage] = useState(1);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [zoom, setZoom] = useState(100);

  const hasTemplate = Boolean(templateName);
  const hasRawText = rawText.trim().length > 0;
  const canAnalyze = hasTemplate && hasRawText && !isAnalyzing;
  const allRequiredComplete = fieldBlueprints
    .filter((field) => field.required)
    .every((field) => values[field.id].trim());
  const mappedCount = fieldBlueprints.filter((field) => values[field.id].trim()).length;
  const missingCount = fieldBlueprints.length - mappedCount;
  const reviewCount = fieldBlueprints.filter(
    (field) => field.status === "review" && values[field.id].trim(),
  ).length;
  const verifiedCount = Math.max(mappedCount - reviewCount, 0);
  const canGenerate = allRequiredComplete && workflowStage === "mapped";
  const isWorkspace = workflowStage === "mapped" || workflowStage === "generated";

  const activeStepIndex = useMemo(() => {
    if (workflowStage === "generated") return 5;
    if (workflowStage === "mapped" && allRequiredComplete) return 4;
    if (workflowStage === "mapped") return 3;
    if (hasTemplate && hasRawText) return 2;
    if (hasTemplate) return 1;
    return 0;
  }, [allRequiredComplete, hasRawText, hasTemplate, workflowStage]);

  const updateField = (id: FieldId, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setTemplateName(file.name);
    setWorkflowStage("raw");
  };

  const runAnalysis = () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setWorkflowStage("mapped");
      setSelected("address");
      setPage(1);
    }, 650);
  };

  const generateDocument = () => {
    if (!canGenerate) return;

    setWorkflowStage("generated");
    setGenerated(true);
  };

  const saveDraft = () => {
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 1600);
  };

  const adjustZoom = (delta: number) => {
    setZoom((current) => Math.min(125, Math.max(75, current + delta)));
  };

  const queueDownload = () => {
    setDownloadStarted(true);
    window.setTimeout(() => setDownloadStarted(false), 1800);
  };

  const returnToUpload = () => {
    setGenerated(false);
    setWorkflowStage(hasTemplate ? "raw" : "upload");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-5 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileCheck2 size={19} />
          </span>
          <div>
            <span className="font-display text-lg font-bold text-navy">Dynamic Form Fill AI</span>
            <p className="text-xs font-semibold text-muted-foreground">
              AI document and form autofill
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground xl:flex">
          {workflowSteps.map((step, index) => (
            <WorkflowPill
              key={step.id}
              label={step.label}
              complete={index < activeStepIndex}
              active={index === activeStepIndex}
            />
          ))}
        </div>
        <button
          aria-label="User menu"
          className="flex size-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-primary-foreground"
          type="button"
        >
          JD
        </button>
      </header>

      {isWorkspace ? (
        <WorkspaceScreen
          allRequiredComplete={allRequiredComplete}
          canGenerate={canGenerate}
          draftSaved={draftSaved}
          downloadStarted={downloadStarted}
          fieldStats={{ mappedCount, missingCount, reviewCount, verifiedCount }}
          generated={generated}
          page={page}
          queueDownload={queueDownload}
          returnToUpload={returnToUpload}
          saveDraft={saveDraft}
          selected={selected}
          setGenerated={setGenerated}
          setPage={setPage}
          setSelected={setSelected}
          templateName={templateName}
          updateField={updateField}
          values={values}
          zoom={zoom}
          adjustZoom={adjustZoom}
          generateDocument={generateDocument}
        />
      ) : (
        <UploadSlide
          canAnalyze={canAnalyze}
          handleFileChange={handleFileChange}
          isAnalyzing={isAnalyzing}
          rawText={rawText}
          runAnalysis={runAnalysis}
          setRawText={setRawText}
          setTemplateName={setTemplateName}
          setWorkflowStage={setWorkflowStage}
          templateName={templateName}
        />
      )}
    </main>
  );
}

function UploadSlide({
  canAnalyze,
  handleFileChange,
  isAnalyzing,
  rawText,
  runAnalysis,
  setRawText,
  setTemplateName,
  setWorkflowStage,
  templateName,
}: {
  canAnalyze: boolean;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  rawText: string;
  runAnalysis: () => void;
  setRawText: (value: string) => void;
  setTemplateName: (value: string) => void;
  setWorkflowStage: (value: WorkflowStage) => void;
  templateName: string;
}) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-start justify-center bg-muted/45 px-5 py-4 lg:px-8">
      <div className="w-full max-w-[760px] rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 lg:p-5">
          <p className="text-xs font-bold uppercase text-muted-foreground">Source package</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
            Upload & raw text
          </h1>
        </div>

        <div className="space-y-3 p-4 lg:p-5">
          <div className="rounded-md border border-border p-3">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <FileUp size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">PDF form template</p>
                <p className="break-words text-xs text-muted-foreground">
                  {templateName || "Required system-generated PDF form"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <label htmlFor="template-upload" className="cursor-pointer">
                  <FileUp size={15} />
                  Upload PDF
                </label>
              </Button>
              <input
                id="template-upload"
                className="sr-only"
                accept="application/pdf"
                type="file"
                onChange={handleFileChange}
              />
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setTemplateName("BID_BOND_TEMPLATE.PDF");
                  setWorkflowStage("raw");
                }}
              >
                Use sample
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Keyboard size={18} />
              </span>
              <div>
                <p className="text-sm font-bold">Raw document text</p>
                <p className="text-xs text-muted-foreground">
                  {rawText.trim().length} characters available for extraction
                </p>
              </div>
            </div>
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              className="min-h-36 resize-none text-sm leading-5 lg:min-h-40"
              placeholder="Paste Bid/Bond business information here"
            />
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Brain size={18} />
              </span>
              <div>
                <p className="text-sm font-bold">AI extraction & field mapping</p>
                <p className="text-xs text-muted-foreground">
                  {canAnalyze
                    ? "Ready to parse the source package"
                    : "Upload a template and provide text to continue"}
                </p>
              </div>
            </div>
            <Button className="h-10 w-full" onClick={runAnalysis} disabled={!canAnalyze}>
              {isAnalyzing ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {isAnalyzing ? "Analyzing source package" : "Run AI parse & map"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkspaceScreen({
  allRequiredComplete,
  canGenerate,
  draftSaved,
  downloadStarted,
  fieldStats,
  generated,
  page,
  queueDownload,
  returnToUpload,
  saveDraft,
  selected,
  setGenerated,
  setPage,
  setSelected,
  templateName,
  updateField,
  values,
  zoom,
  adjustZoom,
  generateDocument,
}: {
  allRequiredComplete: boolean;
  canGenerate: boolean;
  draftSaved: boolean;
  downloadStarted: boolean;
  fieldStats: {
    mappedCount: number;
    missingCount: number;
    reviewCount: number;
    verifiedCount: number;
  };
  generated: boolean;
  page: number;
  queueDownload: () => void;
  returnToUpload: () => void;
  saveDraft: () => void;
  selected: FieldId;
  setGenerated: (value: boolean) => void;
  setPage: (value: number) => void;
  setSelected: (value: FieldId) => void;
  templateName: string;
  updateField: (id: FieldId, value: string) => void;
  values: FieldValues;
  zoom: number;
  adjustZoom: (delta: number) => void;
  generateDocument: () => void;
}) {
  const selectField = (fieldId: FieldId) => {
    setSelected(fieldId);
    setPage(fieldPageMap[fieldId]);
  };

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 lg:px-8">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <FileText size={14} />
            <span className="break-words">{templateName || "BID_BOND_TEMPLATE.PDF"}</span>
            <span className="text-success">Template analyzed</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Review mapped form</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={returnToUpload}>
            <ArrowLeft size={16} />
            Source
          </Button>
          <Button variant="outline" onClick={saveDraft}>
            {draftSaved ? <Check size={16} /> : <Save size={16} />}
            {draftSaved ? "Draft saved" : "Save draft"}
          </Button>
          <Button onClick={generateDocument} disabled={!canGenerate}>
            <FileCheck2 size={16} />
            Approve & generate
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
        <section className="min-h-0 min-w-0 border-b border-border bg-muted/60 xl:border-b-0 xl:border-r">
          <div className="flex h-12 items-center justify-between border-b border-border bg-card px-5">
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">
                PDF template
              </span>
              <span className="ml-3 text-xs text-muted-foreground">
                {fieldBlueprints.length} fields | 4 checkboxes
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Zoom out"
                onClick={() => adjustZoom(-25)}
              >
                <Minus size={15} />
              </Button>
              <span className="w-12 text-center text-xs font-semibold">{zoom}%</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Zoom in"
                onClick={() => adjustZoom(25)}
              >
                <Plus size={15} />
              </Button>
            </div>
          </div>
          <div className="flex h-[calc(100%-6.5rem)] items-start justify-center overflow-auto p-5 lg:p-8">
            <div
              className="relative aspect-[0.77] w-full max-w-[590px] border border-border bg-card p-[8%] shadow-lg"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <PdfPage page={page} selected={selected} setSelected={selectField} values={values} />
              <div className="absolute bottom-6 left-0 right-0 text-center text-[9px] text-muted-foreground">
                Page {page} of 3
              </div>
            </div>
          </div>
          <div className="flex h-14 items-center justify-center gap-2 border-t border-border bg-card">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPage(Math.max(1, page - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </Button>
            <span className="px-4 text-xs font-semibold">Page {page} of 3</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPage(Math.min(3, page + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-card">
          <div className="border-b border-border p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Mapped information
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">Review & approve</h2>
              </div>
              <span className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-bold text-secondary-foreground">
                {fieldStats.mappedCount} / {fieldBlueprints.length} mapped
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 border border-border">
              <Stat value={String(fieldStats.verifiedCount)} label="Verified" tone="text-success" />
              <Stat value={String(fieldStats.reviewCount)} label="Review" tone="text-warning" />
              <Stat value={String(fieldStats.missingCount)} label="Missing" tone="text-primary" />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-auto p-5 lg:p-6">
            {fieldBlueprints.map((field) => {
              const currentMissing = field.required && !values[field.id].trim();
              const status = currentMissing
                ? "missing"
                : field.status === "review"
                  ? "review"
                  : "verified";

              return (
                <label
                  key={field.id}
                  className={`block cursor-pointer rounded-md border p-3 transition-colors ${
                    selected === field.id ? "border-navy bg-accent/35" : "border-border"
                  }`}
                  onClick={() => selectField(field.id)}
                >
                  <span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
                    <span>{field.label}</span>
                    <Status status={status} />
                  </span>
                  <input
                    value={values[field.id]}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    placeholder={currentMissing ? "Enter required value" : undefined}
                    className="h-9 w-full border-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-primary"
                  />
                  <span className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Source: {field.source}</span>
                    <span>Confidence: {currentMissing ? "0%" : field.confidence}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="border-t border-border bg-card p-5">
            <div
              className={`mb-3 flex items-center gap-2 text-xs ${
                allRequiredComplete ? "text-success" : "text-primary"
              }`}
            >
              {allRequiredComplete ? <Check size={15} /> : <AlertTriangle size={15} />}
              {allRequiredComplete
                ? "All required fields are complete."
                : "Required fields must be completed before generation."}
            </div>
            <Button className="w-full" onClick={generateDocument} disabled={!canGenerate}>
              Approve & generate <ChevronRight size={16} />
            </Button>
          </div>
        </section>
      </div>

      {generated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-8 text-center shadow-xl">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-success">
              <Check size={28} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">Document Generated</h2>
            <p className="mt-2 text-sm text-muted-foreground">Completed_Form_Output.pdf</p>
            <div className="my-6 border-y border-border py-4 text-xs text-muted-foreground">
              Template metadata stored | Review record saved | Output ready
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setGenerated(false)}>
                Back
              </Button>
              <Button className="flex-1" onClick={queueDownload}>
                {downloadStarted ? <Check size={16} /> : <Download size={16} />}
                {downloadStarted ? "Download queued" : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WorkflowPill({
  label,
  complete,
  active,
}: {
  label: string;
  complete: boolean;
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 ${
        complete
          ? "bg-accent text-success"
          : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {complete && <Check size={13} className="mr-1 inline" />}
      {label}
    </span>
  );
}

function PdfPage({
  page,
  selected,
  setSelected,
  values,
}: {
  page: number;
  selected: FieldId;
  setSelected: (value: FieldId) => void;
  values: FieldValues;
}) {
  if (page === 2) {
    return (
      <>
        <PdfHeading title="BID BOND" subtitle="PROJECT TERMS AND SURETY DETAILS" />
        <p className="mt-8 text-[11px] leading-6 text-muted-foreground">
          The surety and principal agree that the following extracted terms will govern the bid
          security for the referenced solicitation.
        </p>
        <PdfField
          label="BID PACKAGE / SCOPE"
          value={values.bidPackage}
          active={selected === "bidPackage"}
          warning
          onClick={() => setSelected("bidPackage")}
        />
        <div className="grid grid-cols-2 gap-4">
          <PdfField
            label="BOND PERCENTAGE"
            value={values.bidPercentage}
            active={selected === "bidPercentage"}
            onClick={() => setSelected("bidPercentage")}
          />
          <PdfField
            label="BID OPENING TIME"
            value={values.bidTime}
            active={selected === "bidTime"}
            onClick={() => setSelected("bidTime")}
          />
        </div>
        <PdfField
          label="SURETY COMPANY"
          value={values.surety}
          active={selected === "surety"}
          onClick={() => setSelected("surety")}
        />
        <PdfField
          label="SURETY ADDRESS"
          value={values.suretyAddress || "Optional field"}
          active={selected === "suretyAddress"}
          missing={!values.suretyAddress}
          onClick={() => setSelected("suretyAddress")}
        />
        <div className="grid grid-cols-2 gap-4">
          <PdfField
            label="DOCUMENT TYPE"
            value={values.bondType}
            active={selected === "bondType"}
            onClick={() => setSelected("bondType")}
          />
          <PdfField
            label="JURISDICTION"
            value={values.jurisdiction}
            active={selected === "jurisdiction"}
            onClick={() => setSelected("jurisdiction")}
          />
        </div>
        <PdfField
          label="VALIDITY PERIOD"
          value={values.validityPeriod}
          active={selected === "validityPeriod"}
          onClick={() => setSelected("validityPeriod")}
        />
      </>
    );
  }

  if (page === 3) {
    return (
      <>
        <PdfHeading title="BID BOND" subtitle="EXECUTION AND ACKNOWLEDGEMENT" />
        <p className="mt-8 text-[11px] leading-6 text-muted-foreground">
          The approved values below are reserved for final execution, signature, seal, and internal
          validation of the completed document.
        </p>
        <PdfField
          label="AUTHORIZED SIGNER"
          value={values.authorizedSigner}
          active={selected === "authorizedSigner"}
          onClick={() => setSelected("authorizedSigner")}
        />
        <PdfField
          label="SIGNER TITLE"
          value={values.signerTitle || "Required field"}
          active={selected === "signerTitle"}
          missing={!values.signerTitle}
          onClick={() => setSelected("signerTitle")}
        />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="min-h-20 border border-dashed border-border p-3 text-[10px] text-muted-foreground">
            Principal signature block
          </div>
          <div className="min-h-20 border border-dashed border-border p-3 text-[10px] text-muted-foreground">
            Surety signature block
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="min-h-16 border border-dashed border-border p-3 text-[10px] text-muted-foreground">
            Corporate seal
          </div>
          <div className="min-h-16 border border-dashed border-border p-3 text-[10px] text-muted-foreground">
            Notary acknowledgement
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-[10px]">
          <span>[x] Reviewed by user</span>
          <span>[ ] Ready for countersignature</span>
        </div>
      </>
    );
  }

  return (
    <>
      <PdfHeading title="BID BOND" subtitle="KNOW ALL PERSONS BY THESE PRESENTS" />
      <p className="mt-8 text-[11px] leading-6 text-muted-foreground">
        That we, the undersigned Principal and Surety, are firmly bound unto the Obligee in the
        penal sum shown below, for payment of which we bind ourselves.
      </p>
      <PdfField
        label="PROJECT NAME"
        value={values.project}
        active={selected === "project"}
        onClick={() => setSelected("project")}
      />
      <PdfField
        label="PROJECT NUMBER"
        value={values.projectNumber}
        active={selected === "projectNumber"}
        onClick={() => setSelected("projectNumber")}
      />
      <PdfField
        label="CONTRACTOR / PRINCIPAL"
        value={values.contractor}
        active={selected === "contractor"}
        onClick={() => setSelected("contractor")}
      />
      <PdfField
        label="CONTRACTOR ADDRESS"
        value={values.contractorAddress}
        active={selected === "contractorAddress"}
        onClick={() => setSelected("contractorAddress")}
      />
      <div className="grid grid-cols-2 gap-4">
        <PdfField
          label="BID AMOUNT"
          value={values.amount}
          active={selected === "amount"}
          onClick={() => setSelected("amount")}
        />
        <PdfField
          label="BID OPENING DATE"
          value={values.date}
          active={selected === "date"}
          onClick={() => setSelected("date")}
        />
      </div>
      <PdfField
        label="OBLIGEE"
        value={values.obligee}
        active={selected === "obligee"}
        warning
        onClick={() => setSelected("obligee")}
      />
      <PdfField
        label="OBLIGEE ADDRESS"
        value={values.address || "Required field"}
        active={selected === "address"}
        missing={!values.address}
        onClick={() => setSelected("address")}
      />
    </>
  );
}

function PdfHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center font-serif">
      <p className="text-xs font-bold tracking-[0.18em]">{title}</p>
      <p className="mt-2 text-[10px]">{subtitle}</p>
    </div>
  );
}

function PdfField({
  label,
  value,
  active,
  warning,
  missing,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  warning?: boolean;
  missing?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-5 w-full text-left ${active ? "outline outline-2 outline-navy outline-offset-2" : ""}`}
    >
      <span className="block text-[9px] font-bold text-muted-foreground">{label}</span>
      <span
        className={`mt-1 block min-h-7 border-b px-1 py-1 text-[11px] font-semibold ${
          missing
            ? "border-primary bg-primary/5 text-primary"
            : warning
              ? "border-warning bg-warning/10"
              : "border-secondary bg-secondary/15"
        }`}
      >
        {value}
      </span>
    </button>
  );
}

function Status({ status }: { status: string }) {
  if (status === "missing") {
    return (
      <span className="text-primary">
        <AlertTriangle size={13} className="mr-1 inline" />
        Missing
      </span>
    );
  }

  if (status === "review") {
    return (
      <span className="text-warning">
        <AlertTriangle size={13} className="mr-1 inline" />
        Review
      </span>
    );
  }

  return (
    <span className="text-success">
      <Check size={13} className="mr-1 inline" />
      Verified
    </span>
  );
}
function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="border-r border-border p-3 text-center last:border-r-0">
      <strong className={`block font-display text-lg ${tone}`}>{value}</strong>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}
