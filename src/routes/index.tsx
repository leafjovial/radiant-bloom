import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Download, FileCheck2, FileText, Minus, Plus, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Create Bid Bond | BondFlow" },
    { name: "description", content: "Review mapped bid information and generate a validated bid bond." },
    { property: "og:title", content: "Create Bid Bond | BondFlow" },
    { property: "og:description", content: "Review mapped bid information and generate a validated bid bond." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

const fields = [
  { id: "project", label: "Project name", value: "Road Improvement Project — Phase II", status: "verified" },
  { id: "contractor", label: "Contractor / principal", value: "ABC Construction LLC", status: "verified" },
  { id: "obligee", label: "Obligee", value: "City of Montebello", status: "review" },
  { id: "amount", label: "Bid amount", value: "$250,000.00", status: "verified" },
  { id: "date", label: "Bid date", value: "October 18, 2026", status: "verified" },
  { id: "address", label: "Obligee address", value: "", status: "missing" },
];

type FieldValues = {
  project: string;
  contractor: string;
  obligee: string;
  amount: string;
  date: string;
  address: string;
};

function Index() {
  const [selected, setSelected] = useState("obligee");
  const [values, setValues] = useState<FieldValues>({
    project: fields[0]?.value ?? "",
    contractor: fields[1]?.value ?? "",
    obligee: fields[2]?.value ?? "",
    amount: fields[3]?.value ?? "",
    date: fields[4]?.value ?? "",
    address: fields[5]?.value ?? "",
  });
  const [page, setPage] = useState(1);
  const [generated, setGenerated] = useState(false);

  const updateField = (id: keyof FieldValues, value: string) => setValues((current) => ({ ...current, [id]: value }));

  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5 lg:px-8">
        <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><FileCheck2 size={19}/></span><span className="font-display text-lg font-bold text-navy">BondFlow</span></div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground md:flex"><span className="text-success"><Check size={14} className="inline"/> Upload</span><span>—</span><span className="text-success"><Check size={14} className="inline"/> Analyze</span><span>—</span><span className="rounded-full bg-accent px-3 py-1.5 text-accent-foreground">3 &nbsp; Map & fill</span><span>—</span><span>4 &nbsp; Review</span><span>—</span><span>5 &nbsp; Generate</span></div>
        <button aria-label="User menu" className="flex size-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-primary-foreground">JD</button>
      </header>

      <section className="border-b border-border bg-card px-5 py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4">
          <div><div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><FileText size={14}/> BID_BOND_TEMPLATE.PDF <span className="text-success">• Template analyzed</span></div><h1 className="font-display text-2xl font-bold text-foreground">Create Bid Bond</h1></div>
          <div className="flex items-center gap-2"><Button variant="outline"><Save size={16}/> Save draft</Button><Button onClick={() => setGenerated(true)} disabled={!values.address}><FileCheck2 size={16}/> Approve & generate</Button></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,.92fr)]">
        <section className="min-w-0 border-b border-border bg-muted/60 lg:border-b-0 lg:border-r">
          <div className="flex h-12 items-center justify-between border-b border-border bg-card px-5">
            <div><span className="text-xs font-bold uppercase text-muted-foreground">PDF template</span><span className="ml-3 text-xs text-muted-foreground">18 fields · 4 checkboxes</span></div>
            <div className="flex items-center gap-1"><Button size="icon" variant="ghost" aria-label="Zoom out"><Minus size={15}/></Button><span className="w-12 text-center text-xs font-semibold">100%</span><Button size="icon" variant="ghost" aria-label="Zoom in"><Plus size={15}/></Button></div>
          </div>
          <div className="flex min-h-[720px] items-start justify-center overflow-auto p-5 lg:p-8">
            <div className="relative aspect-[.77] w-full max-w-[590px] border border-border bg-card p-[8%] shadow-lg">
              <div className="text-center font-serif"><p className="text-xs font-bold tracking-[.18em]">BID BOND</p><p className="mt-2 text-[10px]">KNOW ALL PERSONS BY THESE PRESENTS</p></div>
              <p className="mt-8 text-[11px] leading-6 text-muted-foreground">That we, the undersigned Principal and Surety, are firmly bound unto the Obligee in the penal sum shown below, for payment of which we bind ourselves.</p>
              <PdfField label="PROJECT NAME" value={values.project} active={selected === "project"} onClick={() => setSelected("project")} />
              <PdfField label="CONTRACTOR / PRINCIPAL" value={values.contractor} active={selected === "contractor"} onClick={() => setSelected("contractor")} />
              <div className="grid grid-cols-2 gap-4"><PdfField label="BID AMOUNT" value={values.amount} active={selected === "amount"} onClick={() => setSelected("amount")} /><PdfField label="BID DATE" value={values.date} active={selected === "date"} onClick={() => setSelected("date")} /></div>
              <PdfField label="OBLIGEE" value={values.obligee} active={selected === "obligee"} warning onClick={() => setSelected("obligee")} />
              <PdfField label="OBLIGEE ADDRESS" value={values.address || "Required field"} active={selected === "address"} missing onClick={() => setSelected("address")} />
              <div className="mt-8 flex gap-6 text-[10px]"><span>☒ Bid Bond</span><span>☐ Performance Bond</span><span>☐ Payment Bond</span></div>
              <div className="absolute bottom-6 left-0 right-0 text-center text-[9px] text-muted-foreground">Page {page} of 3</div>
            </div>
          </div>
          <div className="flex h-14 items-center justify-center gap-2 border-t border-border bg-card"><Button size="icon" variant="ghost" onClick={() => setPage(Math.max(1, page - 1))}><ChevronLeft size={17}/></Button><span className="px-4 text-xs font-semibold">Page {page} of 3</span><Button size="icon" variant="ghost" onClick={() => setPage(Math.min(3, page + 1))}><ChevronRight size={17}/></Button></div>
        </section>

        <section className="bg-card">
          <div className="border-b border-border p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-muted-foreground">Bid bond information</p><h2 className="mt-1 font-display text-xl font-bold">Review mapped fields</h2></div><span className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-bold text-secondary-foreground">15 / 18 mapped</span></div>
            <div className="mt-5 grid grid-cols-3 border border-border"><Stat value="12" label="Verified" tone="text-success"/><Stat value="3" label="Review" tone="text-warning"/><Stat value="3" label="Missing" tone="text-primary"/></div>
            <Button variant="soft" className="mt-4 w-full justify-start"><Sparkles size={16}/> Refill from source text</Button>
          </div>
          <div className="space-y-3 p-5 lg:p-6">
            {fields.map((field) => {
              const fieldId = field.id as keyof FieldValues;
              const currentMissing = fieldId === "address" && !values.address;
              const status = currentMissing ? "missing" : field.status === "review" ? "review" : "verified";
              return <label key={field.id} className={`block cursor-pointer rounded-md border p-3 transition-colors ${selected === field.id ? "border-navy bg-accent/35" : "border-border"}`} onClick={() => setSelected(field.id)}>
                <span className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground"><span>{field.label}</span><Status status={status}/></span>
                <input value={values[fieldId]} onChange={(event) => updateField(fieldId, event.target.value)} placeholder={currentMissing ? "Enter required value" : undefined} className="h-9 w-full border-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-primary" />
              </label>;
            })}
            <div className="flex items-center justify-between border-t border-border pt-5"><div><p className="text-sm font-bold">Bond type</p><p className="text-xs text-muted-foreground">Detected from page 1</p></div><span className="rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"><Check size={14} className="mr-1 inline"/> Bid Bond</span></div>
          </div>
          <div className="sticky bottom-0 border-t border-border bg-card p-5"><div className="mb-3 flex items-center gap-2 text-xs text-primary"><AlertTriangle size={15}/>{values.address ? "All required fields are complete." : "1 required field must be completed before generation."}</div><Button className="w-full" onClick={() => setGenerated(true)} disabled={!values.address}>Continue to review <ChevronRight size={16}/></Button></div>
        </section>
      </div>

      {generated && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4"><div className="w-full max-w-md rounded-md bg-card p-8 text-center shadow-xl"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-success"><Check size={28}/></span><h2 className="mt-5 font-display text-2xl font-bold">Bid Bond Generated</h2><p className="mt-2 text-sm text-muted-foreground">Bid_Bond_ABC_Construction.pdf</p><div className="my-6 border-y border-border py-4 text-xs text-muted-foreground">18 / 18 fields completed &nbsp; • &nbsp; Validated &nbsp; • &nbsp; Approved</div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setGenerated(false)}>Back</Button><Button className="flex-1"><Download size={16}/> Download PDF</Button></div></div></div>}
    </main>
  );
}

function PdfField({ label, value, active, warning, missing, onClick }: { label: string; value: string; active?: boolean; warning?: boolean; missing?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`mt-5 w-full text-left ${active ? "outline outline-2 outline-navy outline-offset-2" : ""}`}><span className="block text-[9px] font-bold text-muted-foreground">{label}</span><span className={`mt-1 block min-h-7 border-b px-1 py-1 text-[11px] font-semibold ${missing ? "border-primary bg-primary/5 text-primary" : warning ? "border-warning bg-warning/10" : "border-secondary bg-secondary/15"}`}>{value}</span></button>;
}

function Status({ status }: { status: string }) {
  if (status === "missing") return <span className="text-primary"><AlertTriangle size={13} className="mr-1 inline"/>Missing</span>;
  if (status === "review") return <span className="text-warning"><AlertTriangle size={13} className="mr-1 inline"/>Review</span>;
  return <span className="text-success"><Check size={13} className="mr-1 inline"/>Verified</span>;
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return <div className="border-r border-border p-3 text-center last:border-r-0"><strong className={`block font-display text-lg ${tone}`}>{value}</strong><span className="text-[10px] font-semibold text-muted-foreground">{label}</span></div>;
}
