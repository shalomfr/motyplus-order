export default function TermsPage() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 text-gray-700 leading-relaxed">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          תנאי שימוש והסכם רכישה
        </h2>
        <p className="text-sm text-gray-400 mt-1">בס&quot;ד</p>
      </div>

      <p>
        בביצוע הזמנה באתר זה, הלקוח מאשר כי קרא והסכים לתנאים הבאים:
      </p>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          1. שימוש אישי בלבד
        </h3>
        <p>
          המקצבים והדגימות הינם אישיים ואינם ניתנים להעברה, העתקה או שיתוף עם
          אדם אחר. במקרה שיתברר כי המקצבים הועתקו או הועברו — הלקוח מתחייב
          לקנס כספי בסך <strong>10,000 ₪</strong>.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          2. אורגן אחד בלבד
        </h3>
        <ul className="list-disc pr-6 space-y-1">
          <li>
            המקצבים מותאמים לאורגן ספציפי אחד בלבד. אין להחזיק את המקצבים בשני
            אורגנים במקביל.
          </li>
          <li>
            במקרה של מכירת האורגן — המקצבים <strong>לא</strong> יימכרו יחד עימו.
          </li>
          <li>
            אין אישור להעביר מקצבים לאורגן אחר ללא אישור מפורש מהמוכר.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          3. שדרוג אורגן
        </h3>
        <p>
          במקרה של שדרוג לאורגן חדש, קיימת אפשרות חד-פעמית להעברת המקצבים
          לאורגן החדש בעלות של <strong>200 ₪</strong>, בכפוף לתנאים הבאים:
        </p>
        <ul className="list-disc pr-6 space-y-1 mt-2">
          <li>הוכחת מחיקת המקצבים מהאורגן שנמכר.</li>
          <li>עד אורגן אחד ללקוח.</li>
          <li>אך ורק באישור המוכר ולפי שיקול דעתו.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          4. שימוש באירועים
        </h3>
        <p>
          ניתן לעשות שימוש במקצבים רק באירועים של הלקוח עצמו. אין לעשות שימוש
          עבור קלידנים אחרים. השכרת האורגן מותרת אך ורק באישור מפורש מהמוכר.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          5. איסור מסירת מידע פנימי
        </h3>
        <p>
          אין להעביר מידע פנימי מתוך המקצבים ואין למסור לאדם אחר את הנתונים
          שבתוכם.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          6. מדיניות ביטולים
        </h3>
        <p>
          ניתן לבטל את הרכישה תוך <strong>7 ימים</strong> ממועד הרכישה בלבד.
          לאחר מכן — לא ניתן לבטל את העסקה.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          7. עדכונים
        </h3>
        <ul className="list-disc pr-6 space-y-1">
          <li>העדכונים הינם בונוס ואין התחייבות לספקם.</li>
          <li>
            העדכונים נשלחים במייל בצורה ברורה ומובנת, המאפשרת ללקוח להוריד
            ולהתקין בעצמו.
          </li>
          <li>
            במידה והלקוח אינו מסתדר — ניתן לפנות לתמיכה להתקנה בעלות של{" "}
            <strong>200 ₪</strong>.
          </li>
          <li>
            על הלקוח להגיע עם דיסק און קי לצורך התקנת דגימות באופן עצמאי.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          8. אחריות
        </h3>
        <ul className="list-disc pr-6 space-y-1">
          <li>האחריות על המקצבים והדגימות הינה על הלקוח בלבד.</li>
          <li>
            במקרה של מחיקת מקצבים או איפוס הגדרות — שירות להחזרת המצב לקדמותו
            בעלות של <strong>200 ₪</strong>.
          </li>
          <li>
            הוצאת דגימות CPF למחשב ו/או חיבור דגימות במחשב — בעלות של{" "}
            <strong>200 ₪</strong> בכל פעם.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          9. הפרת תנאים
        </h3>
        <p>
          העברת מקצבים לאדם אחר, או אי-שמירה על המקצבים באופן שגרם להעברתם —
          תחייב בקנס כספי בגובה עלות הסט המלאה.
        </p>
      </section>
    </div>
  );
}
