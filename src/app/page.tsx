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
import { EmailInput } from "@/components/email-input";

// API calls go through Next.js rewrites proxy (no CORS needed)
const CRM = "";

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
  waveUnits: number;
}

// Parse .n27 binary to detect instrument model
function parseN27(buf: Uint8Array): InstrumentInfo {
  const readStr = (offset: number, maxLen: number) => {
    let end = offset;
    while (end < offset + maxLen && end < buf.length && buf[end] !== 0) end++;
    return new TextDecoder("ascii").decode(buf.slice(offset, end));
  };
  let waveUnits = 0;
  if (buf.length >= 0x7C) {
    waveUnits = ((buf[0x78] << 24) | (buf[0x79] << 16) | (buf[0x7A] << 8) | buf[0x7B]) >>> 0;
  }
  return {
    name: readStr(0, 64).trim(),
    serial: buf.length >= 88 ? readStr(64, 24).trim() : "",
    fullId: buf.length >= 120 ? readStr(88, 32).trim() : "",
    waveUnits,
  };
}

// Try to match detected instrument name to organs list
// Uses waveUnits to distinguish Tyros5-1G from Tyros5-2G
function matchOrgan(detectedName: string, organs: Organ[], waveUnits = 0): Organ | null {
  if (!detectedName) return null;
  const normalize = (s: string) => s.toLowerCase().replace(/[-_\s]+/g, "");
  const lower = normalize(detectedName);

  // Exact match first
  const exact = organs.find(o => normalize(o.name) === lower);
  if (exact) return exact;

  // Partial match — collect all candidates
  const candidates = organs.filter(o => {
    const oLower = normalize(o.name);
    return lower.includes(oLower) || oLower.includes(lower);
  });

  // Disambiguate Tyros5-1G vs Tyros5-2G using waveUnits (offset 122)
  // 0x03FF = 1G, 0x07FF = 2G
  if (candidates.length > 1 && lower.includes("tyros5") && waveUnits > 0) {
    const suffix = waveUnits === 0x07FF ? "2g" : "1g";
    const specific = candidates.find(c => normalize(c.name).includes(suffix));
    if (specific) return specific;
  }

  if (candidates.length > 0) return candidates[0];

  // Partial keyword match fallback
  const keywords = lower.match(/[a-z]+|\d+/g) || [];
  for (const organ of organs) {
    const organLower = organ.name.toLowerCase();
    const matched = keywords.filter((kw) => organLower.includes(kw));
    if (matched.length >= 2) return organ;
  }

  return null;
}

function LandingGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === "תשלום") {
      sessionStorage.setItem("order-unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background video */}
      <video
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-20" : "opacity-0"}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onPlaying={() => setVideoLoaded(true)}
      >
        <source src="/videos/hero-object-video.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        {/* Animated Logo */}
        <div className="animate-fade-in-up">
          <div className="relative animate-pulse-glow rounded-full" style={{ width: 120, height: 120 }}>
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: "#0F508E" }}
            />
            <img
              src="/logo.png"
              alt="Motty Beats"
              width={120}
              height={120}
              className="relative z-10 rounded-full"
            />
            <div
              className="absolute z-20 rounded-full bg-white shadow-lg animate-ball-bounce"
              style={{
                width: 19,
                height: 19,
                top: 20,
                right: 41,
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center animate-fade-in-up-delay">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">מוטי רוזנפלד</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">עדכוני סאונדים ומקצבים לאורגנים | Yamaha</p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4 animate-fade-in-up-delay-2">
          <p className="text-gray-600 text-center text-sm">
            הזינו את סיסמת הכניסה כדי להמשיך לדף התשלום
          </p>
          <div className="w-full max-w-xs">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              className={`w-full px-4 py-3 rounded-lg border-2 text-center text-base sm:text-lg focus:outline-none transition-colors ${
                error
                  ? "border-red-400 bg-red-50 shake"
                  : "border-blue-200 focus:border-blue-500 bg-white"
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm text-center mt-2">סיסמה שגויה, נסו שוב</p>
            )}
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            כניסה לדף התשלום
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const [unlocked, setUnlocked] = useState(false);
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
  const [additionalInfoFile, setAdditionalInfoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<{ name: string; discountPercent: number; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detectedInstrument, setDetectedInstrument] = useState<InstrumentInfo | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectionFailed, setDetectionFailed] = useState(false);
  const [additionalDetectedInstrument, setAdditionalDetectedInstrument] = useState<InstrumentInfo | null>(null);
  const [additionalAutoDetected, setAdditionalAutoDetected] = useState(false);
  const [additionalDetectionFailed, setAdditionalDetectionFailed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("order-unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${CRM}/api/public/organs`).then((r) => {
        if (!r.ok) throw new Error("שגיאה בטעינת רשימת אורגנים");
        return r.json();
      }),
      fetch(`${CRM}/api/public/sets`).then((r) => {
        if (!r.ok) throw new Error("שגיאה בטעינת רשימת סטים");
        return r.json();
      }),
      fetch(`${CRM}/api/public/updates`).then((r) => {
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
      setDetectionFailed(false);
      setOrganId("");

      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const buf = new Uint8Array(reader.result as ArrayBuffer);
        const info = parseN27(buf);
        setDetectedInstrument(info);

        if (info.name && organs.length > 0) {
          const matched = matchOrgan(info.name, organs, info.waveUnits);
          if (matched) {
            setOrganId(matched.id);
            setAutoDetected(true);
          } else {
            setDetectionFailed(true);
          }
        } else {
          setDetectionFailed(true);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [organs]
  );

  const handleAdditionalFileChange = useCallback(
    (file: File | null) => {
      setAdditionalInfoFile(file);
      setAdditionalDetectedInstrument(null);
      setAdditionalAutoDetected(false);
      setAdditionalDetectionFailed(false);

      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const buf = new Uint8Array(reader.result as ArrayBuffer);
        const info = parseN27(buf);
        setAdditionalDetectedInstrument(info);

        if (info.name && organs.length > 0) {
          const matched = matchOrgan(info.name, organs, info.waveUnits);
          if (matched) {
            setAdditionalAutoDetected(true);
          } else {
            setAdditionalDetectionFailed(true);
          }
        } else {
          setAdditionalDetectionFailed(true);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [organs]
  );

  const validateCoupon = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCouponDiscount(null);
      setCouponError("");
      return;
    }
    setCouponValidating(true);
    setCouponError("");
    try {
      const fd = new FormData();
      fd.append("couponCode", trimmed);
      const res = await fetch(`${CRM}/api/public/validate-coupon`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.valid && data.promotion) {
        setCouponDiscount(data.promotion);
        setCouponError("");
      } else {
        setCouponDiscount(null);
        setCouponError(data.error || "קוד קופון לא תקין");
      }
    } catch {
      setCouponDiscount(null);
      setCouponError("שגיאה בבדיקת הקופון");
    } finally {
      setCouponValidating(false);
    }
  }, []);

  const additionalMatchedOrgan = additionalDetectedInstrument?.name
    ? matchOrgan(additionalDetectedInstrument.name, organs, additionalDetectedInstrument.waveUnits)
    : null;

  const selectedSet = sets.find((s) => s.id === setTypeId);
  const selectedUpdate = updates.find((u) => u.id === updateVersionId);
  const isCustom = setTypeId === "__custom__";
  const customAmountNum = Number(customAmount) || 0;
  const basePrice = isCustom
    ? customAmountNum
    : isUpdateOnly
      ? Number(selectedUpdate?.price || 0)
      : Number(selectedSet?.price || 0);

  let totalPrice = basePrice;
  if (couponDiscount) {
    if (couponDiscount.discountAmount > 0) {
      totalPrice = Math.max(0, basePrice - couponDiscount.discountAmount);
    } else if (couponDiscount.discountPercent > 0) {
      totalPrice = Math.round(basePrice * (1 - couponDiscount.discountPercent / 100));
    }
  }

  const selectedOrgan = organs.find((o) => o.id === organId);
  const canSubmit =
    fullName.length >= 2 &&
    phone.length >= 9 &&
    email.includes("@") &&
    organId &&
    infoFile &&
    agreedToTerms &&
    (isCustom ? customAmountNum > 0 : isUpdateOnly ? !!updateVersionId : !!setTypeId) &&
    (totalPrice > 0 || (totalPrice === 0 && couponDiscount != null));

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
      setError("לא זוהה אורגן מקובץ האינפו — נסו להעלות קובץ אחר");
      return;
    }
    if (isCustom && customAmountNum <= 0) {
      setError("יש להזין סכום תקין");
      return;
    }
    if (!isCustom && !isUpdateOnly && !setTypeId) {
      setError("יש לבחור סוג סט");
      return;
    }
    if (!isCustom && isUpdateOnly && !updateVersionId) {
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
      if (isCustom) {
        fd.append("customAmount", String(customAmountNum));
        if (customDescription.trim()) fd.append("customDescription", customDescription.trim());
      } else {
        if (setTypeId) fd.append("setTypeId", setTypeId);
        if (updateVersionId) fd.append("updateVersionId", updateVersionId);
      }
      if (notes) fd.append("notes", notes);
      if (couponCode.trim()) fd.append("couponCode", couponCode.trim());
      fd.append("infoFile", infoFile);
      if (additionalInfoFile) {
        fd.append("additionalInfoFile", additionalInfoFile);
      }
      const billingFromEnv = process.env.NEXT_PUBLIC_BILLING_PROVIDER?.trim();
      if (billingFromEnv) {
        fd.append("billingProvider", billingFromEnv);
      }

      const res = await fetch(`${CRM}/api/public/create-payment`, {
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

  if (!unlocked) {
    return <LandingGate onUnlock={() => setUnlocked(true)} />;
  }

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
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">טופס הזמנה</h2>
        <p className="text-gray-500 mt-1">
          העלו קובץ אינפו, בחרו מוצר ומלאו פרטים לתשלום
        </p>
      </div>

      {/* שלב 1 — העלאת קובץ אינפו + זיהוי אורגן */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Upload className="h-5 w-5 text-teal-500" />
          שלב 1 — העלאת קובץ אינפו
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          העלו את קובץ האינפו מהאורגן שלכם — המערכת תזהה אוטומטית את סוג האורגן
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
            infoFile
              ? autoDetected
                ? "border-green-300 bg-green-50"
                : detectionFailed
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50"
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
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{infoFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({(infoFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              {autoDetected && selectedOrgan && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 mx-auto w-fit">
                  <div className="flex items-center justify-center gap-2 text-green-800">
                    <Music className="h-5 w-5" />
                    <span className="text-base font-bold">
                      {selectedOrgan.name}
                    </span>
                  </div>
                  {detectedInstrument?.serial && (
                    <p className="text-xs text-green-600 mt-1 text-center">
                      S/N: {detectedInstrument.serial}
                    </p>
                  )}
                </div>
              )}
              {detectionFailed && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 mx-auto">
                  <div className="flex items-center justify-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      לא הצלחנו לזהות את האורגן מהקובץ
                    </span>
                  </div>
                  {detectedInstrument?.name && (
                    <p className="text-xs text-red-600 mt-1 text-center">
                      זוהה: {detectedInstrument.name} — אורגן זה אינו ברשימה
                    </p>
                  )}
                  <p className="text-xs text-red-500 mt-2 text-center">
                    נסו להעלות קובץ אינפו אחר, או צרו קשר לקבלת סיוע
                  </p>
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
              setDetectionFailed(false);
              setOrganId("");
              const el = document.getElementById("infoFile") as HTMLInputElement;
              if (el) el.value = "";
            }}
          >
            הסר קובץ
          </button>
        )}

        {/* אורגן נוסף הוסר */}
        {false && autoDetected && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div
              className="border-gray-200"
              onClick={() => document.getElementById("additionalInfoFile")?.click()}
            >
              <input
                id="additionalInfoFile"
                type="file"
                accept=".n27"
                className="hidden"
                onChange={(e) => handleAdditionalFileChange(e.target.files?.[0] || null)}
              />
              {additionalInfoFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-purple-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{additionalInfoFile!.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(additionalInfoFile!.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {additionalAutoDetected && additionalMatchedOrgan && (
                    <div className="bg-purple-100 border border-purple-300 rounded-lg p-2 mx-auto w-fit">
                      <div className="flex items-center justify-center gap-2 text-purple-800">
                        <Music className="h-4 w-4" />
                        <span className="text-sm font-bold">{additionalMatchedOrgan?.name}</span>
                      </div>
                      {additionalDetectedInstrument?.serial && (
                        <p className="text-xs text-purple-600 mt-1 text-center">
                          S/N: {additionalDetectedInstrument?.serial}
                        </p>
                      )}
                    </div>
                  )}
                  {additionalDetectionFailed && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-2 mx-auto">
                      <div className="flex items-center justify-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          לא הצלחנו לזהות את האורגן מהקובץ
                        </span>
                      </div>
                      {additionalDetectedInstrument?.name && (
                        <p className="text-xs text-red-600 mt-1 text-center">
                          זוהה: {additionalDetectedInstrument?.name} — אורגן זה אינו ברשימה
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">לחצו להעלאת קובץ אינפו מאורגן נוסף</p>
                </div>
              )}
            </div>
            {additionalInfoFile && (
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-700 mt-1"
                onClick={() => {
                  handleAdditionalFileChange(null);
                  const el = document.getElementById("additionalInfoFile") as HTMLInputElement;
                  if (el) el.value = "";
                }}
              >
                הסר קובץ נוסף
              </button>
            )}
          </div>
        )}
      </div>

      {/* שלב 3 — סוג הזמנה */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-500" />
          שלב 2 — בחירת מוצר
        </h3>
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
          {/* Custom amount card */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              isCustom
                ? "border-orange-500 bg-orange-50 shadow-sm"
                : "border-dashed border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setSetTypeId("__custom__")}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">אחר</span>
              {isCustom && (
                <CheckCircle2 className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">הזן סכום לתשלום ידנית</p>
          </div>
        </div>

        {isCustom && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סכום (₪) *
              </label>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="הזן סכום"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תיאור (אופציונלי)
              </label>
              <input
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="למשל: תשלום עבור שירות מיוחד"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* שלב 4 — פרטים אישיים */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          שלב 3 — פרטים אישיים
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מייל *
              </label>
              <EmailInput
                value={email}
                onValueChange={(val) => setEmail(val)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              קוד קופון (אם יש)
            </label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (!e.target.value.trim()) {
                    setCouponDiscount(null);
                    setCouponError("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    validateCoupon(couponCode);
                  }
                }}
                placeholder="הזן קוד קופון..."
                dir="ltr"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                disabled={!couponCode.trim() || couponValidating}
                onClick={() => validateCoupon(couponCode)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 min-h-[44px]"
              >
                {couponValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "החל"
                )}
              </button>
            </div>
            {couponDiscount && (
              <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  קופון <strong>{couponDiscount.name}</strong> —{" "}
                  {couponDiscount.discountAmount > 0
                    ? `${couponDiscount.discountAmount} ₪ הנחה`
                    : `${couponDiscount.discountPercent}% הנחה`}
                </span>
              </div>
            )}
            {couponError && (
              <p className="mt-1 text-sm text-red-600">{couponError}</p>
            )}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* תנאי שימוש */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-5 w-5 min-w-[20px] rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            קראתי ואני מסכים ל
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              תנאי השימוש והסכם הרכישה
            </a>
          </span>
        </label>
      </div>

      {/* שגיאה */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* סיכום + תשלום */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
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

        {couponDiscount && basePrice > 0 && totalPrice < basePrice && (
          <div className="bg-white rounded-lg p-3 mb-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>מחיר מקורי:</span>
              <span className="line-through">{basePrice.toLocaleString()} ₪</span>
            </div>
            <div className="flex justify-between text-green-700 font-medium">
              <span>הנחת קופון ({couponDiscount.name}):</span>
              <span>-{(basePrice - totalPrice).toLocaleString()} ₪</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-base sm:text-lg">סה&quot;כ לתשלום:</span>
          <span className="text-2xl sm:text-3xl font-bold text-blue-600">
            {totalPrice > 0 ? `${totalPrice.toLocaleString()} ₪` : totalPrice === 0 && couponDiscount ? "חינם!" : "—"}
          </span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="w-full h-12 sm:h-12 min-h-[48px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base sm:text-lg font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
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
                ? "לא זוהה אורגן — נסו קובץ אחר"
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
                          : !agreedToTerms
                            ? "יש לאשר את תנאי השימוש"
                            : ""}
          </p>
        )}
        <p className="text-xs text-center text-gray-500 mt-3">
          התשלום מבוצע באופן מאובטח
        </p>
      </div>
    </form>
  );
}
