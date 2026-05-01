import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export const Route = createFileRoute("/disguise")({
  head: () => ({ meta: [{ title: "Calculator" }] }),
  component: DisguisePage,
});

const SECRET = "1337=";

function DisguisePage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");

  function press(key: string) {
    if (key === "C") {
      setDisplay("0"); setExpr(""); return;
    }
    if (key === "=") {
      const candidate = expr + "=";
      if (candidate === SECRET) {
        nav({ to: "/" });
        return;
      }
      try {
        // Safe-ish for digits and operators only
        if (!/^[\d+\-*/.() ]+$/.test(expr)) { setDisplay("Err"); return; }
         
        const r = Function(`"use strict";return (${expr})`)();
        setDisplay(String(r));
        setExpr(String(r));
      } catch {
        setDisplay("Err");
      }
      return;
    }
    const next = (expr === "0" || expr === "Err" ? "" : expr) + key;
    setExpr(next);
    setDisplay(next);
  }

  const keys = [
    ["C", "(", ")", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "=", ""],
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-xs rounded-3xl bg-slate-800 p-5 shadow-2xl">
        <div className="mb-4 rounded-2xl bg-slate-950 p-5 text-right">
          <div className="h-4 text-xs text-slate-500">{expr || " "}</div>
          <div className="mt-1 truncate font-mono text-3xl font-semibold text-white">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.flat().map((k, i) =>
            k === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => press(k)}
                className={`h-14 rounded-xl text-lg font-medium transition-colors ${
                  k === "=" ? "bg-orange-500 text-white hover:bg-orange-400" :
                  ["+","-","*","/","(",")"].includes(k) ? "bg-slate-700 text-orange-400 hover:bg-slate-600" :
                  k === "C" ? "bg-slate-700 text-red-400 hover:bg-slate-600" :
                  "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {k}
              </button>
            )
          )}
        </div>
        <div className="mt-3 text-center text-[9px] text-slate-600">v1.0.4</div>
      </div>
    </div>
  );
}
