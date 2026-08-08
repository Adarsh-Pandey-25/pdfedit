"use client";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  thumbs: string[];
  pageOrder: number[];
  setPageOrder: (fn: (ord: number[]) => number[]) => void;
  setPage: (n: number) => void;
};

/** Enhanced page manager (used by EditClient manageOpen or as standalone) */
export function ManagePagesModal({
  open,
  onClose,
  thumbs,
  pageOrder,
  setPageOrder,
  setPage,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-auto p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Manage pages</h2>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pageOrder.map((pi, orderIdx) => (
            <div key={pi} className="card-surface rounded-xl p-2 text-center">
              {thumbs[pi] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[pi]} alt="" className="w-full rounded-lg mb-2" />
              ) : (
                <div className="skeleton aspect-[3/4] mb-2" />
              )}
              <p className="text-xs font-medium mb-1">Page {pi + 1}</p>
              <div className="flex justify-center gap-1 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  onClick={() => {
                    setPage(pi + 1);
                    onClose();
                  }}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  disabled={orderIdx === 0}
                  onClick={() =>
                    setPageOrder((ord) => {
                      const n = [...ord];
                      [n[orderIdx - 1], n[orderIdx]] = [
                        n[orderIdx],
                        n[orderIdx - 1],
                      ];
                      return n;
                    })
                  }
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  disabled={orderIdx === pageOrder.length - 1}
                  onClick={() =>
                    setPageOrder((ord) => {
                      const n = [...ord];
                      [n[orderIdx + 1], n[orderIdx]] = [
                        n[orderIdx],
                        n[orderIdx + 1],
                      ];
                      return n;
                    })
                  }
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  onClick={() =>
                    setPageOrder((ord) => {
                      const n = [...ord];
                      n.splice(orderIdx + 1, 0, n[orderIdx]);
                      return n;
                    })
                  }
                >
                  Dup
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
