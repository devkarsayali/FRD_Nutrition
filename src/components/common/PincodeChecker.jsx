import { useState } from "react";
import { FiCheckCircle, FiClock, FiMapPin, FiSearch, FiTruck, FiXCircle } from "react-icons/fi";

export default function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || isNaN(pincode)) {
      setResult({
        status: "error",
        message: "Please enter a valid 6-digit Indian Pincode.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setLoading(false);
      setResult({
        status: "success",
        pincode: pincode.trim(),
        deliveryTime: "4–8 Business Days",
        dispatchTime: "24–48 Working Hours",
        shippingFee: "₹50 per order",
        codAvailable: false,
        serviceable: true,
      });
    }, 400);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
          <FiMapPin className="text-[#f5b800]" size={16} />
          <span>Delivery & Serviceability Check</span>
        </div>
        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
          Pan-India
        </span>
      </div>

      <form onSubmit={handleCheck} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              if (result) setResult(null);
            }}
            placeholder="Enter 6-digit Pincode (e.g. 400001)"
            className="w-full bg-slate-950 border border-slate-800 focus:border-[#f5b800] rounded-2xl pl-4 pr-3 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-2xl bg-[#f5b800] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs transition cursor-pointer shrink-0 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
        >
          {loading ? (
            <span>Checking...</span>
          ) : (
            <>
              <FiSearch size={14} />
              <span>Check</span>
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95 duration-150">
          {result.status === "error" ? (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
              <FiXCircle size={16} className="shrink-0" />
              <span>{result.message}</span>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <FiCheckCircle size={15} />
                  <span>Serviceable Pincode {result.pincode}</span>
                </span>
                <span className="font-black text-[#f5b800] text-xs">₹50 Flat Shipping</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <FiTruck className="text-amber-400 shrink-0" size={14} />
                  <span>Delivery in <strong>{result.deliveryTime}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <FiClock className="text-blue-400 shrink-0" size={14} />
                  <span>Dispatch in <strong>{result.dispatchTime}</strong></span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between pt-1 border-t border-slate-800/50">
                <span>❌ COD Unavailable (Prepaid Orders Only)</span>
                <span>Direct Official Authenticated Sealed Stock</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
