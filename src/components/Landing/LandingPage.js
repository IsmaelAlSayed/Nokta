import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/LandingPage.css";

const purchases = [
  { pts: 18, lbl: "قهوة" }, { pts: 45, lbl: "وجبة" },
  { pts: 28, lbl: "تسوق" }, { pts: 60, lbl: "عشاء" },
  { pts: 22, lbl: "مشروب" }, { pts: 50, lbl: "حلويات" },
  { pts: 35, lbl: "غداء" }, { pts: 40, lbl: "شراء" },
];

const LandingPage = () => {
  const [dark, setDark] = useState(
    () => !window.matchMedia("(prefers-color-scheme: light)").matches
  );

  const ptsNumRef  = useRef(null);
  const progFill   = useRef(null);
  const progPct    = useRef(null);
  const floatersEl = useRef(null);
  const cardEl     = useRef(null);
  const p1Ref      = useRef(null);
  const p2Ref      = useRef(null);
  const p3Ref      = useRef(null);

  /* ── card animation ── */
  useEffect(() => {
    let pts = 0;
    let purchaseIdx = 0;
    let timeoutId;
    const MAX = 750;

    function animateNum(from, to, el, dur = 550) {
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        if (el) el.textContent = Math.round(from + (to - from) * ease);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function addFloater(lbl, amount) {
      if (!floatersEl.current) return;
      const f = document.createElement("div");
      f.className = "lp-floater";
      f.style.left = 20 + Math.random() * 55 + "%";
      f.textContent = `+${amount} — ${lbl}`;
      floatersEl.current.appendChild(f);
      setTimeout(() => f.remove(), 3300);
    }

    function syncCard(prevPts) {
      const pct = Math.min((pts / MAX) * 100, 100);
      animateNum(prevPts, pts, ptsNumRef.current);
      if (progFill.current)  progFill.current.style.width = pct + "%";
      if (progPct.current)   progPct.current.textContent  = Math.round(pct) + "%";
      if (p1Ref.current) p1Ref.current.className = "lp-prize-chip" + (pts >= 250 ? " unlocked" : "");
      if (p2Ref.current) p2Ref.current.className = "lp-prize-chip" + (pts >= 500 ? " unlocked" : "");
      if (p3Ref.current) p3Ref.current.className = "lp-prize-chip" + (pts >= 750 ? " unlocked" : "");

      if (pts >= MAX) {
        cardEl.current?.classList.add("lp-card-glow");
        setTimeout(() => {
          cardEl.current?.classList.remove("lp-card-glow");
          const prev = pts;
          pts = 0;
          if (ptsNumRef.current) ptsNumRef.current.textContent = "0";
          syncCard(prev);
        }, 2200);
      }
    }

    function doPurchase() {
      const { pts: add, lbl } = purchases[purchaseIdx++ % purchases.length];
      addFloater(lbl, add);
      const prev = pts;
      pts = Math.min(pts + add, MAX);
      syncCard(prev);
      timeoutId = setTimeout(doPurchase, 1300 + Math.random() * 900);
    }

    timeoutId = setTimeout(doPurchase, 1400);
    return () => clearTimeout(timeoutId);
  }, []);

  /* ── scroll reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("lp-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={`lp-root${dark ? "" : " lp-light"}`}>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-brand">
          نقطة<span className="lp-brand-dot">.</span>
        </div>
        <ul className="lp-nav-links">
          <li><a href="#managers">للتجار</a></li>
          <li><a href="#how">كيف يعمل</a></li>
          <li><a href="#customers">للزبائن</a></li>
        </ul>
        <div className="lp-nav-end">
          <button className="lp-btn-theme" onClick={() => setDark((d) => !d)} aria-label="تبديل الثيم">
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/login" className="lp-btn-nav">ابدأ الآن</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">

          <div>
            <div className="lp-pill">
              <span className="lp-pill-dot" />
              منصة الولاء الذكي
            </div>
            <h1 className="lp-h1">
              اجعل كل شراء<br />
              <span className="lp-h1-grad">يستحق العودة</span>
            </h1>
            <p className="lp-hero-sub">
              نقطة تمنح التجار أدوات احترافية لبناء ولاء حقيقي مع زبائنهم —
              برامج نقاط، جوائز، وإشعارات فورية، كل شيء في مكان واحد.
            </p>
            <div className="lp-hero-btns">
              <Link to="/login" className="lp-btn-primary">ابدأ كتاجر ←</Link>
              <Link to="/stores" className="lp-btn-ghost">استكشف المتاجر</Link>
            </div>
          </div>

          <div className="lp-card-wrap">
            <div className="lp-card" ref={cardEl}>
              <span className="lp-card-nun" aria-hidden="true">ن</span>
              <div className="lp-card-top">
                <span className="lp-card-brand">نقطة ✦</span>
                <span className="lp-card-tier">ذهبي</span>
              </div>
              <div className="lp-pts-lbl">رصيدك الحالي</div>
              <div className="lp-pts-num" ref={ptsNumRef}>0</div>
              <div className="lp-pts-unit">نقطة</div>
              <div className="lp-prog-hdr">
                <span className="lp-prog-lbl">الجائزة التالية</span>
                <span className="lp-prog-pct" ref={progPct}>0%</span>
              </div>
              <div className="lp-prog-track">
                <div className="lp-prog-fill" ref={progFill} />
              </div>
              <div className="lp-prizes-row">
                <div className="lp-prize-chip" ref={p1}>
                  <span className="lp-prize-icon">☕</span>250 نقطة
                </div>
                <div className="lp-prize-chip" ref={p2}>
                  <span className="lp-prize-icon">🎁</span>500 نقطة
                </div>
                <div className="lp-prize-chip" ref={p3}>
                  <span className="lp-prize-icon">⭐</span>750 نقطة
                </div>
              </div>
              <div className="lp-floaters" ref={floatersEl} aria-hidden="true" />
            </div>
          </div>

        </div>
      </section>

      {/* ── MANAGERS FEATURES ── */}
      <section className="lp-section lp-feat-bg" id="managers">
        <div className="lp-inner">
          <span className="lp-eyebrow lp-reveal">للتجار</span>
          <h2 className="lp-s-title lp-reveal">كل ما تحتاجه لبناء ولاء<br />دائم مع زبائنك</h2>
          <p className="lp-s-sub lp-reveal">منصة متكاملة تعطيك السيطرة الكاملة على برامج الولاء والزبائن والطلبات.</p>

          <div className="lp-feat-grid">
            <div className="lp-feat-card lp-wide lp-reveal">
              <div className="lp-feat-ico">🏆</div>
              <div className="lp-feat-title">برامج ولاء مخصصة لمتجرك</div>
              <p className="lp-feat-desc">صمّم برنامج نقاط يعكس هوية متجرك — حدد معدل الأرباح لكل شيكل، أضف جوائز بالصور والأوصاف، وخصّص البرنامج للزبائن الذين تختارهم. كل برنامج مستقل وقابل للتعديل في أي وقت.</p>
            </div>
            <div className="lp-feat-card lp-reveal">
              <div className="lp-feat-ico">👥</div>
              <div className="lp-feat-title">إدارة الزبائن</div>
              <p className="lp-feat-desc">أضف زبائن جدداً، تتبّع نقاطهم، واربط الزبائن المشتركين مع متاجر أخرى.</p>
            </div>
            <div className="lp-feat-card lp-reveal">
              <div className="lp-feat-ico">📦</div>
              <div className="lp-feat-title">إدارة الطلبات</div>
              <p className="lp-feat-desc">أضف طلبات الشراء وتتبّع حالتها خطوة بخطوة. النقاط تُضاف تلقائياً مع كل طلب.</p>
            </div>
            <div className="lp-feat-card lp-reveal">
              <div className="lp-feat-ico">🎁</div>
              <div className="lp-feat-title">استبدال الجوائز</div>
              <p className="lp-feat-desc">اقبل أو ارفض طلبات الاسترداد مع تفسير السبب. النقاط تُرجع تلقائياً عند الرفض.</p>
            </div>
            <div className="lp-feat-card lp-reveal">
              <div className="lp-feat-ico">🔔</div>
              <div className="lp-feat-title">إشعارات فورية</div>
              <p className="lp-feat-desc">أبلغ زبائنك بحالة طلباتهم وعروضك الجديدة مباشرة داخل التطبيق.</p>
            </div>
            <div className="lp-feat-card lp-reveal">
              <div className="lp-feat-ico">💬</div>
              <div className="lp-feat-title">الدعم الفني</div>
              <p className="lp-feat-desc">رد على استفسارات زبائنك وتذاكر الدعم مباشرة من لوحة تحكم واحدة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-how-bg" id="how">
        <div className="lp-inner">
          <span className="lp-eyebrow lp-reveal">كيف يعمل</span>
          <h2 className="lp-s-title lp-reveal">ثلاث خطوات — من التسجيل<br />إلى أول جائزة</h2>
          <p className="lp-s-sub lp-reveal">بدون تعقيد. التاجر يُعدّ البرنامج مرة واحدة والنظام يعمل تلقائياً.</p>
          <div className="lp-steps">
            <div className="lp-step lp-reveal">
              <div className="lp-step-num">١</div>
              <div className="lp-step-title">التاجر ينشئ برنامجه</div>
              <p className="lp-step-desc">يسجّل التاجر متجره، يضع معدل النقاط، ويضيف جوائزه وقائمة زبائنه.</p>
            </div>
            <div className="lp-step lp-reveal">
              <div className="lp-step-num">٢</div>
              <div className="lp-step-title">الزبون يجمع النقاط</div>
              <p className="lp-step-desc">مع كل عملية شراء تُضاف النقاط تلقائياً — الزبون يرى رصيده يكبر بعد كل طلب.</p>
            </div>
            <div className="lp-step lp-reveal">
              <div className="lp-step-num">٣</div>
              <div className="lp-step-title">الاستبدال والمكافأة</div>
              <p className="lp-step-desc">يختار الزبون جائزته ويرسل طلباً. التاجر يوافق ويرسلها للمنزل أو يحضّرها للاستلام.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMERS FEATURES ── */}
      <section className="lp-section lp-cust-bg" id="customers">
        <div className="lp-inner">
          <span className="lp-eyebrow lp-reveal">للزبائن</span>
          <h2 className="lp-s-title lp-reveal">كل شراء يقرّبك<br />من جائزتك التالية</h2>
          <p className="lp-s-sub lp-reveal">تتبّع نقاطك لدى متاجرك المفضلة في مكان واحد واستبدلها بجوائز حقيقية.</p>
          <div className="lp-cust-grid">
            <div className="lp-cust-card lp-reveal">
              <div className="lp-feat-ico">💰</div>
              <div className="lp-feat-title">اكسب مع كل شراء</div>
              <p className="lp-feat-desc">نقاطك تتراكم تلقائياً بعد كل طلب تضعه في أي متجر شارك في نقطة.</p>
            </div>
            <div className="lp-cust-card lp-reveal">
              <div className="lp-feat-ico">🎁</div>
              <div className="lp-feat-title">جوائز حقيقية</div>
              <p className="lp-feat-desc">استبدل نقاطك بمنتجات، خصومات، أو هدايا يختارها التاجر خصيصاً لك.</p>
            </div>
            <div className="lp-cust-card lp-reveal">
              <div className="lp-feat-ico">📊</div>
              <div className="lp-feat-title">تتبّع رصيدك</div>
              <p className="lp-feat-desc">اعرف كم نقطة جمعت وكم تبقّى للجائزة التالية لحظة بلحظة.</p>
            </div>
            <div className="lp-cust-card lp-reveal">
              <div className="lp-feat-ico">🏪</div>
              <div className="lp-feat-title">متاجر متعددة</div>
              <p className="lp-feat-desc">انضم لأكثر من متجر وتابع رصيد كل برنامج بشكل مستقل في مكان واحد.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="lp-section lp-caps-bg">
        <div className="lp-inner lp-caps-inner">
          <div className="lp-caps-grid">
            <div className="lp-reveal">
              <div className="lp-cap-num">لحظي</div>
              <div className="lp-cap-lbl">تحديث رصيد النقاط بعد كل طلب</div>
            </div>
            <div className="lp-reveal">
              <div className="lp-cap-num">غير محدود</div>
              <div className="lp-cap-lbl">عدد الزبائن والبرامج لكل تاجر</div>
            </div>
            <div className="lp-reveal">
              <div className="lp-cap-num">100%</div>
              <div className="lp-cap-lbl">عربي — واجهة وخدمة ودعم</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-section lp-cta-bg">
        <div className="lp-inner">
          <div className="lp-cta-card lp-reveal">
            <div className="lp-cta-inner">
              <h2 className="lp-cta-title">هل أنت مستعد لبدء برنامج<br />ولاء متجرك؟</h2>
              <p className="lp-cta-sub">انضم إلى نقطة الآن وابنِ علاقة أقوى وأطول مع زبائنك.</p>
              <div className="lp-cta-btns">
                <Link to="/login" className="lp-btn-primary">ابدأ كتاجر مجاناً ←</Link>
                <Link to="/stores" className="lp-btn-ghost">استكشف المتاجر</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <p>
          <strong>نقطة<span className="lp-footer-accent">.</span></strong>
          {" "}— برنامج الولاء الذكي &nbsp;·&nbsp; جميع الحقوق محفوظة © 2025
        </p>
        <p style={{ marginTop: ".4rem" }}>
          <Link to="/login">تسجيل الدخول</Link>
          &nbsp;·&nbsp;
          <Link to="/stores">استكشاف المتاجر</Link>
        </p>
      </footer>

    </div>
  );
};

export default LandingPage;
