import { useEffect, useState } from "react";
import { FiCheckCircle, FiMail, FiPhone, FiSearch, FiShoppingBag, FiUser, FiUsers } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function AdminCustomersPage() {
  const outletContext = useOutletContext();
  const globalSearch = outletContext?.searchQuery || "";
  const [localSearch, setLocalSearch] = useState("");
  const [customers, setCustomers] = useState([]);

  const search = globalSearch || localSearch;

  useEffect(() => {
    loadCustomers();

    const handleStorageUpdate = () => loadCustomers();
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("frd_orders_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("frd_orders_updated", handleStorageUpdate);
    };
  }, []);

  const loadCustomers = () => {
    try {
      // 1. Deduplicate all orders by order.id across all localStorage keys
      const uniqueOrdersMap = new Map();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            const orderList = Array.isArray(data) ? data : [data];

            orderList.forEach((order) => {
              if (order && order.id) {
                uniqueOrdersMap.set(order.id, order);
              }
            });
          } catch (e) {
            // ignore non-JSON items
          }
        }
      }

      // 2. Aggregate unique orders per customer email
      const customerMap = new Map();

      uniqueOrdersMap.forEach((order) => {
        const email = (
          order.customer?.email ||
          order.shippingAddress?.email ||
          "guest@frdnutrition.com"
        ).toLowerCase().trim();

        const name =
          order.customer?.fullName ||
          order.shippingAddress?.name ||
          "Customer";

        const phone =
          order.customer?.phone ||
          order.shippingAddress?.phone ||
          "N/A";

        const amount = Number(order.total || order.totalAmount || 0);

        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: `CUST-${email.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
            name,
            email,
            phone,
            totalOrders: 1,
            totalSpend: amount,
            lastOrderDate: order.date || order.orderDate || "Recent",
            status: "Active Customer",
          });
        } else {
          const existing = customerMap.get(email);
          existing.totalOrders += 1;
          existing.totalSpend += amount;
          if (name && name !== "Customer") existing.name = name;
          if (phone && phone !== "N/A") existing.phone = phone;
        }
      });

      // Add logged in user profile if present
      const savedUser = localStorage.getItem("frd_user_profile");
      if (savedUser) {
        try {
          const profile = JSON.parse(savedUser);
          const email = (profile.email || "").toLowerCase().trim();
          if (email && !customerMap.has(email)) {
            customerMap.set(email, {
              id: `CUST-REG-${Date.now().toString().slice(-4)}`,
              name: profile.name || "Registered User",
              email,
              phone: profile.phone || "N/A",
              totalOrders: 0,
              totalSpend: 0,
              lastOrderDate: "Registered Member",
              status: "Active Member",
            });
          }
        } catch (e) {
          // ignore
        }
      }

      setCustomers(Array.from(customerMap.values()));
    } catch (err) {
      console.error("Failed to load customer list:", err);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.email.toLowerCase().includes(q) ||
      cust.phone.toLowerCase().includes(q)
    );
  });

  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalOrdersPlaced = customers.reduce((acc, c) => acc + c.totalOrders, 0);

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141813] p-5 rounded-2xl border border-neutral-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
            <FiUsers size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="font-heading font-black text-2xl text-white block">
              {customers.length}
            </span>
          </div>
        </div>

        <div className="bg-[#141813] p-5 rounded-2xl border border-neutral-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FiShoppingBag size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Customer Orders
            </span>
            <span className="font-heading font-black text-2xl text-white block">
              {totalOrdersPlaced}
            </span>
          </div>
        </div>

        <div className="bg-[#141813] p-5 rounded-2xl border border-neutral-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <span className="font-heading font-black text-lg">₹</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Customer Spend
            </span>
            <span className="font-heading font-black text-2xl text-lime-400 block">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#141813] rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-neutral-800/80 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
            Registered & Ordering Customers ({filteredCustomers.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search customer name, email..."
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-lime-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition"
            />
            <FiSearch className="absolute left-3.5 top-3 text-neutral-500" size={15} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-5">Customer Profile</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5 text-center">Orders Placed</th>
                <th className="py-3.5 px-5 text-right">Total Spend</th>
                <th className="py-3.5 px-5">Last Order / Active</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-neutral-500 text-xs">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.email}
                    className="hover:bg-neutral-900/50 transition duration-150"
                  >
                    {/* Name & ID */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-lime-500/20 border border-lime-500/30 flex items-center justify-center font-bold text-lime-400 uppercase text-sm shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {cust.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 block">
                            {cust.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <FiMail size={12} className="text-neutral-500 shrink-0" />
                          <span>{cust.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                          <FiPhone size={12} className="text-neutral-500 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Orders Placed */}
                    <td className="py-4 px-5 text-center">
                      <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-black text-white font-mono">
                        {cust.totalOrders} {cust.totalOrders === 1 ? "Order" : "Orders"}
                      </span>
                    </td>

                    {/* Total Spend */}
                    <td className="py-4 px-5 text-right">
                      <span className="font-heading font-black text-sm text-lime-400">
                        ₹{cust.totalSpend.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Last Order Date */}
                    <td className="py-4 px-5 text-neutral-400 text-xs">
                      {cust.lastOrderDate}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                        <FiCheckCircle size={11} />
                        <span>{cust.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
