import { useEffect, useState } from "react";

export const useGet = <Data,>(arg: () => Promise<Data>) => {
  const [l, sl] = useState(true);
  const [e, se] = useState(null);
  const [d, sd] = useState<Data | null>(null);

  useEffect(() => {
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
  }, []);

  return {
    loading: l,
    error: e,
    data: d,
  };
};
