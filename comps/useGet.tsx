import { useEffect, useState } from "react";

type Opts = {
  disabled?: boolean;
};

export const useGet = <Data,>(arg: () => Promise<Data>, opts?: Opts) => {
  const [l, sl] = useState(true);
  const [e, se] = useState(null);
  const [d, sd] = useState<Data | null>(null);

  useEffect(() => {
    if (opts && opts.disabled && typeof opts.disabled === "boolean") return;
    (async () => {
      try {
        const res = await arg();
        sd(res);
        sl(false);
      } catch (err: any) {
        se(err);
        sl(false);
      }
    })();
  }, [opts]);

  return {
    loading: l,
    error: e,
    data: d,
  };
};
