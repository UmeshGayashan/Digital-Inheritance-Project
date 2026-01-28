"use client";

import { useEffect, useState } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/constants";
import { Copy, ShieldCheck, Timer, AlertTriangle, RefreshCw, Wallet, Download } from "lucide-react";

type ContractData = {
  owner: string;
  beneficiary: string;
  lastHeartbeat: number;
  timeLimit: number;
  balance: string;
};

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDead, setIsDead] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const _provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await _provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setProvider(_provider);
      } catch (err) {
        console.error("Connection error:", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchContractData = async () => {
    if (!provider) return;
    try {
      const signer = await provider.getSigner();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(_contract);

      const owner = await _contract.owner();
      const beneficiary = await _contract.beneficiary();
      const lastHeartbeat = await _contract.lastHeartbeat();
      const timeLimit = await _contract.timeLimit();
      const balance = await _providerBalance(CONTRACT_ADDRESS);

      setData({
        owner,
        beneficiary,
        lastHeartbeat: Number(lastHeartbeat),
        timeLimit: Number(timeLimit),
        balance: ethers.formatEther(balance)
      });
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  const _providerBalance = async (address: string) => {
    if (!provider) return BigInt(0);
    return await provider.getBalance(address);
  };

  useEffect(() => {
    if (provider) {
      fetchContractData();
    }
  }, [provider]);

  // Timer Logic
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const deadline = data.lastHeartbeat + data.timeLimit;
      const now = Math.floor(Date.now() / 1000);
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeLeft("EXPIRED");
        setIsDead(true);
      } else {
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        setIsDead(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handlePing = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.ping();
      await tx.wait();
      fetchContractData();
      alert("Heartbeat updated!");
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract || !depositAmount) return;
    setLoading(true);
    try {
      const tx = await contract.deposit({ value: ethers.parseEther(depositAmount) });
      await tx.wait();
      fetchContractData();
      setDepositAmount("");
      alert("Deposit successful!");
    } catch (err) {
      console.error(err);
      alert("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.claim();
      await tx.wait();
      fetchContractData();
      alert("Inheritance claimed!");
    } catch (err) {
      console.error(err);
      alert("Claim failed");
    } finally {
      setLoading(false);
    }
  };

  const getView = () => {
    if (!account || !data) return "CONNECT";
    if (account.toLowerCase() === data.owner.toLowerCase()) return "OWNER";
    if (account.toLowerCase() === data.beneficiary.toLowerCase()) return "BENEFICIARY";
    return "STRANGER";
  };

  const view = getView();

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-6 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <nav className="w-full max-w-4xl flex justify-between items-center mb-12 backdrop-blur-md bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <ShieldCheck className="text-slate-950 w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Digital Inheritance
          </h1>
        </div>
        {!account ? (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-5 py-2.5 rounded-xl transition-all duration-300 border border-slate-700 hover:border-cyan-500/30 group"
          >
            <Wallet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-slate-300">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        )}
      </nav>

      {/* Main Card */}
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
        <div className="relative bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">

          {/* Status Display used in both views if connected */}
          {data && (
            <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center">
              <span className="text-slate-400 text-xs uppercase tracking-widest mb-2 font-semibold">Vault Balance</span>
              <div className="text-4xl font-bold text-white mb-1 flex items-baseline gap-1">
                {Number(data.balance).toFixed(4)} <span className="text-lg text-cyan-500 font-medium">ETH</span>
              </div>
            </div>
          )}

          {view === "CONNECT" && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-slate-200">Welcome Back</h2>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                Connect your wallet to access the secure Digital Inheritance Vault.
              </p>
              <button
                onClick={connectWallet}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-cyan-900/20"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {view === "OWNER" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  System Secure
                </span>
                <span className="text-xs text-slate-500 font-mono">OWNER ACCESS</span>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Heartbeat Status</h3>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Time Until Expiry</span>
                    <span className="font-mono text-lg text-slate-200">{timeLeft}</span>
                  </div>
                  <Timer className="text-cyan-500 w-6 h-6 opacity-80" />
                </div>
              </div>

              <button
                onClick={handlePing}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 group"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                {loading ? "Confirming..." : "PING (I'M ALIVE)"}
              </button>

              <div className="pt-6 border-t border-slate-800">
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Deposit Funds</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0 ETH"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={loading}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 rounded-xl font-medium transition-colors"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "BENEFICIARY" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  Inheritance Protocol
                </span>
                <span className="text-xs text-slate-500 font-mono">BENEFICIARY VIEW</span>
              </div>

              <div className={`rounded-xl p-6 border ${isDead ? "bg-red-950/20 border-red-900/50" : "bg-slate-950/50 border-slate-800"}`}>
                <div className="flex items-start gap-4">
                  {isDead ? (
                    <AlertTriangle className="text-red-500 w-8 h-8 shrink-0" />
                  ) : (
                    <Timer className="text-slate-500 w-8 h-8 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDead ? "text-red-400" : "text-slate-300"}`}>
                      {isDead ? "FUNDS UNLOCKED" : "Funds Locked"}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {isDead
                        ? "The owner has been inactive for the specified duration. You are now authorized to claim the inheritance."
                        : `The owner is currently active. Funds will unlock if no activity is detected for the remaining duration: ${timeLeft}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={!isDead || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2
                  ${isDead
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  }`}
              >
                {loading ? "Processing..." : (
                  <>
                    <Download className="w-5 h-5" />
                    CLAIM INHERITANCE
                  </>
                )}
              </button>
            </div>
          )}

          {view === "STRANGER" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/30">
                <ShieldCheck className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-red-400 mb-2">Access Denied</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                You are utilizing an unauthorized wallet address ({account?.slice(0, 6)}...). <br />
                This contract is restricted to the Owner and the designated Beneficiary.
              </p>
            </div>
          )}

        </div>

        {/* Footer info */}
        {data && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 mb-1">Owner Address</div>
              <div className="text-xs font-mono text-cyan-400 truncate">{data.owner}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 mb-1">Beneficiary Address</div>
              <div className="text-xs font-mono text-purple-400 truncate">{data.beneficiary}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
