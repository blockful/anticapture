import Script from "next/script";
import { FC } from "react";

const HotjarScript: FC = () => {
  const hotjarScript = `
    (function (c, s, q, u, a, r, e) {
        c.hj=c.hj||function(){(c.hj.q=c.hj.q||[]).push(arguments)};
        c._hjSettings = { hjid: a };
        r = s.getElementsByTagName('head')[0];
        e = s.createElement('script');
        e.async = true;
        e.src = q + c._hjSettings.hjid + u;
        r.appendChild(e);
    })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', 5359369);
  `;
  if (process.env.NODE_ENV === "production") {
    return <Script id="hotjar">{hotjarScript}</Script>;
  }
  return null;
};

export default HotjarScript;
