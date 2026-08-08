"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { protectPdf } from "@/lib/pdf/operations";
import { downloadBlob , pdfBlob} from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function ProtectClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [printing, setPrinting] = useState(true);
  const [copying, setCopying] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    setBuffer(await files[0].arrayBuffer());
    setResult(null);
    toast.success("PDF loaded");
  }, []);

  const protect = async () => {
    if (!buffer) return;
    if (!userPassword && !ownerPassword) {
      toast.error("Set at least one password");
      return;
    }
    setProcessing(true);
    setProgress(40);
    try {
      const bytes = await protectPdf(buffer, userPassword, ownerPassword, {
        printing,
        copying,
        modifying,
      });
      setProgress(100);
      setResult(pdfBlob(bytes));
      confetti();
      toast.success("PDF protected!");
    } catch (e) {
      console.error(e);
      toast.error("Encryption failed. Try a different PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Secure", "Download"]} current={step} />
      {!buffer && (
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      )}

      {buffer && (
        <div className="mt-6 max-w-md mx-auto card-surface rounded-2xl p-6 space-y-4">
          <div>
            <Label htmlFor="user-pw">Open password</Label>
            <Input
              id="user-pw"
              type="password"
              className="mt-1.5"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="owner-pw">Edit / owner password</Label>
            <Input
              id="owner-pw"
              type="password"
              className="mt-1.5"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Permissions</legend>
            {[
              { id: "print", label: "Allow printing", checked: printing, set: setPrinting },
              { id: "copy", label: "Allow copying", checked: copying, set: setCopying },
              { id: "edit", label: "Allow editing", checked: modifying, set: setModifying },
            ].map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={p.checked}
                  onCheckedChange={(v) => p.set(v === true)}
                />
                {p.label}
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <Button onClick={protect}>Encrypt & protect</Button>
            <Button variant="outline" onClick={() => { setBuffer(null); setResult(null); }}>
              New file
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "protected.pdf")}
            filename="protected.pdf"
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Encrypting…" />
    </>
  );
}
