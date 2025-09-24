import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORAGE_KEY = 'agent_quotes';
const TEMPLATES_KEY = 'agent_quote_templates';

type Row = { label: string; qty: number; unitPrice: number };

const QuoteBuilder = () => {
  const [params] = useSearchParams();
  const requestId = params.get('request') ?? undefined;
  const leadId = params.get('lead') ?? undefined;
  const [rows, setRows] = useState<Row[]>([
    { label: 'Base construction', qty: 1, unitPrice: 50000 },
  ]);
  const [allowance, setAllowance] = useState(0);
  const [taxRate, setTaxRate] = useState(0.16);
  const [notes, setNotes] = useState('Includes standard solar package.');
  const [terms, setTerms] = useState('Valid for 30 days. 50% mobilization.');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addRow = () => setRows(r => [...r, { label: '', qty: 1, unitPrice: 0 }]);
  const update = (i: number, patch: Partial<Row>) => setRows(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const remove = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  useEffect(() => {
    try { const raw = localStorage.getItem(TEMPLATES_KEY); setTemplates(raw ? JSON.parse(raw) : []); } catch {}
  }, []);

  const totals = useMemo(() => {
    const sub = rows.reduce((s, r) => s + (r.qty * r.unitPrice), 0) + allowance;
    const tax = sub * taxRate;
    const total = sub + tax;
    return { sub, tax, total };
  }, [rows, allowance, taxRate]);

  const save = () => {
    const subtotal = totals.total;
    const q = {
      id: `QUO-${Math.floor(Math.random()*900+100)}`,
      requestId,
      leadId,
      total: subtotal,
      currency: 'USD',
      status: 'draft',
      sentAt: undefined,
    };
    let all: any[] = [];
    try { const raw = localStorage.getItem(STORAGE_KEY); all = raw ? JSON.parse(raw) : []; } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify([q, ...all]));
    toast({ title: 'Quote created (demo)', description: `${q.id} • ${q.currency} ${q.total.toLocaleString()}` });
    navigate('/quotes');
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const t = { name: templateName.trim(), rows, allowance, taxRate, notes, terms };
    const next = [t, ...templates.filter((x:any) => x.name !== t.name)];
    setTemplates(next);
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next)); } catch {}
    setTemplateName('');
  };

  const loadTemplate = (name: string) => {
    const t = templates.find((x:any) => x.name === name);
    if (!t) return;
    setRows(t.rows); setAllowance(t.allowance); setTaxRate(t.taxRate); setNotes(t.notes); setTerms(t.terms);
  };

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Quote</h1>
              <div className="text-sm text-muted-foreground">Lead: {leadId ?? '—'} • Request: {requestId ?? '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Save as template…" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-48" />
              <Button variant="outline" onClick={saveTemplate}>Save Template</Button>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Load template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t:any) => (<SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Label>Label</Label>
                    <Input value={r.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Work item" />
                  </div>
                  <div className="col-span-3">
                    <Label>Qty</Label>
                    <Input type="number" value={r.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-3">
                    <Label>Unit Price</Label>
                    <Input type="number" value={r.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-12 flex justify-between">
                    <Button variant="outline" onClick={() => remove(i)}>Remove</Button>
                    {i === rows.length - 1 && <Button variant="outline" onClick={addRow}>Add Row</Button>}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Allowances</Label>
                  <Input type="number" value={allowance} onChange={(e) => setAllowance(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Tax Rate</Label>
                  <Input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div>
                <Label>Terms</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline">Preview</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Quote Preview (demo)</DialogTitle></DialogHeader>
                    <div className="text-sm space-y-2">
                      <div>Subtotal: USD {totals.sub.toLocaleString()}</div>
                      <div>Tax: USD {totals.tax.toLocaleString()}</div>
                      <div className="font-semibold">Total: USD {totals.total.toLocaleString()}</div>
                      <div className="opacity-70">{notes}</div>
                      <div className="opacity-70">{terms}</div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button onClick={save}>Save Quote</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AgentShell>
  );
};

export default QuoteBuilder;
