import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck2,
  FileText,
  House,
  Keyboard,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BondPdfPreview } from "@/components/BondPdfPreview";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bondTemplates,
  bondValidationError,
  currencyCents,
  currencyWords,
  formatCurrency,
  initialBondValues,
  isBondFieldMapped,
  type BondField,
  type BondFieldValue,
  type BondTemplate,
  type BondValues,
} from "@/lib/bond-templates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Document Autofill Tool | Dynamic Form Fill AI" },
      {
        name: "description",
        content: "Choose a bond form, review mapped fields, and generate a completed PDF.",
      },
      { property: "og:title", content: "Document Autofill Tool | Dynamic Form Fill AI" },
      {
        property: "og:description",
        content: "Choose a bond form, review mapped fields, and generate a completed PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const workflowSteps = [
  { id: "choose", label: "Choose Bond Form" },
  { id: "source", label: "Review Source Data" },
  { id: "extract", label: "Extract & Map" },
  { id: "review", label: "Review & Edit" },
  { id: "fill", label: "Fill Template" },
  { id: "store", label: "Store" },
] as const;

const zoomLevels = [75, 100, 125, 150, 175, 200] as const;
const defaultZoom = 150;
const processingSteps = [
  "Finding empty fields…",
  "Reading source details…",
  "Mapping values…",
  "Checking missing information…",
  "Opening review…",
] as const;

type WorkflowStage = "landing" | "choose" | "mapped" | "generated";
type ReviewFilter = "all" | "verified" | "review" | "missing";

function reviewFieldStatus(field: BondField, values: BondValues): Exclude<ReviewFilter, "all"> {
  if (!isBondFieldMapped(field, values)) return "missing";
  return field.status === "review" ? "review" : "verified";
}

