import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { LEADS, type Lead } from "@/mocks/agent";
import { useMemo, useState } from "react";

const Leads = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [board, setBoard] = useState<Record<Lead["status"], Lead[]>>(() => {
    const by: any = { new: [], contacted: [], qualified: [], quoted: [], closed: [] };
    LEADS.forEach(l => by[l.status].push(l));
    return by;
  });
  const rows = useMemo(() => LEADS.filter(l => (
    (!q || l.title.toLowerCase().includes(q.toLowerCase()) || l.from.toLowerCase().includes(q.toLowerCase())) &&
    (status === 'all' || l.status === status as any)
  )), [q, status]);

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex items-center gap-2">
            <Input placeholder="Search leads..." value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={() => { setQ(""); setStatus("all"); }}>Reset</Button>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Button size="sm" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>Table</Button>
            <Button size="sm" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}>Kanban</Button>
          </div>

          {view === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(l => (
                      <TableRow key={l.id}>
                        <TableCell>{l.id}</TableCell>
                        <TableCell>{l.title}</TableCell>
                        <TableCell className="text-muted-foreground">{l.from}</TableCell>
                        <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{l.receivedAt}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm"><Link to={`/leads/${l.id}`}>Open</Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(["new","contacted","qualified","quoted","closed"] as Lead["status"][]).map(col => (
                <div key={col} className="rounded-md border bg-muted/20">
                  <div className="px-3 py-2 font-semibold text-sm capitalize border-b">{col.replace('_',' ')}</div>
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {board[col].map(card => (
                      <div key={card.id} className="p-3 rounded-md bg-background shadow-sm border text-sm">
                        <div className="font-medium">{card.title}</div>
                        <div className="text-xs text-muted-foreground">{card.id} • {card.from}</div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(["new","contacted","qualified","quoted","closed"] as Lead["status"][])
                            .filter(s => s !== col)
                            .slice(0,2)
                            .map(s => (
                              <Button key={s} size="xs" variant="outline" onClick={() => {
                                const fromKey = col;
                                const lead = board[fromKey].find(l => l.id === card.id)!;
                                const next = { ...board } as typeof board;
                                next[fromKey] = next[fromKey].filter(l => l.id !== card.id);
                                next[s] = [{ ...lead, status: s }, ...next[s]];
                                setBoard(next);
                              }}>
                                Move to {s}
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))}
                    {board[col].length === 0 && (
                      <div className="text-xs text-muted-foreground p-2">No items</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AgentShell>
  );
};

export default Leads;
