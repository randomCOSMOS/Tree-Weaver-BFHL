"use client";

import { useState } from "react";

const sampleEntries = [
  "A->B",
  "A->C",
  "B->D",
  "C->E",
  "E->F",
  "X->Y",
  "Y->Z",
  "Z->X",
  "P->Q",
  "Q->R",
  "G->H",
  "G->H",
  "G->I",
  "hello",
  "1->2",
  "A->"
];

const jsonSamplePayload = JSON.stringify(
  {
    data: sampleEntries
  },
  null,
  2
);

const textSamplePayload = sampleEntries.join(", ");

function parseEntries(input, inputMode) {
  const trimmed = input.trim();

  if (!trimmed) {
    return [];
  }

  if (inputMode === "json") {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }

    if (!parsed || !Array.isArray(parsed.data)) {
      throw new Error('JSON object input must include a "data" array.');
    }

    return parsed.data.map((item) => String(item));
  }

  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function renderTree(node) {
  return Object.entries(node).map(([label, children]) => (
    <li key={label} className="tree-node">
      <span>{label}</span>
      {Object.keys(children).length > 0 ? <ul>{renderTree(children)}</ul> : null}
    </li>
  ));
}

function HierarchyCard({ hierarchy }) {
  return (
    <article className="panel hierarchy-card">
      <div className="hierarchy-head">
        <div>
          <p className="eyebrow">Root</p>
          <h3>{hierarchy.root}</h3>
        </div>
        <div className={`badge ${hierarchy.has_cycle ? "badge-warn" : "badge-ok"}`}>
          {hierarchy.has_cycle ? "Cycle Detected" : `Depth ${hierarchy.depth}`}
        </div>
      </div>

      {hierarchy.has_cycle ? (
        <p className="muted">This connected group contains a cycle, so the tree view is intentionally empty.</p>
      ) : (
        <div className="tree-wrap">
          <ul className="tree-root">{renderTree(hierarchy.tree)}</ul>
        </div>
      )}
    </article>
  );
}

function ListBlock({ title, items, emptyLabel }) {
  return (
    <section className="surface-card panel">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="count-pill">{items.length}</span>
      </div>
      {items.length ? (
        <div className="token-list">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="token">
              {item === "" ? "(empty string)" : item}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted">{emptyLabel}</p>
      )}
    </section>
  );
}

function MetricCard({ tone, label, value, detail }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div>
        <p className="metric-label">{label}</p>
        <strong>{value}</strong>
        {detail ? <p className="metric-detail">{detail}</p> : null}
      </div>
      <span className="metric-icon" />
    </article>
  );
}

export default function HomePage() {
  const [inputMode, setInputMode] = useState("json");
  const [input, setInput] = useState(jsonSamplePayload);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const treeHierarchies = result?.hierarchies?.filter((hierarchy) => !hierarchy.has_cycle) ?? [];
  const cycleHierarchies = result?.hierarchies?.filter((hierarchy) => hierarchy.has_cycle) ?? [];

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = parseEntries(input, inputMode);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiBase}/bfhl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
      }

      setResult(payload);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="wash wash-a" />
      <div className="wash wash-b" />

      <header className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">SRM Full Stack Engineering Challenge</p>
          <h1>Tree Weaver</h1>
          <p className="lead">
            Switch between JSON and plain text input, process the hierarchy graph, and review trees, cycles,
            invalid entries, duplicates, and the full payload in one airy dashboard.
          </p>
        </div>
        <div className="hero-meta">
          <span className="profile-pill">Srijan Thakur</span>
          <span className="profile-pill">RA2311047010081</span>
          <span className="profile-pill">st7851@srmist.edu.in</span>
        </div>
      </header>

      <section className="workspace-grid">
        <form className="surface-card composer-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <div>
              <p className="eyebrow">Input Center</p>
              <h2>Choose your format and process.</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setInput(inputMode === "json" ? jsonSamplePayload : textSamplePayload);
                setError("");
              }}
            >
              Load sample
            </button>
          </div>

          <div className="toggle-shell" role="tablist" aria-label="Input format">
            <button
              type="button"
              className={`toggle-chip ${inputMode === "text" ? "is-active" : ""}`}
              onClick={() => setInputMode("text")}
            >
              Text
            </button>
            <button
              type="button"
              className={`toggle-chip ${inputMode === "json" ? "is-active" : ""}`}
              onClick={() => setInputMode("json")}
            >
              JSON
            </button>
          </div>

          <p className="muted">
            JSON mode accepts either the full request body with <code>data</code> or a raw array. Text mode
            accepts comma or line-separated edges like <code>{"A->B, A->C"}</code>.
          </p>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              inputMode === "json"
                ? '{\n  "data": ["A->B", "A->C"]\n}'
                : "A->B, A->C, B->D"
            }
            className="input-box"
            spellCheck={false}
          />

          <div className="action-row">
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? "Processing..." : "Process"}
            </button>
            <span className="inline-note">API target: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}</span>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}
        </form>

        <aside className="summary-column">
          <div className="metrics-stack">
            <MetricCard
              tone="primary"
              label="Total trees"
              value={result?.summary?.total_trees ?? "--"}
            />
            <MetricCard
              tone="secondary"
              label="Total cycles"
              value={result?.summary?.total_cycles ?? "--"}
            />
            <MetricCard
              tone="tertiary"
              label="Largest tree root"
              value={result?.summary?.largest_tree_root || "--"}
            />
          </div>
        </aside>
      </section>

      <section className="results-stack">
        <section className="results-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trees Found</p>
              <h2>Valid rooted hierarchies</h2>
            </div>
            <span className="count-pill">{treeHierarchies.length}</span>
          </div>
          <div className="cards-grid">
            {treeHierarchies.length ? (
              treeHierarchies.map((hierarchy) => (
                <HierarchyCard key={`${hierarchy.root}-tree`} hierarchy={hierarchy} />
              ))
            ) : (
              <div className="surface-card empty-state">
                <p>No valid trees yet. Process an input to populate this section.</p>
              </div>
            )}
          </div>
        </section>

        <section className="results-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cycles</p>
              <h2>Groups without a valid root path</h2>
            </div>
            <span className="count-pill">{cycleHierarchies.length}</span>
          </div>
          <div className="cards-grid">
            {cycleHierarchies.length ? (
              cycleHierarchies.map((hierarchy) => (
                <HierarchyCard key={`${hierarchy.root}-cycle`} hierarchy={hierarchy} />
              ))
            ) : (
              <div className="surface-card empty-state">
                <p>No cycles were found in the current response.</p>
              </div>
            )}
          </div>
        </section>

        <section className="meta-grid">
          <ListBlock
            title="Invalid Entries"
            items={result?.invalid_entries ?? []}
            emptyLabel="No invalid entries were found."
          />
          <ListBlock
            title="Duplicate Edges"
            items={result?.duplicate_edges ?? []}
            emptyLabel="No duplicate edges were found."
          />
        </section>

        <section className="surface-card raw-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Raw Payload</p>
              <h2>Full API response</h2>
            </div>
          </div>
          <pre className="response-preview response-preview-full">
            {result ? JSON.stringify(result, null, 2) : "The raw response will appear here after processing."}
          </pre>
        </section>
      </section>
    </main>
  );
}
