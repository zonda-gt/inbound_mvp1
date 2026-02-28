"use client";

interface JournalScreenProps {
  onNavigate: (screen: string) => void;
}

export default function JournalScreen({ onNavigate }: JournalScreenProps) {
  return (
    <div className="v2-scroll-body">
      {/* ───── 1. Header ───── */}
      <section className="v2-journal-hdr v2-fade-up v2-d1">
        <div className="v2-journal-title-row">
          <h1 className="v2-journal-title">My Journey</h1>
          <button className="v2-journal-add-btn">+</button>
        </div>
        <p className="v2-journal-sub">
          Shanghai &middot; Day 4 of your trip
        </p>
      </section>

      {/* ───── 2. Trip Stats ───── */}
      <section className="v2-trip-stats v2-fade-up v2-d1">
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num red">12</span>
          <span className="v2-trip-stat-label">Places visited</span>
        </div>
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num">3</span>
          <span className="v2-trip-stat-label">Dishes tried</span>
        </div>
        <div className="v2-trip-stat">
          <span className="v2-trip-stat-num">8</span>
          <span className="v2-trip-stat-label">Photos scanned</span>
        </div>
      </section>

      {/* ───── 3. Dish Passport ───── */}
      <section className="v2-passport-section v2-fade-up v2-d2">
        <div className="v2-passport-card">
          <div className="v2-passport-bg-pattern" />
          <div className="v2-passport-top">
            <div>
              <h3 className="v2-passport-title">🍜 Dish Passport</h3>
              <p className="v2-passport-subtitle">
                3 of 6 Shanghai classics
              </p>
            </div>
            <span className="v2-passport-badge">Level 2</span>
          </div>
          <div className="v2-passport-dishes">
            <span className="v2-dish-stamp done">🥟</span>
            <span className="v2-dish-stamp done">🍜</span>
            <span className="v2-dish-stamp done">🫓</span>
            <span className="v2-dish-stamp">🦆</span>
            <span className="v2-dish-stamp locked">🍲</span>
            <span className="v2-dish-stamp locked">🌶️</span>
          </div>
          <div className="v2-passport-progress">
            <div className="v2-progress-bar-wrap">
              <div className="v2-progress-bar-fill" style={{ width: "50%" }} />
            </div>
            <p className="v2-progress-text">
              3 of 6 unlocked &middot; Try Peking Duck next!
            </p>
          </div>
        </div>
      </section>

      {/* ───── 4. Saved Places ───── */}
      <section className="v2-saved-section v2-fade-up v2-d3">
        <div className="v2-sec-hdr" style={{ padding: 0 }}>
          <h2 className="v2-sec-title">Saved Places</h2>
          <button className="v2-sec-link">Map view</button>
        </div>

        <div
          className="v2-saved-card"
          onClick={() => onNavigate("navigate")}
        >
          <div className="v2-saved-img">🍜</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">Xun Yu Ji Noodles</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥38</span>
              <span className="v2-pill gray">320m away</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-saved-visited">✓ Visited</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>

        <div
          className="v2-saved-card"
          onClick={() => onNavigate("navigate")}
        >
          <div className="v2-saved-img">🍱</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">COMMUNE Reserve</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥130</span>
              <span className="v2-pill gray">440m away</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-pill gray">Tonight?</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>

        <div
          className="v2-saved-card"
          onClick={() => onNavigate("navigate")}
        >
          <div className="v2-saved-img">🌃</div>
          <div className="v2-saved-body">
            <h3 className="v2-saved-name">Bar Rouge, The Bund</h3>
            <div className="v2-saved-meta">
              <span className="v2-pill gray">¥80 cocktails</span>
            </div>
          </div>
          <div className="v2-saved-right">
            <span className="v2-pill gold">On plan</span>
            <span className="v2-saved-nav">→</span>
          </div>
        </div>
      </section>

      {/* ───── 5. Trip Diary ───── */}
      <section className="v2-diary-section v2-fade-up v2-d4">
        <div className="v2-sec-hdr" style={{ padding: 0 }}>
          <h2 className="v2-sec-title">Trip Diary</h2>
          <button className="v2-sec-link">+ Add note</button>
        </div>

        <div className="v2-diary-card">
          <p className="v2-diary-date">
            Thursday, 26 Feb &middot; Day 4
          </p>
          <p className="v2-diary-text">
            Finally tried xiaolongbao at Din Tai Fung &mdash; the soup inside
            explodes in your mouth. Worth every minute of the queue. Used the
            photo AI to figure out what the mystery dish next to me was (turned
            out to be scallion pancake, now obsessed).
          </p>
          <div className="v2-diary-photos">
            <div className="v2-diary-photo">
              <div className="v2-diary-photo-ph">🥟</div>
            </div>
            <div className="v2-diary-photo">
              <div className="v2-diary-photo-ph">🍜</div>
            </div>
            <div className="v2-diary-photo">
              <div className="v2-diary-photo-ph">🫓</div>
            </div>
          </div>
        </div>

        <div className="v2-diary-card">
          <p className="v2-diary-date">
            Wednesday, 25 Feb &middot; Day 3
          </p>
          <p className="v2-diary-text">
            Took the metro to The Bund &mdash; the navigation feature told me
            exactly which exit to use. Sunset over Pudong was unreal. Had
            cocktails at Bar Rouge, felt very fancy for ¥80.
          </p>
          <div className="v2-diary-photos">
            <div className="v2-diary-photo">
              <div className="v2-diary-photo-ph">🌃</div>
            </div>
            <div className="v2-diary-photo">
              <div className="v2-diary-photo-ph">🍸</div>
            </div>
          </div>
        </div>
      </section>

      <div className="v2-spacer-lg" />
    </div>
  );
}
