import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [cards, setCards] = useState(() => {
    return JSON.parse(localStorage.getItem("cards")) || [];
  });

  const [partner, setPartner] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("partner")) || {
        capital: 6000,
        meSplit: 60,
        partnerSplit: 40
      }
    );
  });

  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    grade: "",
    totalPaid: "",
    partnerPaid: "",
    purchaseDate: ""
  });

  const [sellCard, setSellCard] = useState(null);
  const [sellForm, setSellForm] = useState({ price: "", date: "" });

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem("partner", JSON.stringify(partner));
  }, [partner]);

  const getGradeColor = (grade) => {
    const g = Math.round(Number(grade));
    if (g === 10) return "gold";
    if (g === 9) return "silver";
    return "bronze";
  };

  const normalizeGrade = (grade) => {
    const g = Math.round(Number(grade));
    return Math.min(10, Math.max(1, g));
  };

  const calcPartnerProfit = (card) => {
    const profit = card.salePrice - card.totalPaid;
    const ownership = card.partnerPaid / card.totalPaid;

    return Math.round(
      profit * ownership * (partner.partnerSplit / 100)
    );
  };

  const calcMyProfit = (card) => {
    const total = card.salePrice - card.totalPaid;
    return total - calcPartnerProfit(card);
  };

  const soldCards = cards.filter((c) => c.status === "Sold");

  const totalProfit = soldCards.reduce(
    (a, c) => a + (c.salePrice - c.totalPaid),
    0
  );

  const partnerProfitTotal = soldCards.reduce(
    (a, c) => a + calcPartnerProfit(c),
    0
  );

  const myProfitTotal = soldCards.reduce(
    (a, c) => a + calcMyProfit(c),
    0
  );

  const partnerUsedCapital = cards.reduce((sum, c) => {
    if (c.status === "Sold") return sum;
    return sum + c.partnerPaid;
  }, 0);

  const partnerAvailableCapital =
    partner.capital - partnerUsedCapital;

  const addCard = () => {
    if (!form.name || !form.totalPaid) return;

    setCards([
      {
        id: Date.now(),
        name: form.name,
        grade: normalizeGrade(form.grade),
        totalPaid: Number(form.totalPaid),
        partnerPaid: Number(form.partnerPaid || 0),
        purchaseDate: form.purchaseDate,
        status: "Holding",
        salePrice: 0,
        saleDate: ""
      },
      ...cards
    ]);

    setForm({
      name: "",
      grade: "",
      totalPaid: "",
      partnerPaid: "",
      purchaseDate: ""
    });
  };

  const confirmSell = () => {
    const salePrice = Number(sellForm.price);

    setCards((prev) =>
      prev.map((c) =>
        c.id === sellCard.id
          ? {
              ...c,
              status: "Sold",
              salePrice,
              saleDate: sellForm.date
            }
          : c
      )
    );

    setSellCard(null);
  };

  const openSell = (card) => {
    setSellCard(card);
    setSellForm({ price: "", date: "" });
  };

  const deleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = cards.filter((c) => {
    if (filter === "sold") return c.status === "Sold";
    if (filter === "holding") return c.status !== "Sold";
    return true;
  });

  return (
    <div className="app">

      <div className="sidebar">
        <div className="appTitle">Pokémon Portfolio</div>

        <input
          placeholder="Card Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Grade (1-10)"
          value={form.grade}
          onChange={(e) =>
            setForm({ ...form, grade: e.target.value })
          }
        />

        <input
          placeholder="Total Paid"
          type="number"
          value={form.totalPaid}
          onChange={(e) =>
            setForm({ ...form, totalPaid: e.target.value })
          }
        />

        <input
          placeholder="Partner Paid"
          type="number"
          value={form.partnerPaid}
          onChange={(e) =>
            setForm({ ...form, partnerPaid: e.target.value })
          }
        />

        <input
          placeholder="Purchase Date"
          value={form.purchaseDate}
          onChange={(e) =>
            setForm({ ...form, purchaseDate: e.target.value })
          }
        />

        <button onClick={addCard}>Add Card</button>

        {/* PARTNER SYSTEM + SPLIT */}
        <div className="partnerBox">
          <h3>Partner System</h3>

          <input
            type="number"
            value={partner.capital}
            onChange={(e) =>
              setPartner({
                ...partner,
                capital: Number(e.target.value)
              })
            }
          />

          {/* NEW SPLIT CONTROLS */}
          <div className="splitBox">
            <p>Profit Split</p>

            <div className="splitRow">
              <div>
                <span>Me %</span>
                <input
                  type="number"
                  value={partner.meSplit}
                  onChange={(e) =>
                    setPartner({
                      ...partner,
                      meSplit: Number(e.target.value)
                    })
                  }
                />
              </div>

              <div>
                <span>Partner %</span>
                <input
                  type="number"
                  value={partner.partnerSplit}
                  onChange={(e) =>
                    setPartner({
                      ...partner,
                      partnerSplit: Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>
          </div>

          <p>Capital: ${partner.capital}</p>
          <p>Used: ${partnerUsedCapital}</p>
          <p>Available: ${partnerAvailableCapital}</p>
        </div>
      </div>

      <div className="main">

        <div className="dashboard">
          <div>Total Profit: ${totalProfit}</div>
          <div>My Profit: ${myProfitTotal}</div>
          <div>Partner Profit: ${partnerProfitTotal}</div>
        </div>

        <div className="filters">
          <button onClick={() => setFilter("all")}>All</button>
          <button onClick={() => setFilter("sold")}>Sold</button>
          <button onClick={() => setFilter("holding")}>Holding</button>
        </div>

<div className="grid">
  {filtered.map((c) => (
    <div
      key={c.id}
      className="card"
      style={{
        border:
          c.status === "Sold"
            ? "2px solid rgba(239,68,68,0.75)"
            : "2px solid rgba(34,197,94,0.75)",

        boxShadow:
          c.status === "Sold"
            ? "0 0 20px rgba(239,68,68,0.18)"
            : "0 0 20px rgba(34,197,94,0.18)"
      }}
    >

              <div className={`gradeBadge ${getGradeColor(c.grade)}`}>
                {c.grade}
              </div>

              <h3>{c.name}</h3>

              <p>Purchase Date: {c.purchaseDate || "—"}</p>
              <p>Paid: ${c.totalPaid}</p>
              <p>Partner: ${c.partnerPaid}</p>

              {c.status === "Sold" && (
                <div className="profitBox">
                  <h3>Total Profit: ${c.salePrice - c.totalPaid}</h3>
                  <p>Sold For: ${c.salePrice}</p>
                  <p>My Profit: ${c.salePrice - c.totalPaid - calcPartnerProfit(c)}</p>
                  <p>Partner Profit: ${calcPartnerProfit(c)}</p>
                  <p>Sale Date: {c.saleDate}</p>
                </div>
              )}

              <div className="actions">
                {c.status !== "Sold" && (
                  <button onClick={() => openSell(c)}>Sell</button>
                )}
                <button onClick={() => deleteCard(c.id)}>🗑</button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {sellCard && (
        <div className="modal">
          <div className="modalBox">

            <h3>Sell Card</h3>

            <input
              placeholder="Sale Price"
              type="number"
              value={sellForm.price}
              onChange={(e) =>
                setSellForm({ ...sellForm, price: e.target.value })
              }
            />

            <input
              placeholder="Sale Date"
              value={sellForm.date}
              onChange={(e) =>
                setSellForm({ ...sellForm, date: e.target.value })
              }
            />

            <button onClick={confirmSell}>Confirm</button>
            <button onClick={() => setSellCard(null)}>Cancel</button>

          </div>
        </div>
      )}

    </div>
  );
}