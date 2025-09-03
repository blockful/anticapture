// Legacy Hotjar script - kept for reference
// Use ConditionalHotjar instead for cookie consent compliance

import Script from "next/script";
import { FC } from "react";

const HotjarScript: FC = () => {
  const hotjarScript = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:5360544,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;
  if (process.env.NODE_ENV === "production") {
    return <Script id="hotjar">{hotjarScript}</Script>;
  }
  return null;
};

export default HotjarScript;
export { default as ConditionalHotjar } from "@/shared/services/hotjar/ConditionalHotjar";
