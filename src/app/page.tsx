"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Upload,
  CreditCard,
  Music,
  CheckCircle2,
  FileText,
  AlertCircle,
  Cpu,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://motyplus-2hvb.onrender.com";

interface Organ {
  id: string;
  name: string;
  supportsUpdates: boolean;
}

interface SetType {
  id: string;
  name: string;
  price: number;
  includesUpdates: boolean;
}

interface UpdateVersion {
  id: string;
  version: string;
  price: number;
  description: string | null;
}

interface InstrumentInfo {
  name: string;
  serial: string;
  fullId: string;
}

// Parse .n27 binary to detect instrument model
function parseN27(buf: Uint8Array): InstrumentInfo {
  const readStr = (offset: number, maxLen: number) => {
    let end = offset;
    while (end < offset + maxLen && end < buf.length && buf[end] !== 0) end++;
    return new TextDecoder("ascii").decode(buf.slice(offset, end));
  };
  return {
    name: readStr(0, 64).trim(),
    serial: buf.length >= 88 ? readStr(64, 24).trim() : "",
    fullId: buf.length >= 120 ? readStr(88, 32).trim() : "",
  };
}

// Try to match detected instrument name to organs list
function matchOrgan(detectedName: string, organs: Organ[]): Organ | null {
  if (!detectedName) return null;
  const lower = detectedName.toLowerCase().replace(/[-_\s]+/g, "");

  // Exact match first
  for (const organ of organs) {
    const organLower = organ.name.toLowerCase().replace(/[-_\s]+/g, "");
    if (lower === organLower || lower.includes(organLower) || organLower.includes(lower)) {
      return organ;
    }
  }

  // Partial keyword match
  const keywords = lower.match(/[a-z]+|\d+/g) || [];
  for (const organ of organs) {
    const organLower = organ.name.toLowerCase();
    const matched = keywords.filter((kw) => organLower.includes(kw));
    if (matched.length >= 2) return organ;
  }

  return null;
}

