import React from "react";

const ScrollableLayout = ({ children, disableSnap = false }) => {
  return (
    <div
      className={`min-h-screen w-full overflow-y-scroll overflow-x-hidden text-white scroll-smooth ${
        disableSnap ? "" : "snap-y snap-mandatory"
      }`}
    >
      <div className="relative">{children}</div>
    </div>
  );
};

export default ScrollableLayout;
