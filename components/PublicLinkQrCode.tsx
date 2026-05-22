"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type PublicLinkQrCodeProps = {
  companyName: string;
  publicLink: string;
};

function getDownloadName(companyName: string) {
  const safeName = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeName || "atendeai"}-qr-code.svg`;
}

export function PublicLinkQrCode({
  companyName,
  publicLink
}: PublicLinkQrCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Link copiado.");
    } catch {
      setCopyMessage("Nao foi possivel copiar o link.");
    }
  }

  function downloadQrCode() {
    const qrCode = qrCodeRef.current?.querySelector("svg");

    if (!qrCode) {
      return;
    }

    const serializedQrCode = new XMLSerializer().serializeToString(qrCode);
    const file = new Blob([serializedQrCode], {
      type: "image/svg+xml;charset=utf-8"
    });
    const fileUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement("a");

    downloadLink.href = fileUrl;
    downloadLink.download = getDownloadName(companyName);
    downloadLink.click();
    URL.revokeObjectURL(fileUrl);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCopyMessage("");
          setIsOpen(true);
        }}
        className="min-h-11 rounded-md bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/10 transition hover:bg-mint"
      >
        QR Code
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`QR Code de ${companyName}`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-3 sm:items-center sm:p-5"
        >
          <div className="w-full max-w-md rounded-lg border border-white/20 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
                  Link publico
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-ink">
                  QR Code de {companyName}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar QR Code"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cloud text-lg font-bold text-ink transition hover:bg-mint"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div
                ref={qrCodeRef}
                className="mx-auto rounded-lg border border-ink/10 bg-white p-3"
              >
                <QRCodeSVG
                  value={publicLink}
                  size={184}
                  bgColor="#ffffff"
                  fgColor="#13241b"
                  level="M"
                  marginSize={2}
                  title={`Abrir chat publico de ${companyName}`}
                />
              </div>
              <div className="min-w-0">
                <p className="break-all rounded-md bg-cloud px-3 py-2 font-mono text-xs font-bold text-ink/70">
                  {publicLink}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink/60">
                  Escaneie para abrir o chat publico desta empresa.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyLink}
                className="min-h-11 rounded-md bg-cloud px-4 text-sm font-semibold text-ink transition hover:bg-mint"
              >
                Copiar link
              </button>
              <button
                type="button"
                onClick={downloadQrCode}
                className="min-h-11 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Baixar QR Code
              </button>
            </div>

            {copyMessage && (
              <p className="mt-3 text-sm font-semibold text-moss">{copyMessage}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
