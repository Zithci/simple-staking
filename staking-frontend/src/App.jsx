// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getContracts } from "./usecontract";
import { formatUnits, parseUnits } from "ethers";

const cx = (...a) => a.filter(Boolean).join(" ");

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [contracts, setContracts] = useState(null);
  const [account, setAccount] = useState("");
  
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [balance, setBalance] = useState("");
  const [staked, setStaked] = useState("");
  const [rewards, setRewards] = useState("");
  
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [txHash, setTxHash] = useState("");

    // THEME
    useEffect(() => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }, [theme]);

  // CONNECT + AUTO LOAD
  useEffect(() => {
    (async () => {
      try {
        const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accs[0]);
        const { token, staking } = await getContracts();
        setContracts({ token, staking });
        
        const [sym, dec, bal, stk, rew] = await Promise.all([
          token.symbol?.(),
          token.decimals?.(),
          token.balanceOf?.(accs[0]),
          staking.staked?.(accs[0]),
          staking.pendingReward?.(accs[0]) || 0,
        ]);
        
        if (sym) setSymbol(sym);
        const d = dec ? Number(dec) : 18;
        setDecimals(d);
        if (bal) setBalance(formatUnits(bal, d));
        if (stk) setStaked(formatUnits(stk, d));
        setRewards(rew ? formatUnits(rew, d) : "0");
      } catch (e) {
          console.error('Load error:', e);
          setErr("Connect to localhost:8545 or update contract addresses");
      }
    })();
  }, []);

  const ready = useMemo(() => Boolean(contracts && account), [contracts, account]);

  // REFRESH
  const refresh = async () => {
    if (!ready) return;
    setBusy(true);
    setErr("");
    try {
      const { token, staking } = contracts;
      const [bal, stk, rew] = await Promise.all([
        token.balanceOf?.(account),
        staking.staked?.(account),
        staking.pendingReward?.(account) || 0,
      ]);
      if (bal) setBalance(formatUnits(bal, decimals));
      if (stk) setStaked(formatUnits(stk, decimals));
      setRewards(rew ? formatUnits(rew, decimals) : "0");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // STAKE
  const handleStake = async () => {
    if (!ready || !amount || Number(amount) <= 0) return;
    setBusy(true);
    setErr("");
    setTxHash("");
    try {
      const { token, staking } = contracts;
      const amt = parseUnits(amount, decimals);
      
      const allow = await token.allowance(account, staking.target);
      if (allow < amt) {
        const txA = await token.approve(staking.target, amt);
        setTxHash(txA.hash);
        await txA.wait();
      }
      
      const txS = await staking.stake(amt);
      setTxHash(txS.hash);
      await txS.wait();
      setAmount("");
      await refresh();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // UNSTAKE
  const handleUnstake = async () => {
    if (!ready || !staked || Number(staked) === 0) return;
    setBusy(true);
    setErr("");
    setTxHash("");
    try {
      const amt = parseUnits(staked, decimals);
      const tx = await contracts.staking.unstake(amt);
      setTxHash(tx.hash);
      await tx.wait();
      await refresh();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  // CLAIM
  const handleClaim = async () => {
    if (!ready || !rewards || Number(rewards) === 0) return;
    setBusy(true);
    setErr("");
    setTxHash("");
    try {
      const tx = await contracts.staking.claim();
      setTxHash(tx.hash);
      await tx.wait();
      await refresh();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1C1E26] transition-colors duration-200">
      {/* NAVBAR */}
      <nav className="border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-[#23252E]/80 backdrop-blur-sm">
        <div className="max-w-[480px] mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <h1 className="text-lg font-bold text-[#1C1E26] dark:text-white">Staking</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              className={cx(
                "relative w-14 h-7 rounded-full transition-colors duration-200",
                theme === "dark" ? "bg-purple-600" : "bg-neutral-300"
              )}
              aria-label="Toggle theme"
            >
              <div className={cx(
                "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200",
                theme === "dark" ? "translate-x-7" : "translate-x-0.5"
              )}>
                <div className="w-full h-full flex items-center justify-center text-xs">
                  {theme === "dark" ? "🌙" : "☀️"}
                </div>
              </div>
            </button>

            {/* ACCOUNT */}
            <div className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 text-xs font-mono text-neutral-600 dark:text-neutral-400">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "—"}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-[480px] mx-auto px-5 py-6">
        
        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Balance" value={balance} symbol={symbol} />
          <StatCard label="Staked" value={staked} symbol={symbol} accent />
          <StatCard label="Rewards" value={rewards} symbol={symbol} />
        </div>

        {/* MAIN CARD */}
        <div className="bg-white dark:bg-[#23252E] rounded-3xl shadow-lg dark:shadow-none border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden">
          
          {/* INPUT SECTION */}
          <div className="p-6 pb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Amount
              </label>
              <button
                onClick={() => setAmount(balance || "0")}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                MAX
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={handleAmountChange}
                className={cx(
                  "w-full text-5xl font-bold bg-transparent border-none outline-none",
                  "text-[#1C1E26] dark:text-white placeholder-neutral-300 dark:placeholder-neutral-700",
                  "pb-2"
                )}
              />
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <span className="text-sm font-medium">{symbol || "TOKEN"}</span>
                {balance && (
                  <span className="text-xs">
                    Balance: {parseFloat(balance).toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

          {/* BUTTONS SECTION */}
          <div className="p-6 pt-4 space-y-3">
            {/* PRIMARY BUTTON */}
            <button
              onClick={handleStake}
              disabled={!ready || busy || !amount}
              className={cx(
                "w-full h-14 rounded-2xl font-semibold text-base transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "text-white shadow-lg shadow-purple-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                "active:scale-[0.98]"
              )}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Processing...
                </span>
              ) : "Stake"}
            </button>

            {/* SECONDARY BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleUnstake}
                disabled={!ready || busy || !staked || Number(staked) === 0}
                className={cx(
                  "h-12 rounded-xl font-medium text-sm transition-all duration-200",
                  "bg-neutral-100 dark:bg-neutral-800/50",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700/50",
                  "text-neutral-700 dark:text-neutral-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-[0.98]"
                )}
              >
                Unstake All
              </button>
              
              <button
                onClick={handleClaim}
                disabled={!ready || busy || !rewards || Number(rewards) === 0}
                className={cx(
                  "h-12 rounded-xl font-medium text-sm transition-all duration-200",
                  "bg-neutral-100 dark:bg-neutral-800/50",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700/50",
                  "text-neutral-700 dark:text-neutral-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "active:scale-[0.98]"
                )}
              >
                Claim Rewards
              </button>
            </div>
          </div>
        </div>

        {/* TX HASH */}
        {txHash && (
          <div className="mt-4 p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
            <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
              Transaction submitted
            </div>
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-green-600 dark:text-green-500 hover:underline"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        )}

        {/* ERROR */}
        {err && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
              Error
            </div>
            <p className="text-xs text-red-600 dark:text-red-500">{err}</p>
          </div>
        )}

        {/* REFRESH */}
        <button
          onClick={refresh}
          disabled={!ready || busy}
          className={cx(
            "w-full mt-4 py-2 text-sm font-medium transition-colors",
            "text-neutral-500 dark:text-neutral-400",
            "hover:text-neutral-700 dark:hover:text-neutral-300",
            "disabled:opacity-40"
          )}
        >
          <span className="inline-flex items-center gap-1">
            Refresh
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </span>
        </button>
      </main>
    </div>
  );
}

// STAT CARD
function StatCard({ label, value, symbol, accent }) {
  return (
    <div className={cx(
      "rounded-2xl p-4 border transition-all duration-200 hover:scale-105",
      accent
        ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30"
        : "bg-white dark:bg-[#23252E] border-neutral-200/50 dark:border-neutral-800/50"
    )}>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
        {label}
      </div>
      <div className={cx(
        "text-lg font-bold mb-0.5",
        accent ? "text-purple-600 dark:text-purple-400" : "text-[#1C1E26] dark:text-white"
      )}>
        {parseFloat(value || 0).toFixed(2)}
      </div>
      <div className="text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">
        {symbol}
      </div>
    </div>
  );
}

// SPINNER
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}