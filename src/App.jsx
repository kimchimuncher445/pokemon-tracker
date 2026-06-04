import { useEffect, useState } from "react";
import "./App.css";

import { auth, db, googleProvider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const defaultPartner = {
  capital: 0,
  meSplit: 100,
  partnerSplit: 0
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-US");
};

const formatMoney = (num) => {
  const value = Number(num || 0);
  const abs = Math.abs(value).toLocaleString("en-US");

  return value < 0 ? `-$${abs}` : `$${abs}`;
};

const parseDate = (date) => {
  if (!date) return 0;
  return new Date(date).getTime() || 0;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [cards, setCards] = useState([]);
  const [partner, setPartner] = useState(defaultPartner);

  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [filter, setFilter] = useState("all");
const [sortBy, setSortBy] = useState("none");
  const [form, setForm] = useState({
    name: "",
    grade: "",
    totalPaid: "",
    partnerPaid: "",
    purchaseDate: ""
  });

  const [sellCard, setSellCard] = useState(null);
  const [sellForm, setSellForm] = useState({ price: "", date: "" });
  const [backgroundImage, setBackgroundImage] = useState("");

  const userDocRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setDataLoaded(false);

      if (!currentUser) {
        setCards([]);
        setPartner(defaultPartner);
        setBackgroundImage("");
        setUsername("");
        setUsernameInput("");
        setDataLoaded(true);
        return;
      }

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      const defaultName =
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User";

      if (snap.exists()) {
        const data = snap.data();

        setCards(data.cards || []);
        setPartner(data.partner || defaultPartner);
        setBackgroundImage(data.backgroundImage || "");
        setUsername(data.username || defaultName);
        setUsernameInput(data.username || defaultName);
      } else {
        await setDoc(ref, {
          cards: [],
          partner: defaultPartner,
          backgroundImage: "",
          username: defaultName
        });

        setCards([]);
        setPartner(defaultPartner);
        setBackgroundImage("");
        setUsername(defaultName);
        setUsernameInput(defaultName);
      }

      setDataLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userDocRef || !dataLoaded) return;

    setDoc(
      userDocRef,
      {
        cards,
        partner,
        backgroundImage,
        username
      },
      { merge: true }
    );
  }, [cards, partner, backgroundImage, username, userDocRef, dataLoaded]);

  const handleEmailAuth = async () => {
    setAuthError("");

    try {
      if (!authForm.email || !authForm.password) {
        setAuthError("Enter email and password");
        return;
      }

      if (authMode === "signup") {
        await createUserWithEmailAndPassword(
          auth,
          authForm.email,
          authForm.password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          authForm.email,
          authForm.password
        );
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const saveUsername = () => {
    if (!usernameInput.trim()) return;
    setUsername(usernameInput.trim());
    setEditingUsername(false);
  };

  const changeBackground = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");

      const maxWidth = 1400;
      const scale = Math.min(maxWidth / img.width, 1);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedImage = canvas.toDataURL("image/jpeg", 0.55);

      setBackgroundImage(compressedImage);
    };

    reader.readAsDataURL(file);
  };

  const removeBackground = () => {
    setBackgroundImage("");
  };

  const getGradeClass = (grade) => {
    const g = Math.round(Number(grade));
    if (g === 10) return "gold";
    if (g === 9) return "silver";
    return "bronze";
  };

  const normalizeGrade = (grade) => {
    const g = Math.round(Number(grade));
    return Math.min(10, Math.max(1, g || 1));
  };

  const calcPartnerProfit = (card) => {
    if (card.status !== "Sold") return 0;

    const profit = card.salePrice - card.totalPaid;
    const ownership = card.partnerPaid / card.totalPaid;
    const partnerSplit = Number(partner.partnerSplit || 0);

    return Math.round(profit * ownership * (partnerSplit / 100));
  };

  const calcMyProfit = (card) => {
    if (card.status !== "Sold") return 0;
    return card.salePrice - card.totalPaid - calcPartnerProfit(card);
  };

  const soldCards = cards.filter((c) => c.status === "Sold");

  const totalProfit = soldCards.reduce(
    (sum, c) => sum + (c.salePrice - c.totalPaid),
    0
  );

  const partnerProfitTotal = soldCards.reduce(
    (sum, c) => sum + calcPartnerProfit(c),
    0
  );

  const myProfitTotal = soldCards.reduce(
    (sum, c) => sum + calcMyProfit(c),
    0
  );

  const partnerUsedCapital = cards.reduce((sum, c) => {
    if (c.status === "Sold") return sum;
    return sum + c.partnerPaid;
  }, 0);

  const partnerAvailableCapital =
    Number(partner.capital || 0) - partnerUsedCapital;

  const handleCapitalChange = (value) => {
    setPartner({
      ...partner,
      capital: value === "" ? "" : Number(value)
    });
  };

  const handleMeSplitChange = (value) => {
    if (value === "") {
      setPartner({
        ...partner,
        meSplit: "",
        partnerSplit: ""
      });
      return;
    }

    const meValue = Number(value);

    setPartner({
      ...partner,
      meSplit: meValue,
      partnerSplit: 100 - meValue
    });
  };

  const handlePartnerSplitChange = (value) => {
    if (value === "") {
      setPartner({
        ...partner,
        meSplit: "",
        partnerSplit: ""
      });
      return;
    }

    const partnerValue = Number(value);

    setPartner({
      ...partner,
      partnerSplit: partnerValue,
      meSplit: 100 - partnerValue
    });
  };

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

  const openSell = (card) => {
    setSellCard(card);
    setSellForm({ price: "", date: "" });
  };

  const confirmSell = () => {
    const salePrice = Number(sellForm.price);
    if (!salePrice && salePrice !== 0) return;

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

  const deleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredCards = [...cards]
  .filter((card) => {
    if (sortBy === "saleOldest" || sortBy === "saleNewest") {
      return card.status === "Sold";
    }

    if (filter === "sold") return card.status === "Sold";
    if (filter === "holding") return card.status !== "Sold";
    return true;
  })
  .sort((a, b) => {
    const profitA = a.status === "Sold" ? a.salePrice - a.totalPaid : 0;
    const profitB = b.status === "Sold" ? b.salePrice - b.totalPaid : 0;

    if (sortBy === "profitHigh") return profitB - profitA;
    if (sortBy === "profitLow") return profitA - profitB;
    if (sortBy === "valueHigh") return b.totalPaid - a.totalPaid;
if (sortBy === "valueLow") return a.totalPaid - b.totalPaid;
    if (sortBy === "purchaseOldest") return parseDate(a.purchaseDate) - parseDate(b.purchaseDate);
    if (sortBy === "purchaseNewest") return parseDate(b.purchaseDate) - parseDate(a.purchaseDate);
    if (sortBy === "saleOldest") return parseDate(a.saleDate) - parseDate(b.saleDate);
    if (sortBy === "saleNewest") return parseDate(b.saleDate) - parseDate(a.saleDate);

    return 0;
  });

  if (!user) {
    return (
      <div className="authApp">
        <div className="modal">
          <div className="modalBox authBox">
            <h1 className="loginTitle">PokéAssets</h1>

            <h3>{authMode === "login" ? "Log In" : "Create Account"}</h3>

            <input
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
            />

            <input
              placeholder="Password"
              type="password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
            />

            <button className="primaryAuthBtn" onClick={handleEmailAuth}>
              {authMode === "login" ? "Log In" : "Create Account"}
            </button>

            <button className="googleAuthBtn" onClick={handleGoogleLogin}>
              Continue with Google
            </button>

            {authError && <p className="authError">{authError}</p>}

            <button
              className="switchAuthBtn"
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="authApp">
        <div className="modal">
          <div className="modalBox">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app"
      style={backgroundImage ? { "--bg-image": `url(${backgroundImage})` } : {}}
    >
      <aside className="sidebar">
        <div className="appTitle">PokéAssets</div>

        <div className="profileDropdownWrap">
          <button
            className="profilePill"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="profileIcon">
              {username.charAt(0).toUpperCase()}
            </div>

            <span>{username}</span>

            <span className="profileArrow">⌄</span>
          </button>

          {profileOpen && (
            <div className="profileDropdown">
              <div className="profileDropHeader">
                <div className="profileIcon big">
                  {username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p>{username}</p>
                  <span>{user.email}</span>
                </div>
              </div>

              {editingUsername ? (
                <div className="usernameEditBox">
                  <input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Username"
                  />

                  <button onClick={saveUsername}>Save</button>
                </div>
              ) : (
                <button
                  className="dropdownTextBtn"
                  onClick={() => {
                    setUsernameInput(username);
                    setEditingUsername(true);
                  }}
                >
                  Change Username
                </button>
              )}

              <button className="dropdownSignOut" onClick={() => signOut(auth)}>
                Sign Out
              </button>
            </div>
          )}
        </div>

        <input
          placeholder="Card Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Grade (1-10)"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />

        <input
          placeholder="Total Paid"
          type="number"
          value={form.totalPaid}
          onChange={(e) => setForm({ ...form, totalPaid: e.target.value })}
        />

        <input
          placeholder="Partner Paid"
          type="number"
          value={form.partnerPaid}
          onChange={(e) => setForm({ ...form, partnerPaid: e.target.value })}
        />

        <input
          placeholder="Purchase Date"
          value={form.purchaseDate}
          onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
        />

        <button className="addCardBtn" onClick={addCard}>
          Add Card
        </button>

        <div className="partnerBox hoverLift">
          <h3>Partner System</h3>

          <input
            type="number"
            value={partner.capital}
            onChange={(e) => handleCapitalChange(e.target.value)}
            placeholder="Partner Capital"
          />

          <div className="splitBox">
            <p>Profit Split</p>

            <div className="splitRow">
              <div>
                <span>Me %</span>
                <input
                  type="number"
                  value={partner.meSplit}
                  onChange={(e) => handleMeSplitChange(e.target.value)}
                />
              </div>

              <div>
                <span>Partner %</span>
                <input
                  type="number"
                  value={partner.partnerSplit}
                  onChange={(e) => handlePartnerSplitChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="partnerStats">
            <p>
              <span className="labelText">Capital:</span> $
              {formatNumber(partner.capital)}
            </p>
            <p>
              <span className="labelText">Used:</span> $
              {formatNumber(partnerUsedCapital)}
            </p>
            <p>
              <span className="labelText">Available:</span> $
              {formatNumber(partnerAvailableCapital)}
            </p>
          </div>
        </div>

        <div className="backgroundBox">
          <label className="uploadBtn">
            Change Background
            <input type="file" accept="image/*" onChange={changeBackground} hidden />
          </label>

          {backgroundImage && (
            <button className="removeBg" onClick={removeBackground}>
              Remove Background
            </button>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="dashboard">
          <div>
            <span>Total Profit</span>
            <b>${formatNumber(totalProfit)}</b>
          </div>

          <div>
            <span>My Profit</span>
            <b>${formatNumber(myProfitTotal)}</b>
          </div>

          <div>
            <span>Partner Profit</span>
            <b>${formatNumber(partnerProfitTotal)}</b>
          </div>
        </div>

       <div className="filters">
  <button
    className={filter === "all" ? "activeFilter" : ""}
    onClick={() => setFilter("all")}
  >
    All
  </button>

  <button
    className={`soldFilter ${filter === "sold" ? "activeSoldFilter" : ""}`}
    onClick={() => setFilter("sold")}
  >
    Sold
  </button>

  <button
    className={`holdingFilter ${
      filter === "holding" ? "activeHoldingFilter" : ""
    }`}
    onClick={() => setFilter("holding")}
  >
    Holding
  </button>
</div>
<div className="sortBox">
  <span>Sort by</span>

  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="none">Default</option>
  <option value="valueHigh">Value: Highest to Lowest</option>
<option value="valueLow">Value: Lowest to Highest</option>

<option value="profitHigh">Profit: Greatest to Least</option>
<option value="profitLow">Profit: Least to Greatest</option>
    <option value="purchaseOldest">Purchase Date: Earliest to Latest</option>
    <option value="purchaseNewest">Purchase Date: Latest to Earliest</option>
    <option value="saleOldest">Sale Date: Earliest to Latest</option>
    <option value="saleNewest">Sale Date: Latest to Earliest</option>
  
  </select>
</div>
        <div className="grid">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={`card hoverLift ${
                card.status === "Sold" ? "soldCard" : "holdingCard"
              }`}
            >
              <div
                className={`gradeBadge ${getGradeClass(card.grade)} ${
                  Math.round(Number(card.grade)) === 10 ? "glow" : ""
                }`}
              >
                {card.grade}
              </div>

              <h3 className="cardName">{card.name}</h3>

              <p>
                <span className="labelText">Purchase Date:</span>{" "}
                {card.purchaseDate || "—"}
              </p>

              <p>
                <span className="labelText">Paid:</span> $
                {formatNumber(card.totalPaid)}
              </p>

              {Number(card.partnerPaid || 0) > 0 && (
                <p>
                  <span className="labelText">Partner:</span> $
                  {formatNumber(card.partnerPaid)}
                </p>
              )}

              {card.status === "Sold" && (
                <div
                  className={`profitBox hoverLift ${
                    card.salePrice - card.totalPaid >= 0
                      ? "profitBoxPositive"
                      : "profitBoxNegative"
                  }`}
                >
                  <div
                    className={`profitIndicator ${
                      card.salePrice - card.totalPaid >= 0
                        ? "profitPositive"
                        : "profitNegative"
                    }`}
                  />

                  <h3>
  <span className="labelText">Total Profit:</span>{" "}
  {formatMoney(card.salePrice - card.totalPaid)}
</h3>
                  <p>
                    <span className="labelText">Sold For:</span> $
                    {formatNumber(card.salePrice)}
                  </p>

             <p>
  <span className="labelText">My Profit:</span>{" "}
  {formatMoney(calcMyProfit(card))}
</p>
                  {Number(card.partnerPaid || 0) > 0 && (
                    <p>
  <span className="labelText">Partner Profit:</span>{" "}
  {formatMoney(calcPartnerProfit(card))}
</p>
                  )}

                  <p>
                    <span className="labelText">Sale Date:</span>{" "}
                    {card.saleDate || "—"}
                  </p>
                </div>
              )}

              <div className="actions">
                {card.status !== "Sold" && (
                  <button className="sellBtn" onClick={() => openSell(card)}>
                    Sell
                  </button>
                )}

                <button className="trashBtn" onClick={() => deleteCard(card.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

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