import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";

const FACEBOOK_URL = "";
const INSTAGRAM_URL =
  "https://www.instagram.com/hrsportsandnutrision/";
const YOUTUBE_URL = "";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#0b101c] border-b border-slate-800/80 px-4 py-2 text-xs text-white">
      <div className="container-custom flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <FiTruck className="text-[#f5b800]" size={15} />
          <p>
            Free delivery across India on orders above{" "}
            <span className="font-bold text-[#f5b800]">₹999</span> 🚚
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Follow Us:
          </span>
          <div className="flex items-center gap-3">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-[#f5b800] transition"
              title="Facebook - HR Sports & Nutrition"
            >
              <FaFacebookF size={13} />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-[#f5b800] transition"
              title="Instagram - @hrsportsandnutrision"
            >
              <FaInstagram size={14} />
            </a>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-[#f5b800] transition"
              title="YouTube - HR Sports & Nutrition"
            >
              <FaYoutube size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}