'use client';
// import '@/components/bridge-loader.css';
export default function BridgeLoader() {
  return (
    <div className="loader-root">
      <svg
        width="180"
        height="90"
        viewBox="0 0 180 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Pillars */}
        <rect x="10" y="10" width="16" height="28" />
        <rect x="10" y="52" width="16" height="28" />

        {/* Right Pillars */}
        <rect x="154" y="10" width="16" height="28" />
        <rect x="154" y="52" width="16" height="28" />

        {/* Left curve — shared apex at 25% below */}
        <path
          d="
            M 90 28
            C 80 32, 56 54, 26 45
          "
          className="arch left"
        />

        {/* Right curve — mirrored */}
        <path
          d="
            M 90 28
            C 100 32, 124 54, 154 45
          "
          className="arch right"
        />
      </svg>
    </div>
  );
}