function Index() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = bondTemplates.find((entry) => entry.id === templateId) ?? null;
  const [values, setValues] = useState<BondValues>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("landing");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);

  const validationError = template ? bondValidationError(template, values) : null;
  const allRequiredComplete = Boolean(template) && validationError === null;
  const fields = template?.fields ?? [];
  const mappedCount = fields.filter((field) => isBondFieldMapped(field, values)).length;
  const missingCount = fields.length - mappedCount;
  const reviewCount = fields.filter(
    (field) => field.status === "review" && isBondFieldMapped(field, values),
  ).length;
  const verifiedCount = Math.max(mappedCount - reviewCount, 0);
  const canAnalyze = Boolean(template) && !isAnalyzing;
  const canGenerate = allRequiredComplete && workflowStage === "mapped" && !isGenerating;
  const isWorkspace = workflowStage === "mapped" || workflowStage === "generated";

  const activeStepIndex = useMemo(() => {
    if (workflowStage === "landing") return -1;
    if (workflowStage === "generated") return 5;
    if (workflowStage === "mapped" && allRequiredComplete) return 4;
    if (workflowStage === "mapped") return 3;
    if (isAnalyzing) return 2;
    if (template) return 1;
    return 0;
  }, [allRequiredComplete, isAnalyzing, template, workflowStage]);

  useEffect(() => {
    if (!isAnalyzing || !template) return;

    const timers = processingSteps
      .slice(1)
      .map((_, index) => window.setTimeout(() => setAnalysisStep(index + 1), (index + 1) * 800));
    timers.push(
      window.setTimeout(() => {
        setIsAnalyzing(false);
        setWorkflowStage("mapped");
        setSelected(template.fields.find((field) => field.page === 1)?.id ?? null);
        setPage(1);
      }, processingSteps.length * 800),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [isAnalyzing, template]);

  useEffect(() => {
    return () => {
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [generatedUrl]);

  const chooseTemplate = (id: string) => {
    const next = bondTemplates.find((entry) => entry.id === id);
    if (!next) return;
    setIsAnalyzing(false);
    setTemplateId(id);
    setValues(initialBondValues(next));
    setSelected(null);
    setPage(1);
    setZoom(defaultZoom);
    setGenerated(false);
    setGeneratedUrl(null);
    setGenerationError(null);
    setWorkflowStage("choose");
  };

  const updateField = (id: string, value: BondFieldValue) => {
    setValues((current) => {
      const next = { ...current, [id]: value };
      if (id === "bidAmount" && template?.bidPercent === 10) {
        const cents = currencyCents(String(value));
        const bondCents = cents === null ? null : Math.round(cents / 10);
        next["bondAmount"] = bondCents === null ? "" : formatCurrency(bondCents);
        const wordsId = template.fields.some((field) => field.id === "penalSumWords")
          ? "penalSumWords"
          : "bondAmountWords";
        if (template.fields.some((field) => field.id === wordsId))
          next[wordsId] = bondCents === null ? "" : currencyWords(bondCents);
      } else if (id === "bondAmount") {
        const cents = currencyCents(String(value));
        const wordsId = template?.fields.some((field) => field.id === "penalSumWords")
          ? "penalSumWords"
          : "bondAmountWords";
        if (template?.fields.some((field) => field.id === wordsId))
          next[wordsId] = cents === null ? "" : currencyWords(cents);
      }
      return next;
    });
    setGeneratedUrl(null);
    setGenerationError(null);
  };

  const runAnalysis = () => {
    if (!template || !canAnalyze) return;
    setValues(initialBondValues(template));
    setZoom(defaultZoom);
    setAnalysisStep(0);
    setIsAnalyzing(true);
    setGenerationError(null);
  };

  const generateDocument = async () => {
    if (!template || !canGenerate) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const { generateBondPdf } = await import("@/lib/bond-pdf");
      const bytes = await generateBondPdf(template, values);
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
      setGeneratedUrl(URL.createObjectURL(blob));
      setWorkflowStage("generated");
      setGenerated(true);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "PDF generation failed. Try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = () => {
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 1600);
  };

  const adjustZoom = (delta: number) => {
    setZoom((current) => {
      const currentIndex = zoomLevels.findIndex((level) => level === current);
      const safeIndex = currentIndex === -1 ? zoomLevels.indexOf(defaultZoom) : currentIndex;
      const nextIndex = Math.min(
        zoomLevels.length - 1,
        Math.max(0, safeIndex + (delta > 0 ? 1 : -1)),
      );
      return zoomLevels[nextIndex] ?? current;
    });
  };

  const returnToSource = () => {
    setGenerated(false);
    setGeneratedUrl(null);
    setWorkflowStage("choose");
  };

  const returnHome = () => {
    setIsAnalyzing(false);
    setGenerated(false);
    setGeneratedUrl(null);
    setWorkflowStage("landing");
  };

  return (
    <main className="min-h-screen bg-background">
      {workflowStage === "landing" ? (
        <LandingPage onStart={() => setWorkflowStage("choose")} />
      ) : (
        <>
          <AppHeader activeStepIndex={activeStepIndex} onHome={returnHome} />
          {isWorkspace && template ? (
            <WorkspaceScreen
              allRequiredComplete={allRequiredComplete}
              canGenerate={canGenerate}
              draftSaved={draftSaved}
              fieldStats={{ mappedCount, missingCount, reviewCount, verifiedCount }}
              generated={generated}
              generatedUrl={generatedUrl}
              generationError={generationError}
              isGenerating={isGenerating}
              page={page}
              returnToSource={returnToSource}
              saveDraft={saveDraft}
              selected={selected}
              setPage={setPage}
              setSelected={setSelected}
              template={template}
              updateField={updateField}
              validationError={validationError}
              values={values}
              zoom={zoom}
              adjustZoom={adjustZoom}
              generateDocument={generateDocument}
              closeGenerated={() => {
                setGenerated(false);
                setWorkflowStage("mapped");
              }}
            />
          ) : (
            <UploadSlide
              analysisStep={analysisStep}
              canAnalyze={canAnalyze}
              chooseTemplate={chooseTemplate}
              isAnalyzing={isAnalyzing}
              runAnalysis={runAnalysis}
              template={template}
            />
          )}
        </>
      )}
    </main>
  );
}

function AppHeader({ activeStepIndex, onHome }: { activeStepIndex: number; onHome: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-2 shadow-sm sm:px-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark />
        <div className="min-w-0">
          <span className="whitespace-nowrap font-display text-sm font-bold text-ink sm:text-lg">
            Dynamic Form Fill AI
          </span>
          <p className="hidden text-xs font-semibold text-muted-foreground sm:block">
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          aria-label="Home"
          onClick={onHome}
        >
          <House size={15} />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <button
          aria-label="User menu"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          type="button"
        >
          JD
        </button>
      </div>
    </header>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,oklch(0.99_0.025_91.74),oklch(0.9584_0.0446_91.74)_42%,oklch(0.88_0.04_265)_100%)] p-3 text-ink lg:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/78 shadow-2xl shadow-ink/15 backdrop-blur lg:min-h-[calc(100vh-2.5rem)]">
        <nav className="flex items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="hidden font-display text-base font-bold sm:inline">
              Dynamic Form Fill AI
            </span>
          </div>
          <Button className="h-9 rounded-full bg-primary px-5 text-xs" onClick={onStart}>
            Start demo
          </Button>
        </nav>

        <div className="flex flex-1 flex-col items-center px-5 pb-6 pt-8 text-center lg:px-8 lg:pt-12">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-steel-blue px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-steel-blue/25 transition-colors hover:bg-deep-blue"
          >
            No manual copy-paste required <ArrowRight size={14} />
          </button>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-normal text-ink sm:text-6xl lg:text-7xl">
            Turn documents into completed forms
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-steel-blue sm:text-base">
            Choose a bond form, review its mapped business information, and download a completed
            three-page document.
          </p>
          <HeroProductMockup onStart={onStart} />
        </div>
      </div>
    </section>
  );
}

function LogoMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-ink/15">
      <FileCheck2 size={20} />
    </span>
  );
}

function HeroProductMockup({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-10 w-full max-w-5xl rounded-[28px] border border-ink/20 bg-ink p-3 shadow-2xl shadow-ink/25 lg:mt-12">
      <div className="rounded-[22px] bg-card p-4 text-left lg:p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Autofill workspace</p>
            <h2 className="font-display text-xl font-bold text-foreground">Review mapped form</h2>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Open demo
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-2xl border border-border bg-cream/65 p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Source package</span>
              <span>Ready</span>
            </div>
            <div className="space-y-3">
              <HeroMiniStep
                icon={<FileText size={15} />}
                title="City of Montebello: Proposal Guarantee"
                meta="Bid bond | 3 pages"
              />
              <HeroMiniStep
                icon={<Keyboard size={15} />}
                title="Business information"
                meta="Form-specific source details"
              />
              <HeroMiniStep
                icon={<Brain size={15} />}
                title="Field mapping"
                meta="Mapped values ready for review"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="text-center font-serif text-[10px] font-bold tracking-[0.18em] text-ink">
                PROPOSAL GUARANTEE
              </div>
              <div className="mt-5 space-y-3">
                <HeroDocLine label="PROJECT NAME" value="LED Sign City Hall" />
                <HeroDocLine label="BIDDER" value="Westline Electric LLC" />
                <HeroDocLine label="PENAL SUM" value="$18,500.00" />
                <HeroDocLine label="BIDDER TITLE" value="Required field" missing />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-muted-foreground">Mapped fields</p>
                <span className="rounded-full bg-cream px-2 py-1 text-[10px] font-bold text-ink">
                  15 / 16
                </span>
              </div>
              <HeroField label="Bid amount" value="$185,000.00" status="Verified" />
              <HeroField label="Project" value="LED Sign City Hall" status="Verified" />
              <HeroField label="Bidder title" value="Needs input" status="Missing" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMiniStep({
  icon,
  title,
  meta,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-ink">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function HeroDocLine({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold text-muted-foreground">{label}</p>
      <div
        className={`mt-1 border-b px-1 py-1 text-[11px] font-bold ${missing ? "border-destructive bg-destructive/5 text-destructive" : "border-steel-blue/30 bg-cream/45 text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function HeroField({ label, value, status }: { label: string; value: string; status: string }) {
  const tone =
    status === "Missing"
      ? "text-destructive"
      : status === "Review"
        ? "text-warning"
        : "text-success";

  return (
    <div className="mb-2 rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span className={tone}>{status}</span>
      </div>
      <p className="truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function UploadSlide({
  analysisStep,
  canAnalyze,
  chooseTemplate,
  isAnalyzing,
  runAnalysis,
  template,
}: {
  analysisStep: number;
  canAnalyze: boolean;
  chooseTemplate: (id: string) => void;
  isAnalyzing: boolean;
  runAnalysis: () => void;
  template: BondTemplate | null;
}) {
  const analysisCardRef = useRef<HTMLDivElement>(null);
  const sourceText = template?.sourceText ?? "";

  useEffect(() => {
    if (!isAnalyzing) return;
    const frame = window.requestAnimationFrame(() => {
      analysisCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAnalyzing]);

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F7F8FB] px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-border bg-white shadow-xl shadow-ink/10 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
        <aside className="flex min-w-0 flex-col justify-between gap-8 bg-ink p-6 text-primary-foreground lg:p-8">
          <div>
            <LogoMark />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              Bond form library
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight">
              Choose a bond form
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/70">
              Select a form, review its business information, then map the values for review.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary-foreground/55">
              {template ? "Selected document" : "Five available documents"}
            </p>
            <p className="mt-2 break-words text-sm font-semibold leading-5">
              {template?.name ?? "City, state, school district, and irrigation district bond forms"}
            </p>
            {template && (
              <p className="mt-2 text-xs text-primary-foreground/65">
                {template.documentCode} · {template.pageSize === "A4" ? "A4" : "US Letter"} · 3
                pages
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7 lg:p-8">
          <div className="border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
                <FileText size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">Bond form</h2>
                <p className="text-xs text-muted-foreground">Choose one of five business forms</p>
              </div>
            </div>
            <Select
              value={template?.id ?? ""}
              onValueChange={chooseTemplate}
              disabled={isAnalyzing}
            >
              <SelectTrigger
                className="mt-3 h-auto min-h-11 w-full min-w-0 rounded-xl bg-white py-2 text-left"
                aria-label="Choose bond form"
              >
                <SelectValue placeholder="Choose a bond form" />
              </SelectTrigger>
              <SelectContent className="max-w-[min(90vw,520px)]">
                {bondTemplates.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id} className="whitespace-normal py-2.5">
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-b border-border py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
                <Keyboard size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">Business information</h2>
                <p className="text-xs text-muted-foreground">
                  {template
                    ? `${sourceText.trim().length} characters ready for mapping`
                    : "Select a form to view its source data"}
                </p>
              </div>
            </div>
            <Textarea
              value={sourceText}
              readOnly
              className="mt-3 h-32 resize-none rounded-xl border-border bg-cream/30 p-3 text-sm leading-6"
              placeholder="Choose a bond form to view its business information"
              aria-label="Business information for selected bond form"
            />
          </div>

          <div ref={analysisCardRef} className="pt-5" aria-busy={isAnalyzing}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-ink">
                <Brain size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">Field mapping</h2>
                <p className="text-xs text-muted-foreground">
                  {isAnalyzing ? "Preparing your review" : "Map the selected form's preset values"}
                </p>
              </div>
            </div>
            <div className="mt-3 min-h-12">
              {isAnalyzing ? (
                <div className="rounded-xl border border-border bg-cream/25 px-4 py-3">
                  <p
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 size={15} className="animate-spin text-primary" />
                    {processingSteps[analysisStep] ?? processingSteps[0]}
                  </p>
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream"
                    role="progressbar"
                    aria-label="Demo analysis progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(((analysisStep + 1) / processingSteps.length) * 100)}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700"
                      style={{ width: `${((analysisStep + 1) / processingSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-deep-blue"
                  onClick={runAnalysis}
                  disabled={!canAnalyze}
                >
                  <Sparkles size={17} /> Run AI parse & map
                </Button>
              )}
            </div>
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
  fieldStats,
  generated,
  generatedUrl,
  generationError,
  isGenerating,
  page,
  returnToSource,
  saveDraft,
  selected,
  setPage,
  setSelected,
  template,
  updateField,
  validationError,
  values,
  zoom,
  adjustZoom,
  generateDocument,
  closeGenerated,
}: {
  allRequiredComplete: boolean;
  canGenerate: boolean;
  draftSaved: boolean;
  fieldStats: {
    mappedCount: number;
    missingCount: number;
    reviewCount: number;
    verifiedCount: number;
  };
  generated: boolean;
  generatedUrl: string | null;
  generationError: string | null;
  isGenerating: boolean;
  page: number;
  returnToSource: () => void;
  saveDraft: () => void;
  selected: string | null;
  setPage: (value: number) => void;
  setSelected: (value: string) => void;
  template: BondTemplate;
  updateField: (id: string, value: BondFieldValue) => void;
  validationError: string | null;
  values: BondValues;
  zoom: number;
  adjustZoom: (delta: number) => void;
  generateDocument: () => void;
  closeGenerated: () => void;
}) {
  const fieldCardRefs = useRef<Record<string, HTMLLabelElement | null>>({});
  const reviewListRef = useRef<HTMLDivElement>(null);
  const [fieldFilter, setFieldFilter] = useState<ReviewFilter>("all");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const textFieldCount = template.fields.filter((field) => field.kind !== "checkbox").length;
  const checkboxFieldCount = template.fields.length - textFieldCount;

  const visiblePages = fieldFilter === "all" ? [page] : [1, 2, 3];
  const visibleSections = visiblePages.flatMap((pageNumber) =>
    (template.pages[pageNumber - 1]?.sections ?? [])
      .map((section) => ({
        heading: section.heading,
        pageNumber,
        fields: (section.fields ?? [])
          .map((id) => template.fields.find((field) => field.id === id))
          .filter((field): field is BondField => Boolean(field))
          .filter(
            (field) =>
              fieldFilter === "all" ||
              reviewFieldStatus(field, values) === fieldFilter ||
              field.id === editingFieldId,
          ),
      }))
      .filter((section) => section.fields.length > 0),
  );

  const selectField = (fieldId: string) => {
    setSelected(fieldId);
    setPage(template.fields.find((field) => field.id === fieldId)?.page ?? 1);
  };

  const selectPage = (nextPage: number) => {
    setFieldFilter("all");
    setEditingFieldId(null);
    setPage(nextPage);
    setSelected(template.fields.find((field) => field.page === nextPage)?.id ?? "");
    reviewListRef.current?.scrollTo({ top: 0 });
  };

  const chooseFilter = (nextFilter: ReviewFilter) => {
    setFieldFilter(nextFilter);
    setEditingFieldId(null);
    if (nextFilter === "all") {
      const selectedOnPage = template.fields.some(
        (field) => field.id === selected && field.page === page,
      );
      if (!selectedOnPage)
        setSelected(template.fields.find((field) => field.page === page)?.id ?? "");
    } else {
      const matches = template.fields.filter(
        (field) => reviewFieldStatus(field, values) === nextFilter,
      );
      const target =
        matches.find((field) => field.id === selected) ??
        matches.find((field) => field.page === page) ??
        matches[0];
      if (target) {
        setPage(target.page);
        setSelected(target.id);
      } else {
        setSelected("");
      }
    }
    reviewListRef.current?.scrollTo({ top: 0 });
  };

  const selectDocumentField = (fieldId: string) => {
    setFieldFilter("all");
    setEditingFieldId(null);
    selectField(fieldId);
    window.requestAnimationFrame(() => {
      fieldCardRefs.current[fieldId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const canZoomOut = zoom > zoomLevels[0];
  const canZoomIn = zoom < (zoomLevels.at(-1) ?? defaultZoom);
  const filterOptions: {
    id: ReviewFilter;
    label: string;
    count: number;
    activeClass: string;
  }[] = [
    {
      id: "all",
      label: "All fields",
      count: template.fields.length,
      activeClass: "border-primary bg-primary text-primary-foreground",
    },
    {
      id: "verified",
      label: "Verified",
      count: fieldStats.verifiedCount,
      activeClass: "border-success/40 bg-success/10 text-success",
    },
    {
      id: "review",
      label: "Review",
      count: fieldStats.reviewCount,
      activeClass: "border-warning/40 bg-warning/10 text-warning",
    },
    {
      id: "missing",
      label: "Missing",
      count: fieldStats.missingCount,
      activeClass: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  ];

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-white">
      <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border bg-white px-5 py-2.5 lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <h1 className="font-display text-xl font-bold leading-6 text-foreground">
              Review mapped form
            </h1>
            <span className="hidden shrink-0 text-xs font-semibold text-success sm:inline">
              Fields mapped
            </span>
          </div>
          <p className="truncate text-sm font-medium text-steel-blue" title={template.name}>
            {template.name}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={returnToSource}>
          <ArrowLeft size={15} />
          Source
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 overflow-auto bg-white lg:grid-cols-[45fr_55fr] lg:overflow-hidden">
        <section className="flex min-h-[560px] min-w-0 flex-col border-b border-border bg-white lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex min-h-12 items-center justify-between gap-2 border-b border-border bg-white px-4">
            <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
              <span className="truncate text-xs font-bold uppercase text-steel-blue">
                {template.documentCode}
              </span>
              <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline">
                {textFieldCount} fields | {checkboxFieldCount} checkboxes
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1" aria-label="PDF page navigation">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => selectPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="size-7 rounded-full"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="min-w-16 text-center text-xs font-bold text-foreground">
                Page {page} of 3
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => selectPage(Math.min(3, page + 1))}
                disabled={page === 3}
                aria-label="Next page"
                className="size-7 rounded-full"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="flex shrink-0 items-center rounded-full border border-border bg-white p-1 shadow-sm">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Zoom out"
                onClick={() => adjustZoom(-25)}
                disabled={!canZoomOut}
                className="size-7 rounded-full"
              >
                <Minus size={14} />
              </Button>
              <span className="w-14 text-center text-xs font-bold text-foreground">{zoom}%</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Zoom in"
                onClick={() => adjustZoom(25)}
                disabled={!canZoomIn}
                className="size-7 rounded-full"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
          <BondPdfPreview
            page={page}
            template={template}
            values={values}
            zoom={zoom}
            selected={selected}
            onSelectField={selectDocumentField}
          />
        </section>

        <section className="flex min-h-[620px] min-w-0 flex-col bg-white lg:min-h-0">
          <div className="border-b border-border bg-white px-4 py-3 lg:px-5">
            <div className="mx-auto max-w-[920px]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-foreground">Review & approve</h2>
                <span className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-steel-blue shadow-sm">
                  {fieldStats.mappedCount} / {template.fields.length} mapped
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 overflow-x-auto pb-1">
                <div
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap"
                  aria-label="Filter review fields"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseFilter(option.id)}
                      aria-pressed={fieldFilter === option.id}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${fieldFilter === option.id ? option.activeClass : "border-border bg-white text-ink hover:border-steel-blue/40"}`}
                    >
                      <strong className="font-display text-sm">{option.count}</strong>
                      {option.label}
                    </button>
                  ))}
                </div>
                <div
                  className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap"
                  aria-label="Review page fields"
                >
                  {([1, 2, 3] as const).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => selectPage(number)}
                      aria-current={fieldFilter === "all" && page === number ? "page" : undefined}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${fieldFilter === "all" && page === number ? "bg-primary text-primary-foreground" : "bg-cream text-ink hover:bg-cream/70"}`}
                    >
                      Page {number} ·{" "}
                      {template.fields.filter((field) => field.page === number).length}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            ref={reviewListRef}
            className="min-h-0 flex-1 overflow-auto bg-[#F7F8FB] px-4 py-3 lg:px-5"
          >
            <div className="mx-auto max-w-[920px] space-y-5">
              {visibleSections.length > 0 ? (
                visibleSections.map((section) => (
                  <section key={`${section.pageNumber}-${section.heading}`}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-steel-blue">
                      {fieldFilter === "all"
                        ? section.heading
                        : `Page ${section.pageNumber} · ${section.heading}`}
                    </h3>
                    <div className="space-y-2.5">
                      {section.fields.map((field) => {
                        const fieldValue = values[field.id] ?? field.value;
                        const mapped = isBondFieldMapped(field, values);
                        const currentMissing = field.required && !mapped;
                        const status = reviewFieldStatus(field, values);
                        const isActive = selected === field.id;
                        return (
                          <label
                            key={field.id}
                            ref={(node) => {
                              fieldCardRefs.current[field.id] = node;
                            }}
                            className={`block cursor-pointer rounded-xl border p-3 shadow-sm transition-all ${
                              isActive
                                ? "border-ink bg-cream/35 shadow-md shadow-ink/8"
                                : currentMissing
                                  ? "border-destructive/30 bg-white hover:border-destructive/45"
                                  : "border-border bg-white hover:border-steel-blue/40"
                            }`}
                            onClick={() => selectField(field.id)}
                            onFocusCapture={() => setEditingFieldId(field.id)}
                            onBlurCapture={(event) => {
                              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                                setEditingFieldId(null);
                            }}
                          >
                            <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold text-steel-blue">
                              <span>{field.label}</span>
                              <Status status={status} />
                            </span>
                            {field.kind === "checkbox" ? (
                              <span className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F8FB] px-3 py-2">
                                <span className="text-sm font-bold text-foreground">
                                  {fieldValue === true ? "Checked" : "Unchecked"}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={fieldValue === true}
                                  onChange={(event) => updateField(field.id, event.target.checked)}
                                  disabled={field.readOnly}
                                  className="size-4 accent-primary"
                                />
                              </span>
                            ) : field.kind === "multiline" ? (
                              <textarea
                                value={typeof fieldValue === "string" ? fieldValue : ""}
                                onChange={(event) => updateField(field.id, event.target.value)}
                                readOnly={field.readOnly}
                                rows={2}
                                placeholder={currentMissing ? "Enter required value" : undefined}
                                className="min-h-16 w-full resize-y border-0 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-destructive"
                              />
                            ) : field.kind === "select" ? (
                              <select
                                value={typeof fieldValue === "string" ? fieldValue : ""}
                                onChange={(event) => updateField(field.id, event.target.value)}
                                disabled={field.readOnly}
                                className="h-9 w-full bg-transparent text-sm font-bold text-foreground outline-none"
                              >
                                {(field.options ?? []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.kind === "date" ? "date" : "text"}
                                inputMode={field.kind === "currency" ? "decimal" : undefined}
                                value={typeof fieldValue === "string" ? fieldValue : ""}
                                onChange={(event) => updateField(field.id, event.target.value)}
                                readOnly={field.readOnly}
                                placeholder={currentMissing ? "Enter required value" : undefined}
                                className="h-8 w-full border-0 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-destructive read-only:cursor-default"
                              />
                            )}
                            <span className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-medium text-muted-foreground">
                              <span>Source: {field.source}</span>
                              <span>Confidence: {mapped ? field.confidence : "0%"}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-xl border border-border bg-white p-6 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    No {fieldFilter} fields to show.
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-bold text-primary underline"
                    onClick={() => chooseFilter("all")}
                  >
                    Show all fields
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-white px-4 py-2 shadow-[0_-10px_24px_oklch(0.1696_0.0914_265.04/0.05)] lg:px-5">
            <div className="mx-auto max-w-[920px]">
              {generationError && (
                <p className="mb-2 text-sm font-semibold text-destructive" role="alert">
                  {generationError}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={`flex min-w-[12rem] flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${allRequiredComplete ? "bg-success/10 text-success" : "bg-cream/80 text-ink"}`}
                >
                  {allRequiredComplete ? (
                    <Check size={15} className="shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="shrink-0" />
                  )}
                  <span>{validationError ?? "All required fields are complete."}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" className="h-10 rounded-xl" onClick={saveDraft}>
                    {draftSaved ? <Check size={15} /> : <Save size={15} />}
                    {draftSaved ? "Draft saved" : "Save draft"}
                  </Button>
                  <Button
                    className="h-10 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-deep-blue"
                    onClick={generateDocument}
                    disabled={!canGenerate}
                  >
                    {isGenerating ? "Generating PDF…" : "Approve & generate"}{" "}
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {generated && generatedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-border bg-white p-8 text-center shadow-2xl shadow-ink/20">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-success">
              <Check size={28} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">Document Generated</h2>
            <p className="mt-2 text-sm text-muted-foreground">{template.name}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{template.filename}</p>
            <div className="my-6 border-y border-border py-4 text-xs text-muted-foreground">
              Three-page PDF ready with your reviewed values
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeGenerated}>
                Back
              </Button>
              <Button asChild className="flex-1">
                <a href={generatedUrl} download={template.filename}>
                  <Download size={16} /> Download PDF
                </a>
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
