import { useEffect, useState } from "react";

export default function App() {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem("cards");
    return saved ? JSON.parse(saved) : [];
  });

  const [split, setSplit] = useState(60);

  const [form, setForm] = useState({
    name: "",
    grade: "",
    totalPaid: "",
    partnerPaid: ""
  });

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  function addCard() {
    if (!form.name || !form.totalPaid) return;

    setCards([
      ...cards,
      {
        id: Date.now(),
        name: form.name,
        grade: form.grade,
        totalPaid: Number(form.totalPaid),
        partnerPaid: Number(form.partnerPaid || 0),
        sold: false,
        soldPrice: 0
      }
    ]);

    setForm({ name: "", grade: "", totalPaid: "", partnerPaid: "" });
  }

  function sellCard(id) {
    const price = prompt("Enter selling price:");
    if (!price) return;

    setCards(
      cards.map(c =>
        c.id === id
          ? { ...c, sold: true, soldPrice: Number(price) }
          : c
      )
    );
  }

  function deleteCard(id) {
    setCards(cards.filter(c => c.id !== id));
  }

  function profit(card) {
    if (!card.sold) return 0;
    return card.soldPrice - card.totalPaid;
  }

  function splitProfit(card) {
    const p = profit(card);
    const partner = (split / 100) * p;
    return {
      partner,
      you: p - partner
    };
  }

  const totalProfit = cards.reduce((a, c) => a + profit(c), 0);
  const partnerProfit = cards.reduce((a, c) => a + splitProfit(c).partner, 0);
  const yourProfit = totalProfit - partnerProfit;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Pokémon Tracker</h1>
            <p style={styles.subtitle}>Clean investment dashboard</p>
          </div>

          <div style={styles.splitBox}>
            <span>Split %</span>
            <input
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              style={styles.splitInput}
            />
            <span>You {split}% / Partner {100 - split}%</span>
          </div>
        </div>

        {/* INPUT */}
        <div style={styles.card}>
          <input
            placeholder="Card name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Grade"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Total paid"
            value={form.totalPaid}
            onChange={(e) => setForm({ ...form, totalPaid: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Partner paid"
            value={form.partnerPaid}
            onChange={(e) => setForm({ ...form, partnerPaid: e.target.value })}
            style={styles.input}
          />

          <button onClick={addCard} style={styles.button}>
            Add
          </button>
        </div>

        {/* SUMMARY */}
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span>Total Profit</span>
            <b>${totalProfit.toFixed(2)}</b>
          </div>

          <div style={styles.stat}>
            <span>Your Profit</span>
            <b>${yourProfit.toFixed(2)}</b>
          </div>

          <div style={styles.stat}>
            <span>Partner Profit</span>
            <b>${partnerProfit.toFixed(2)}</b>
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.table}>
          <div style={styles.rowHeader}>
            <span>Card</span>
            <span>Grade</span>
            <span>Paid</span>
            <span>Partner</span>
            <span>Status</span>
            <span>Profit</span>
            <span>Partner Profit</span>
            <span></span>
          </div>

          {cards.map((c) => {
            const p = profit(c);
            const s = splitProfit(c);

            return (
              <div
                key={c.id}
                style={{
                  ...styles.row,
                  borderLeft: c.sold
                    ? "4px solid #ef4444"
                    : "4px solid #22c55e"
                }}
              >
                <span>{c.name}</span>
                <span>{c.grade || "—"}</span>
                <span>${c.totalPaid}</span>
                <span>${c.partnerPaid}</span>

                <span>
                  {c.sold ? (
                    <span style={styles.sold}>SOLD</span>
                  ) : (
                    <button onClick={() => sellCard(c.id)} style={styles.sell}>
                      Sell
                    </button>
                  )}
                </span>

                <span>{c.sold ? `$${p.toFixed(2)}` : "—"}</span>
                <span>{c.sold ? `$${s.partner.toFixed(2)}` : "—"}</span>

                <span onClick={() => deleteCard(c.id)} style={styles.trash}>
                  🗑
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#0b1220",
    color: "white",
    fontFamily: "Arial",
    padding: 20,
    boxSizing: "border-box"
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10
  },

  title: {
    margin: 0,
    fontSize: 26
  },

  subtitle: {
    margin: 0,
    opacity: 0.6,
    fontSize: 12
  },

  splitBox: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "#111827",
    padding: 10,
    borderRadius: 10
  },

  splitInput: {
    width: 60,
    padding: 5,
    borderRadius: 6,
    border: "none"
  },

  card: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    background: "#111827",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15
  },

  input: {
    padding: 8,
    borderRadius: 6,
    border: "none"
  },

  button: {
    background: "#3b82f6",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 20
  },

  stat: {
    background: "#111827",
    padding: 12,
    borderRadius: 10
  },

  table: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },

  rowHeader: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1fr 1fr 1fr 1fr 1fr 40px",
    background: "#1f2937",
    padding: 10,
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 12
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1fr 1fr 1fr 1fr 1fr 40px",
    padding: 10,
    borderRadius: 10,
    background: "#0f172a",
    alignItems: "center"
  },

  sell: {
    background: "#22c55e",
    border: "none",
    padding: "5px 8px",
    borderRadius: 6,
    cursor: "pointer"
  },

  sold: {
    background: "#ef4444",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11
  },

  trash: {
    cursor: "pointer",
    color: "#f87171",
    fontSize: 18,
    textAlign: "center"
  }
};