export default function OrderPage() {
  const [organs, setOrgans] = useState<Organ[]>([]);
  const [sets, setSets] = useState<SetType[]>([]);
  const [updates, setUpdates] = useState<UpdateVersion[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organId, setOrganId] = useState("");
  const [isUpdateOnly, setIsUpdateOnly] = useState(false);
  const [setTypeId, setSetTypeId] = useState("");
  const [updateVersionId, setUpdateVersionId] = useState("");
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detectedInstrument, setDetectedInstrument] = useState<InstrumentInfo | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/public/organs`).then((r) => {
        if (!r.ok) throw new Error("שגיאה בטעינת רשימת אורגנים");
        return r.json();
      }),
      fetch(`${API}/api/public/sets`).then((r) => {
        if (!r.ok) throw new Error("שגיאה בטעינת רשימת סטים");
        return r.json();
      }),
      fetch(`${API}/api/public/updates`).then((r) => {
        if (!r.ok) throw new Error("שגיאה בטעינת רשימת עדכונים");
        return r.json();
      }),
    ])
      .then(([o, s, u]) => {
        setOrgans(o);
        setSets(s);
        setUpdates(u);
      })
      .catch((err) => {
        setLoadError(err.message || "שגיאה בטעינת הנתונים. נסו לרענן את הדף.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setInfoFile(file);
      setDetectedInstrument(null);
      setAutoDetected(false);

      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const buf = new Uint8Array(reader.result as ArrayBuffer);
        const info = parseN27(buf);
        setDetectedInstrument(info);

        if (info.name && organs.length > 0) {
          const matched = matchOrgan(info.name, organs);
          if (matched) {
            setOrganId(matched.id);
            setAutoDetected(true);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [organs]
  );

  const selectedSet = sets.find((s) => s.id === setTypeId);
  const selectedUpdate = updates.find((u) => u.id === updateVersionId);
  const totalPrice = isUpdateOnly
    ? Number(selectedUpdate?.price || 0)
    : Number(selectedSet?.price || 0);

  const selectedOrgan = organs.find((o) => o.id === organId);
  const canSubmit =
    fullName.length >= 2 &&
    phone.length >= 9 &&
    email.includes("@") &&
    organId &&
    infoFile &&
    (isUpdateOnly ? !!updateVersionId : !!setTypeId) &&
    totalPrice > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || fullName.length < 2) {
      setError("יש להזין שם מלא");
      return;
    }
    if (!phone || phone.length < 9) {
      setError("מספר טלפון לא תקין");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("כתובת מייל לא תקינה");
      return;
    }
    if (!organId) {
      setError("יש לבחור אורגן");
      return;
    }
    if (!isUpdateOnly && !setTypeId) {
      setError("יש לבחור סוג סט");
      return;
    }
    if (isUpdateOnly && !updateVersionId) {
      setError("יש לבחור גרסת עדכון");
      return;
    }
    if (!infoFile) {
      setError("יש להעלות קובץ אינפו (.n27)");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("phone", phone);
      fd.append("email", email);
      fd.append("organId", organId);
      fd.append("isUpdateOnly", String(isUpdateOnly));
      if (setTypeId) fd.append("setTypeId", setTypeId);
      if (updateVersionId) fd.append("updateVersionId", updateVersionId);
      if (notes) fd.append("notes", notes);
      fd.append("infoFile", infoFile);

      const res = await fetch(`${API}/api/public/create-payment`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה ביצירת ההזמנה");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("שגיאה בשליחת הטופס. נסו שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-gray-500 text-sm">טוען נתונים...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          רענן את הדף
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">טופס הזמנה</h2>
        <p className="text-gray-500 mt-1">
          העלו קובץ אינפו, בחרו מוצר ועברו לתשלום
        </p>
      </div>

      {/* שלב 1 — העלאת קובץ אינפו (ראשון — כדי לזהות אורגן) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Upload className="h-5 w-5 text-teal-500" />
          שלב 1 — קובץ אינפו
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          העלו את קובץ האינפו מהאורגן שלכם — המערכת תזהה אוטומטית את סוג האורגן
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            infoFile
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-blue-300"
          }`}
          onClick={() => document.getElementById("infoFile")?.click()}
        >
          <input
            id="infoFile"
            type="file"
            accept=".n27"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          {infoFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{infoFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({(infoFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              {detectedInstrument?.name && (
                <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 rounded-lg py-2 px-3 mx-auto w-fit">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    זוהה: {detectedInstrument.name}
                  </span>
                  {detectedInstrument.serial && (
                    <span className="text-xs text-gray-500">
                      (S/N: {detectedInstrument.serial})
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-600">
                לחצו להעלאת קובץ אינפו (.n27)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                הקובץ נמצא באורגן שלכם — USER FILES או USB
              </p>
            </div>
          )}
        </div>
        {infoFile && (
          <button
            type="button"
            className="text-xs text-red-500 hover:text-red-700 mt-2"
            onClick={() => {
              setInfoFile(null);
              setDetectedInstrument(null);
              setAutoDetected(false);
              const el = document.getElementById("infoFile") as HTMLInputElement;
              if (el) el.value = "";
            }}
          >
            הסר קובץ
          </button>
        )}
      </div>

      {/* שלב 2 — בחירת אורגן */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-500" />
          שלב 2 — בחירת אורגן
        </h3>
        {autoDetected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            האורגן זוהה אוטומטית מקובץ האינפו. ניתן לשנות ידנית במידת הצורך.
          </div>
        )}
        <select
          value={organId}
          onChange={(e) => {
            setOrganId(e.target.value);
            setAutoDetected(false);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">בחר אורגן</option>
          {organs.map((organ) => (
            <option key={organ.id} value={organ.id}>
              {organ.name}
            </option>
          ))}
        </select>
      </div>

      {/* שלב 3 — סוג הזמנה */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-500" />
          שלב 3 — בחירת מוצר
        </h3>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
              !isUpdateOnly
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setIsUpdateOnly(false);
              setUpdateVersionId("");
            }}
          >
            רכישת סט
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
              isUpdateOnly
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setIsUpdateOnly(true);
              setSetTypeId("");
            }}
          >
            עדכון תוכנה בלבד
          </button>
        </div>

        {!isUpdateOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sets.map((set) => {
              const price = Number(set.price);
              if (price <= 0) return null;
              return (
                <div
                  key={set.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    setTypeId === set.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSetTypeId(set.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{set.name}</span>
                    {setTypeId === set.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600">
                      {price.toLocaleString()} ₪
                    </span>
                    {set.includesUpdates && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-300 rounded-full px-2 py-0.5">
                        כולל עדכונים
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isUpdateOnly && (
          <>
            {selectedOrgan && !selectedOrgan.supportsUpdates && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                האורגן שנבחר ({selectedOrgan.name}) לא תומך בעדכוני תוכנה
              </div>
            )}
            <div className="space-y-2">
              {updates
                .filter((v) => Number(v.price) > 0)
                .map((ver) => (
                  <div
                    key={ver.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between ${
                      updateVersionId === ver.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setUpdateVersionId(ver.id)}
                  >
                    <div className="flex items-center gap-3">
                      {updateVersionId === ver.id ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="font-medium">{ver.version}</span>
                      {ver.description && (
                        <span className="text-xs text-gray-400">
                          {ver.description}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-blue-600">
                      {Number(ver.price).toLocaleString()} ₪
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* שלב 4 — פרטים אישיים */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          שלב 4 — פרטים אישיים
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא *
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="הזן שם מלא"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מייל *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערות (אופציונלי)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* שגיאה */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* סיכום + תשלום */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        {/* סיכום הזמנה */}
        {(selectedSet || selectedUpdate || selectedOrgan) && (
          <div className="bg-white rounded-lg p-3 mb-4 text-sm space-y-1">
            {selectedOrgan && (
              <div className="flex justify-between">
                <span className="text-gray-500">אורגן:</span>
                <span className="font-medium">{selectedOrgan.name}</span>
              </div>
            )}
            {selectedSet && (
              <div className="flex justify-between">
                <span className="text-gray-500">סט:</span>
                <span className="font-medium">{selectedSet.name}</span>
              </div>
            )}
            {selectedUpdate && (
              <div className="flex justify-between">
                <span className="text-gray-500">עדכון:</span>
                <span className="font-medium">{selectedUpdate.version}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-lg">סה&quot;כ לתשלום:</span>
          <span className="text-3xl font-bold text-blue-600">
            {totalPrice > 0 ? `${totalPrice.toLocaleString()} ₪` : "—"}
          </span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מעבד הזמנה...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              לתשלום מאובטח
            </>
          )}
        </button>
        {!canSubmit && !isSubmitting && (
          <p className="text-xs text-center text-orange-500 mt-2">
            {!infoFile
              ? "יש להעלות קובץ אינפו"
              : !organId
                ? "יש לבחור אורגן"
                : !isUpdateOnly && !setTypeId
                  ? "יש לבחור סוג סט"
                  : isUpdateOnly && !updateVersionId
                    ? "יש לבחור גרסת עדכון"
                    : !fullName || fullName.length < 2
                      ? "יש להזין שם מלא"
                      : !phone || phone.length < 9
                        ? "יש להזין מספר טלפון תקין"
                        : !email || !email.includes("@")
                          ? "יש להזין כתובת מייל תקינה"
                          : ""}
          </p>
        )}
        <p className="text-xs text-center text-gray-500 mt-3">
          התשלום מבוצע באופן מאובטח דרך iCount
        </p>
      </div>
    </form>
  );
}
