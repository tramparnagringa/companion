export function PageLoadingBar() {
  return (
    <>
      <style>{`
        @keyframes loading-bar-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(450%); }
        }
        .page-loading-track {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: transparent;
          z-index: 9999;
          overflow: hidden;
        }
        .page-loading-fill {
          width: 25%;
          height: 100%;
          background: var(--tng-coral);
          border-radius: 0 2px 2px 0;
          animation: loading-bar-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="page-loading-track">
        <div className="page-loading-fill" />
      </div>
    </>
  )
}
