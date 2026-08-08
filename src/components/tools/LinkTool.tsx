"use client";

import toast from "react-hot-toast";
import { LinkUrlDialog } from "@/components/tools/LinkUrlDialog";
import { useEditorStore } from "@/lib/editor-store";

/**
 * Hosts the Links tool URL dialog and commits create/edit to the store.
 * Other tools are unaffected.
 */
export function LinkToolHost() {
  const pendingLink = useEditorStore((s) => s.pendingLink);
  const setPendingLink = useEditorStore((s) => s.setPendingLink);
  const addElement = useEditorStore((s) => s.addElement);
  const updateElementData = useEditorStore((s) => s.updateElementData);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const setTool = useEditorStore((s) => s.setTool);
  const selectElement = useEditorStore((s) => s.selectElement);

  const close = () => setPendingLink(null);

  return (
    <LinkUrlDialog
      open={!!pendingLink}
      initialUrl={pendingLink?.initialUrl || "https://"}
      title={pendingLink?.editId ? "Edit link" : "Add link"}
      onCancel={() => {
        close();
        setTool("select");
      }}
      onConfirm={(url) => {
        if (!pendingLink) return;
        if (pendingLink.editId) {
          pushHistory();
          updateElementData(pendingLink.editId, { url });
          selectElement(pendingLink.editId);
          toast.success("Link updated");
        } else {
          const id = addElement({
            type: "link",
            pageIndex: pendingLink.pageIndex,
            x: pendingLink.x,
            y: pendingLink.y,
            width: pendingLink.width,
            height: pendingLink.height,
            rotation: 0,
            opacity: 1,
            data: { url },
          });
          selectElement(id);
          toast.success("Link added — clickable after Done download");
        }
        close();
        setTool("select");
      }}
    />
  );
}
