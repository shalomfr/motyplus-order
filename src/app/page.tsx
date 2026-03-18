"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Upload,
  CreditCard,
  Music,
  CheckCircle2,
  FileText,
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

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/public/organs`).then((r) => r.json()),
      fetch(`${API}/api/public/sets`).then((r) => r.json()),
      fetch(`${API}/api/public/updates`).then((r) => r.json()),
    ])
      .then(([o, s, u]) => {
        setOrgans(o);
        setSets(s);
        setUpdates(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedSet = sets.find((s) => s.id === setTypeId);
  const selectedUpdate = updates.find((u) => u.id === updateVersionId);
  const totalPrice = isUpdateOnly
    ? Number(selectedUpdate?.price || 0)
    : Number(selectedSet?.price || 0);

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
      setError("שגיאה בשליחת הטופס");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">טופס הזמנה</h2>
        <p className="text-gray-500 mt-1">
          בחרו את המוצר, העלו קובץ אינפו ועברו לתשלום
        </p>
      </div>

      {/* פרטים אישיים */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          פרטים אישיים
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="הזן שם מלא"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון *</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מייל *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* בחירת אורגן */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-500" />
          בחירת אורגן
        </h3>
        <select
          value={organId}
          onChange={(e) => setOrganId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">בחר אורגן</option>
          {organs.map((organ) => (
            <option key={organ.id} value={organ.id}>
              {organ.name}
            </option>
          ))}
        </select>
      </div>

      {/* סוג הזמנה */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">סוג הזמנה</h3>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              !isUpdateOnly
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => { setIsUpdateOnly(false); setUpdateVersionId(""); }}
          >
            רכישת סט
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              isUpdateOnly
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => { setIsUpdateOnly(true); setSetTypeId(""); }}
          >
            עדכון תוכנה בלבד
          </button>
        </div>

        {!isUpdateOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sets.map((set) => (
              <div
                key={set.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  setTypeId === set.id
                    ? "border-blue-500 bg-blue-50"
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
                    {Number(set.price).toLocaleString()} ₪
                  </span>
                  {set.includesUpdates && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-300 rounded-full px-2 py-0.5">
                      כולל עדכונים
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isUpdateOnly && (
          <select
            value={updateVersionId}
            onChange={(e) => setUpdateVersionId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">בחר גרסת עדכון</option>
            {updates.map((ver) => (
              <option key={ver.id} value={ver.id}>
                {ver.version} — {Number(ver.price).toLocaleString()} ₪
              </option>
            ))}
          </select>
        )}
      </div>

      {/* העלאת קובץ אינפו */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-teal-500" />
          קובץ אינפו
        </h3>
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
            onChange={(e) => setInfoFile(e.target.files?.[0] || null)}
          />
          {infoFile ? (
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{infoFile.name}</span>
              <span className="text-sm text-gray-500">
                ({(infoFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-600">
                לחצו להעלאת קובץ אינפו (.n27)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                הקובץ נמצא באורגן שלכם
              </p>
            </div>
          )}
        </div>
      </div>

      {/* הערות */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות (אופציונלי)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות נוספות..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* שגיאה */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* סיכום + תשלום */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-lg">סה&quot;כ לתשלום:</span>
          <span className="text-3xl font-bold text-blue-600">
            {totalPrice > 0 ? `${totalPrice.toLocaleString()} ₪` : "—"}
          </span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || totalPrice <= 0}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-lg font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              לתשלום מאובטח
            </>
          )}
        </button>
        <p className="text-xs text-center text-gray-500 mt-3">
          התשלום מבוצע באופן מאובטח דרך iCount
        </p>
      </div>
    </form>
  );
}
