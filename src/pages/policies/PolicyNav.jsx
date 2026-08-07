import { FiFileText, FiLock, FiRefreshCw, FiTruck } from "react-icons/fi";
import { NavLink } from "react-router-dom";

export default function PolicyNav() {
  const policyTabs = [
    { name: "Shipping Info", path: "/shipping-info", icon: FiTruck },
    { name: "Returns & Refunds", path: "/returns-policy", icon: FiRefreshCw },
    { name: "Privacy Policy", path: "/privacy-policy", icon: FiLock },
    { name: "Terms & Conditions", path: "/terms-conditions", icon: FiFileText },
  ];

  return (
    <div className="flex items-center sm:justify-center gap-2 sm:gap-3 bg-[#0f172a]/90 p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-slate-800 shadow-xl max-w-4xl mx-auto mb-8 sm:mb-10 overflow-x-auto no-scrollbar">
      {policyTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-black tracking-wider transition-all duration-300 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`
            }
          >
            <Icon size={16} />
            <span>{tab.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
